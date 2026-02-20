import OpenAI from "openai";
import { db } from "@/lib/prisma/client";
import type { AIAdCopyInput, AIBudgetOptimizationInput } from "@growthpilot/shared";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Ad Copy Generation ────────────────────────────────────────

export async function generateAdCopy(input: AIAdCopyInput): Promise<{
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  variations: Array<{
    headline: string;
    primaryText: string;
  }>;
}> {
  const product = await db.product.findUnique({
    where: { id: input.productId },
    include: {
      store: true,
      orderItems: { include: { order: true }, take: 10 },
    },
  });

  if (!product) throw new Error("Product not found");

  const orderCount = product.orderItems.length;
  const avgRating = product.aiScore ?? 0;

  const prompt = `You are an expert Meta Ads copywriter. Generate compelling ad copy for the following product.

Product: ${product.title}
Description: ${product.description ?? "No description"}
Price: $${product.price}
${product.compareAtPrice ? `Compare at: $${product.compareAtPrice}` : ""}
Category: ${product.productType ?? "General"}
Total orders: ${orderCount}
Performance score: ${avgRating}/10

Requirements:
- Tone: ${input.tone}
- Platform: ${input.platform}
- Target audience: ${input.targetAudience ?? "General shoppers"}
- Include emoji: ${input.includeEmoji}
- ${input.platform === "meta_story" ? "Keep very short, punchy, and visual" : ""}
- ${input.platform === "meta_reel" ? "Write for video overlay, keep text minimal" : ""}

Return JSON with:
{
  "headline": "...", // max 40 chars
  "primaryText": "...", // max 125 chars for feed, 80 for story
  "description": "...", // max 30 chars
  "callToAction": "SHOP_NOW | LEARN_MORE | SIGN_UP",
  "variations": [
    { "headline": "...", "primaryText": "..." },
    { "headline": "...", "primaryText": "..." }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert Meta Ads copywriter. Return only valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  return JSON.parse(content);
}

// ─── Audience Suggestions ──────────────────────────────────────

export async function suggestAudiences(
  organizationId: string,
  productIds?: string[]
): Promise<Array<{
  name: string;
  description: string;
  type: string;
  rules: Array<{ field: string; operator: string; value: unknown }>;
  estimatedSize: number;
  confidence: number;
}>> {
  // Gather store data for AI analysis
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      shopifyStores: {
        include: {
          products: { take: 50, orderBy: { aiScore: "desc" } },
          orders: {
            take: 100,
            orderBy: { createdAt: "desc" },
            include: { items: true },
          },
          customers: { take: 100 },
        },
      },
    },
  });

  if (!org?.shopifyStores[0]) throw new Error("No store connected");

  const store = org.shopifyStores[0];
  const topProducts = store.products.slice(0, 20);
  const recentOrders = store.orders;
  const customers = store.customers;

  // Calculate customer metrics
  const avgOrderValue =
    recentOrders.reduce((s, o) => s + Number(o.totalPrice), 0) / (recentOrders.length || 1);
  const repeatCustomers = customers.filter((c) => c.ordersCount > 1).length;
  const topSpenders = customers
    .sort((a, b) => Number(b.totalSpent) - Number(a.totalSpent))
    .slice(0, 10);

  const prompt = `Analyze this Shopify store data and suggest 3-5 Meta Ads audience segments.

Store data:
- Top products: ${topProducts.map((p) => `${p.title} ($${p.price}, ${p.productType})`).join("; ")}
- Average order value: $${avgOrderValue.toFixed(2)}
- Total customers: ${customers.length}
- Repeat customers: ${repeatCustomers} (${((repeatCustomers / (customers.length || 1)) * 100).toFixed(1)}%)
- Top spender avg: $${topSpenders.reduce((s, c) => s + Number(c.totalSpent), 0) / (topSpenders.length || 1)}
- Product categories: ${[...new Set(topProducts.map((p) => p.productType).filter(Boolean))].join(", ")}

Return JSON array of audience suggestions:
[{
  "name": "...",
  "description": "Why this audience works",
  "type": "CUSTOM | LOOKALIKE | SAVED",
  "rules": [{ "field": "...", "operator": "...", "value": "..." }],
  "estimatedSize": 50000,
  "confidence": 0.85
}]`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a Meta Ads audience strategist. Return only valid JSON array." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : parsed.audiences ?? [];
}

// ─── Budget Optimization ───────────────────────────────────────

export async function optimizeBudget(
  input: AIBudgetOptimizationInput
): Promise<{
  allocations: Array<{
    campaignId: string;
    campaignName: string;
    currentBudget: number;
    suggestedBudget: number;
    reason: string;
    expectedImpact: string;
  }>;
  summary: string;
  totalBudget: number;
}> {
  const campaigns = await db.campaign.findMany({
    where: { id: { in: input.campaignIds } },
    include: { metaCampaign: true },
  });

  const campaignData = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    currentBudget: Number(c.budget ?? 0),
    spend: Number(c.metaCampaign?.spend ?? 0),
    impressions: c.metaCampaign?.impressions ?? 0,
    clicks: c.metaCampaign?.clicks ?? 0,
    conversions: c.metaCampaign?.conversions ?? 0,
    revenue: Number(c.metaCampaign?.revenue ?? 0),
    roas: c.metaCampaign?.roas ?? 0,
    status: c.status,
  }));

  const prompt = `Optimize budget allocation across these Meta Ads campaigns.

Total budget: $${input.totalBudget}
Optimize for: ${input.optimizeFor}

Campaigns:
${campaignData.map((c) => `- ${c.name}: Budget $${c.currentBudget}, Spend $${c.spend}, ROAS ${c.roas}x, ${c.conversions} conversions, Revenue $${c.revenue}`).join("\n")}

Return JSON:
{
  "allocations": [
    {
      "campaignId": "...",
      "campaignName": "...",
      "currentBudget": 100,
      "suggestedBudget": 150,
      "reason": "...",
      "expectedImpact": "..."
    }
  ],
  "summary": "Brief optimization summary",
  "totalBudget": ${input.totalBudget}
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a performance marketing budget optimizer. Return only valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
    max_tokens: 800,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  return JSON.parse(content);
}

// ─── Anomaly Detection ─────────────────────────────────────────

export async function detectAnomalies(
  organizationId: string
): Promise<Array<{
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
}>> {
  // Fetch recent performance data
  const campaigns = await db.metaAdCampaign.findMany({
    where: {
      adAccount: { organizationId },
      status: "ACTIVE",
    },
    orderBy: { syncedAt: "desc" },
  });

  if (campaigns.length === 0) return [];

  const anomalies: Array<{
    type: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    title: string;
    description: string;
    metric: string;
    currentValue: number;
    expectedValue: number;
    deviation: number;
  }> = [];

  // Simple statistical anomaly detection
  for (const campaign of campaigns) {
    const spend = Number(campaign.spend);
    const clicks = campaign.clicks;
    const conversions = campaign.conversions;
    const revenue = Number(campaign.revenue);

    // Check CPA spike
    if (conversions > 0 && spend > 0) {
      const cpa = spend / conversions;
      const dailyBudget = Number(campaign.dailyBudget ?? 0);
      if (dailyBudget > 0 && cpa > dailyBudget * 0.5) {
        anomalies.push({
          type: "CPA_SPIKE",
          severity: cpa > dailyBudget ? "CRITICAL" : "HIGH",
          title: `CPA spike on ${campaign.name}`,
          description: `CPA is $${cpa.toFixed(2)}, significantly above target`,
          metric: "cpa",
          currentValue: cpa,
          expectedValue: dailyBudget * 0.3,
          deviation: ((cpa - dailyBudget * 0.3) / (dailyBudget * 0.3)) * 100,
        });
      }
    }

    // Check ROAS drop
    if (spend > 0 && revenue > 0) {
      const roas = revenue / spend;
      if (roas < 1.0) {
        anomalies.push({
          type: "ROAS_DROP",
          severity: roas < 0.5 ? "CRITICAL" : "HIGH",
          title: `Low ROAS on ${campaign.name}`,
          description: `ROAS is ${roas.toFixed(2)}x — spending more than earning`,
          metric: "roas",
          currentValue: roas,
          expectedValue: 2.0,
          deviation: ((2.0 - roas) / 2.0) * 100,
        });
      }
    }

    // Check CTR anomaly
    if (campaign.impressions > 1000 && clicks > 0) {
      const ctr = (clicks / campaign.impressions) * 100;
      if (ctr < 0.5) {
        anomalies.push({
          type: "CREATIVE_FATIGUE",
          severity: ctr < 0.2 ? "HIGH" : "MEDIUM",
          title: `Low CTR on ${campaign.name}`,
          description: `CTR is ${ctr.toFixed(2)}%, suggesting creative fatigue`,
          metric: "ctr",
          currentValue: ctr,
          expectedValue: 1.5,
          deviation: ((1.5 - ctr) / 1.5) * 100,
        });
      }
    }
  }

  // Store anomalies as insights
  for (const anomaly of anomalies) {
    await db.aIInsight.create({
      data: {
        organizationId,
        type: anomaly.type as any,
        title: anomaly.title,
        summary: anomaly.description,
        details: anomaly as any,
        impact: anomaly.severity as any,
      },
    });
  }

  return anomalies;
}

// ─── Product Scoring ───────────────────────────────────────────

export async function scoreProducts(storeId: string): Promise<number> {
  const products = await db.product.findMany({
    where: { storeId },
    include: {
      orderItems: {
        include: { order: true },
        where: {
          order: {
            createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
          },
        },
      },
    },
  });

  let scored = 0;

  for (const product of products) {
    const recentOrders = product.orderItems.length;
    const revenue = product.orderItems.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    const inventoryScore = product.inventory > 0 ? 1 : 0;
    const priceScore = product.compareAtPrice
      ? Number(product.price) < Number(product.compareAtPrice)
        ? 1.2
        : 1
      : 1;

    // Composite score (0-10)
    const score = Math.min(
      10,
      recentOrders * 0.3 + (revenue / 100) * 0.3 + inventoryScore * 2 + priceScore * 1.5
    );

    await db.product.update({
      where: { id: product.id },
      data: { aiScore: Math.round(score * 10) / 10 },
    });
    scored++;
  }

  return scored;
}
