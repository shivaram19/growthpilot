import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/prisma/client";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hmac = req.headers.get("X-Shopify-Hmac-Sha256");
  const topic = req.headers.get("X-Shopify-Topic");
  const shopDomain = req.headers.get("X-Shopify-Shop-Domain");

  if (!hmac || !topic || !shopDomain) {
    return new Response("Missing headers", { status: 400 });
  }

  const store = await db.shopifyStore.findUnique({ where: { shopDomain } });
  if (!store) return new Response("Not found", { status: 404 });

  const secret = store.webhookSecret ?? process.env.SHOPIFY_API_SECRET!;
  const hash = crypto.createHmac("sha256", secret).update(body, "utf-8").digest("base64");
  if (hash !== hmac) return new Response("Unauthorized", { status: 401 });

  const payload = JSON.parse(body);

  try {
    if (topic.startsWith("orders/")) {
      const variant = topic === "orders/create" ? "create" : "update";
      await db.order.upsert({
        where: { shopifyId_storeId: { shopifyId: String(payload.id), storeId: store.id } },
        update: { totalPrice: payload.total_price, financialStatus: payload.financial_status, fulfillmentStatus: payload.fulfillment_status },
        create: { shopifyId: String(payload.id), storeId: store.id, totalPrice: payload.total_price, subtotalPrice: payload.subtotal_price, currency: payload.currency, financialStatus: payload.financial_status, fulfillmentStatus: payload.fulfillment_status, orderNumber: payload.order_number },
      });
    } else if (topic === "products/delete") {
      await db.product.deleteMany({ where: { shopifyId: String(payload.id), storeId: store.id } });
    } else if (topic.startsWith("products/")) {
      const v = payload.variants?.[0];
      await db.product.upsert({
        where: { shopifyId_storeId: { shopifyId: String(payload.id), storeId: store.id } },
        update: { title: payload.title, price: v?.price ?? "0", inventory: v?.inventory_quantity ?? 0, syncedAt: new Date() },
        create: { shopifyId: String(payload.id), storeId: store.id, title: payload.title, price: v?.price ?? "0", inventory: v?.inventory_quantity ?? 0 },
      });
    } else if (topic === "app/uninstalled") {
      await db.shopifyStore.update({ where: { id: store.id }, data: { isActive: false } });
    }
  } catch (err) {
    console.error(`Webhook ${topic} error:`, err);
  }

  return new Response("OK", { status: 200 });
}
