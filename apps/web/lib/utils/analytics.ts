import { db } from "@/lib/prisma/client";
import type { DashboardMetrics, DateRange } from "@growthpilot/shared";

export async function getDashboardMetrics(
  organizationId: string,
  dateRange?: DateRange
): Promise<DashboardMetrics> {
  const now = new Date();
  const start = dateRange?.start
    ? new Date(dateRange.start)
    : new Date(now.getTime() - 30 * 86400000);
  const end = dateRange?.end ? new Date(dateRange.end) : now;

  // Fetch store IDs for this org
  const stores = await db.shopifyStore.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const storeIds = stores.map((s) => s.id);

  // Fetch ad account IDs
  const adAccounts = await db.metaAdAccount.findMany({
    where: { organizationId },
    select: { id: true },
  });
  const adAccountIds = adAccounts.map((a) => a.id);

  // ─── Revenue & Orders ───────────────────────────────────

  const orders = await db.order.findMany({
    where: {
      storeId: { in: storeIds },
      createdAt: { gte: start, lte: end },
      financialStatus: { in: ["paid", "partially_refunded"] },
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  const totalRevenue = orders.reduce((s, o) => s + Number(o.totalPrice), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // ─── Ad Spend & Performance ─────────────────────────────

  const campaigns = await db.metaAdCampaign.findMany({
    where: {
      adAccountId: { in: adAccountIds },
    },
  });

  const totalSpend = campaigns.reduce((s, c) => s + Number(c.spend), 0);
  const impressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const clicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const conversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const metaRevenue = campaigns.reduce((s, c) => s + Number(c.revenue), 0);

  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? totalSpend / clicks : 0;
  const cpa = conversions > 0 ? totalSpend / conversions : 0;
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

  // ─── Revenue by Day ─────────────────────────────────────

  const revenueByDay: DashboardMetrics["revenueByDay"] = [];
  const dayMap = new Map<string, { revenue: number; spend: number }>();

  for (const order of orders) {
    const day = order.createdAt.toISOString().split("T")[0]!;
    const existing = dayMap.get(day) ?? { revenue: 0, spend: 0 };
    existing.revenue += Number(order.totalPrice);
    dayMap.set(day, existing);
  }

  // Fill in days
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const day = currentDate.toISOString().split("T")[0]!;
    const data = dayMap.get(day) ?? { revenue: 0, spend: 0 };
    revenueByDay.push({ date: day, ...data });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // ─── Top Products ───────────────────────────────────────

  const productSales = new Map<string, { title: string; revenue: number; orders: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      const key = item.productId ?? item.title;
      const existing = productSales.get(key) ?? { title: item.title, revenue: 0, orders: 0 };
      existing.revenue += Number(item.price) * item.quantity;
      existing.orders += 1;
      productSales.set(key, existing);
    }
  }

  const topProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // ─── Top Campaigns ──────────────────────────────────────

  const topCampaigns = campaigns
    .map((c) => ({
      id: c.id,
      name: c.name,
      spend: Number(c.spend),
      revenue: Number(c.revenue),
      roas: Number(c.spend) > 0 ? Number(c.revenue) / Number(c.spend) : 0,
    }))
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 10);

  // ─── Audience Breakdown ─────────────────────────────────

  const audiences = await db.audience.findMany({
    where: { organizationId },
    take: 10,
  });

  const audienceBreakdown = audiences.map((a) => ({
    name: a.name,
    size: a.size,
    conversions: 0, // Would need attribution data
  }));

  return {
    totalRevenue,
    totalSpend,
    roas,
    totalOrders,
    averageOrderValue,
    conversionRate,
    impressions,
    clicks,
    ctr,
    cpc,
    cpa,
    revenueByDay,
    topProducts,
    topCampaigns,
    audienceBreakdown,
  };
}

// ─── Comparison Metrics ────────────────────────────────────────

export async function getComparisonMetrics(
  organizationId: string,
  period: "day" | "week" | "month" = "month"
): Promise<{
  current: DashboardMetrics;
  previous: DashboardMetrics;
  changes: Record<string, number>;
}> {
  const now = new Date();
  let periodMs: number;

  switch (period) {
    case "day": periodMs = 86400000; break;
    case "week": periodMs = 7 * 86400000; break;
    case "month": periodMs = 30 * 86400000; break;
  }

  const currentRange: DateRange = {
    start: new Date(now.getTime() - periodMs).toISOString(),
    end: now.toISOString(),
  };

  const previousRange: DateRange = {
    start: new Date(now.getTime() - 2 * periodMs).toISOString(),
    end: new Date(now.getTime() - periodMs).toISOString(),
  };

  const [current, previous] = await Promise.all([
    getDashboardMetrics(organizationId, currentRange),
    getDashboardMetrics(organizationId, previousRange),
  ]);

  const calcChange = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0;

  const changes = {
    totalRevenue: calcChange(current.totalRevenue, previous.totalRevenue),
    totalSpend: calcChange(current.totalSpend, previous.totalSpend),
    roas: calcChange(current.roas, previous.roas),
    totalOrders: calcChange(current.totalOrders, previous.totalOrders),
    averageOrderValue: calcChange(current.averageOrderValue, previous.averageOrderValue),
    conversionRate: calcChange(current.conversionRate, previous.conversionRate),
    impressions: calcChange(current.impressions, previous.impressions),
    clicks: calcChange(current.clicks, previous.clicks),
    ctr: calcChange(current.ctr, previous.ctr),
    cpc: calcChange(current.cpc, previous.cpc),
    cpa: calcChange(current.cpa, previous.cpa),
  };

  return { current, previous, changes };
}
