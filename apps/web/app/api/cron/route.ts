import { NextRequest } from "next/server";
import { db } from "@/lib/prisma/client";
import { createShopifyService } from "@/lib/shopify/service";
import { createMetaService } from "@/lib/meta/service";
import { detectAnomalies, scoreProducts } from "@/lib/ai/service";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const secret = req.headers.get("Authorization");
  return secret === `Bearer ${process.env.CRON_SECRET}`;
}

// GET /api/cron - Run scheduled sync and analysis
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    // 1. Sync all active Shopify stores
    const stores = await db.shopifyStore.findMany({ where: { isActive: true } });
    for (const store of stores) {
      try {
        const service = await createShopifyService(store.id);
        const products = await service.syncProducts();
        const orders = await service.syncOrders();
        results[`shopify_${store.shopDomain}`] = { products, orders };
      } catch (err) {
        results[`shopify_${store.shopDomain}`] = { error: (err as Error).message };
      }
    }

    // 2. Sync all active Meta ad accounts
    const accounts = await db.metaAdAccount.findMany({ where: { isActive: true } });
    for (const account of accounts) {
      try {
        const service = await createMetaService(account.id);
        const campaigns = await service.syncCampaigns();
        results[`meta_${account.name}`] = { campaigns };
      } catch (err) {
        results[`meta_${account.name}`] = { error: (err as Error).message };
      }
    }

    // 3. Run AI anomaly detection for all orgs
    const orgs = await db.organization.findMany({ select: { id: true } });
    for (const org of orgs) {
      try {
        const anomalies = await detectAnomalies(org.id);
        results[`anomalies_${org.id}`] = { count: anomalies.length };
      } catch (err) {
        results[`anomalies_${org.id}`] = { error: (err as Error).message };
      }
    }

    // 4. Score products
    for (const store of stores) {
      try {
        const scored = await scoreProducts(store.id);
        results[`scoring_${store.id}`] = { scored };
      } catch (err) {
        results[`scoring_${store.id}`] = { error: (err as Error).message };
      }
    }

    return Response.json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Cron job error:", error);
    return Response.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
