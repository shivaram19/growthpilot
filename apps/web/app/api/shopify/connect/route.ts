import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma/client";
import { getAuthOrg, apiError, apiSuccess } from "@/lib/utils/auth";
import { createShopifyService } from "@/lib/shopify/service";
import { ShopifyConnectSchema } from "@growthpilot/shared";

// POST /api/shopify/connect - Connect a Shopify store
export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getAuthOrg();
    const body = await req.json();
    const parsed = ShopifyConnectSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(`Validation error: ${parsed.error.issues[0]?.message}`, 422);
    }

    const { shopDomain, accessToken, scope } = parsed.data;

    // Check if store already connected
    const existing = await db.shopifyStore.findUnique({
      where: { shopDomain },
    });

    if (existing) {
      return apiError("This store is already connected", 409);
    }

    // Create store record
    const store = await db.shopifyStore.create({
      data: {
        organizationId: orgId,
        shopDomain,
        accessToken,
        scope,
      },
    });

    // Initial sync
    const service = new (await import("@/lib/shopify/service")).ShopifyService(
      shopDomain,
      accessToken,
      store.id
    );

    // Run syncs in background
    Promise.all([
      service.syncProducts(),
      service.syncCustomers(),
      service.syncOrders(),
    ]).catch(console.error);

    return apiSuccess({ storeId: store.id, shopDomain }, undefined);
  } catch (error) {
    console.error("Shopify connect error:", error);
    return apiError("Failed to connect store", 500);
  }
}

// GET /api/shopify/connect - Get connected stores
export async function GET() {
  try {
    const { orgId } = await getAuthOrg();

    const stores = await db.shopifyStore.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { products: true, orders: true, customers: true } },
        syncLogs: { take: 5, orderBy: { startedAt: "desc" } },
      },
    });

    return apiSuccess(stores);
  } catch (error) {
    console.error("Shopify get stores error:", error);
    return apiError("Failed to fetch stores", 500);
  }
}
