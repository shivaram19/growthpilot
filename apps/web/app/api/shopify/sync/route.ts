import { NextRequest } from "next/server";
import { getAuthOrg, apiError, apiSuccess } from "@/lib/utils/auth";
import { createShopifyService } from "@/lib/shopify/service";

// POST /api/shopify/sync - Trigger manual sync
export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getAuthOrg();
    const { storeId, type = "all" } = await req.json();

    if (!storeId) return apiError("storeId required", 422);

    const service = await createShopifyService(storeId);
    const results: Record<string, number> = {};

    if (type === "all" || type === "products") {
      results.products = await service.syncProducts();
    }
    if (type === "all" || type === "orders") {
      results.orders = await service.syncOrders();
    }
    if (type === "all" || type === "customers") {
      results.customers = await service.syncCustomers();
    }

    return apiSuccess({ synced: results });
  } catch (error) {
    console.error("Shopify sync error:", error);
    return apiError("Sync failed", 500);
  }
}
