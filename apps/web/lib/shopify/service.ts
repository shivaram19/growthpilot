import { db } from "@/lib/prisma/client";

// ─── Types ─────────────────────────────────────────────────────

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  status: string;
  image?: { src: string };
  variants: Array<{
    price: string;
    compare_at_price: string | null;
    inventory_quantity: number;
  }>;
}

interface ShopifyOrder {
  id: number;
  total_price: string;
  subtotal_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  order_number: number;
  customer?: { id: number };
  line_items: Array<{
    product_id: number | null;
    title: string;
    quantity: number;
    price: string;
  }>;
  created_at: string;
}

interface ShopifyCustomer {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  total_spent: string;
  orders_count: number;
  tags: string;
}

// ─── Shopify API Client ────────────────────────────────────────

export class ShopifyService {
  private baseUrl: string;
  private accessToken: string;
  private storeId: string;

  constructor(shopDomain: string, accessToken: string, storeId: string) {
    this.baseUrl = `https://${shopDomain}/admin/api/2024-10`;
    this.accessToken = accessToken;
    this.storeId = storeId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": this.accessToken,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new ShopifyApiError(
        `Shopify API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    return response.json();
  }

  // ─── Products ──────────────────────────────────────────────

  async syncProducts(): Promise<number> {
    let synced = 0;
    let pageInfo: string | null = null;
    const limit = 250;

    const syncLog = await db.syncLog.create({
      data: { storeId: this.storeId, type: "products", status: "running" },
    });

    try {
      do {
        const endpoint = pageInfo
          ? `/products.json?limit=${limit}&page_info=${pageInfo}`
          : `/products.json?limit=${limit}&status=active`;

        const data = await this.request<{ products: ShopifyProduct[] }>(endpoint);

        for (const product of data.products) {
          const variant = product.variants[0];
          await db.product.upsert({
            where: {
              shopifyId_storeId: {
                shopifyId: String(product.id),
                storeId: this.storeId,
              },
            },
            update: {
              title: product.title,
              description: product.body_html,
              vendor: product.vendor,
              productType: product.product_type,
              tags: product.tags.split(", ").filter(Boolean),
              status: product.status,
              imageUrl: product.image?.src,
              price: variant?.price ?? "0",
              compareAtPrice: variant?.compare_at_price,
              inventory: variant?.inventory_quantity ?? 0,
              syncedAt: new Date(),
            },
            create: {
              shopifyId: String(product.id),
              storeId: this.storeId,
              title: product.title,
              description: product.body_html,
              vendor: product.vendor,
              productType: product.product_type,
              tags: product.tags.split(", ").filter(Boolean),
              status: product.status,
              imageUrl: product.image?.src,
              price: variant?.price ?? "0",
              compareAtPrice: variant?.compare_at_price,
              inventory: variant?.inventory_quantity ?? 0,
            },
          });
          synced++;
        }

        // Handle pagination via Link header
        pageInfo = null; // Simplified — real impl parses Link header
      } while (pageInfo);

      await db.syncLog.update({
        where: { id: syncLog.id },
        data: { status: "completed", itemsCount: synced, completedAt: new Date() },
      });

      return synced;
    } catch (error) {
      await db.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  // ─── Orders ────────────────────────────────────────────────

  async syncOrders(sinceDate?: Date): Promise<number> {
    let synced = 0;
    const since = sinceDate?.toISOString() ?? new Date(Date.now() - 30 * 86400000).toISOString();

    const syncLog = await db.syncLog.create({
      data: { storeId: this.storeId, type: "orders", status: "running" },
    });

    try {
      const data = await this.request<{ orders: ShopifyOrder[] }>(
        `/orders.json?status=any&created_at_min=${since}&limit=250`
      );

      for (const order of data.orders) {
        // Find or skip customer
        let customerId: string | null = null;
        if (order.customer?.id) {
          const customer = await db.shopifyCustomer.findFirst({
            where: {
              shopifyId: String(order.customer.id),
              storeId: this.storeId,
            },
          });
          customerId = customer?.id ?? null;
        }

        const dbOrder = await db.order.upsert({
          where: {
            shopifyId_storeId: {
              shopifyId: String(order.id),
              storeId: this.storeId,
            },
          },
          update: {
            totalPrice: order.total_price,
            subtotalPrice: order.subtotal_price,
            currency: order.currency,
            financialStatus: order.financial_status,
            fulfillmentStatus: order.fulfillment_status,
          },
          create: {
            shopifyId: String(order.id),
            storeId: this.storeId,
            customerId,
            totalPrice: order.total_price,
            subtotalPrice: order.subtotal_price,
            currency: order.currency,
            financialStatus: order.financial_status,
            fulfillmentStatus: order.fulfillment_status,
            orderNumber: order.order_number,
            createdAt: new Date(order.created_at),
          },
        });

        // Upsert order items
        for (const item of order.line_items) {
          let productId: string | null = null;
          if (item.product_id) {
            const product = await db.product.findFirst({
              where: {
                shopifyId: String(item.product_id),
                storeId: this.storeId,
              },
            });
            productId = product?.id ?? null;
          }

          await db.orderItem.create({
            data: {
              orderId: dbOrder.id,
              productId,
              title: item.title,
              quantity: item.quantity,
              price: item.price,
            },
          });
        }
        synced++;
      }

      await db.syncLog.update({
        where: { id: syncLog.id },
        data: { status: "completed", itemsCount: synced, completedAt: new Date() },
      });

      return synced;
    } catch (error) {
      await db.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  // ─── Customers ─────────────────────────────────────────────

  async syncCustomers(): Promise<number> {
    let synced = 0;

    const data = await this.request<{ customers: ShopifyCustomer[] }>(
      "/customers.json?limit=250"
    );

    for (const customer of data.customers) {
      await db.shopifyCustomer.upsert({
        where: {
          shopifyId_storeId: {
            shopifyId: String(customer.id),
            storeId: this.storeId,
          },
        },
        update: {
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          totalSpent: customer.total_spent,
          ordersCount: customer.orders_count,
          tags: customer.tags.split(", ").filter(Boolean),
        },
        create: {
          shopifyId: String(customer.id),
          storeId: this.storeId,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          totalSpent: customer.total_spent,
          ordersCount: customer.orders_count,
          tags: customer.tags.split(", ").filter(Boolean),
        },
      });
      synced++;
    }

    return synced;
  }

  // ─── Webhooks ──────────────────────────────────────────────

  async registerWebhooks(callbackUrl: string): Promise<void> {
    const topics = [
      "orders/create",
      "orders/updated",
      "products/create",
      "products/update",
      "products/delete",
      "customers/create",
      "customers/update",
      "app/uninstalled",
    ];

    for (const topic of topics) {
      await this.request("/webhooks.json", {
        method: "POST",
        body: JSON.stringify({
          webhook: {
            topic,
            address: `${callbackUrl}/api/webhooks/shopify`,
            format: "json",
          },
        }),
      });
    }
  }

  // ─── Shop Info ─────────────────────────────────────────────

  async getShopInfo() {
    return this.request<{ shop: Record<string, unknown> }>("/shop.json");
  }
}

// ─── Error Class ───────────────────────────────────────────────

export class ShopifyApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body: string
  ) {
    super(message);
    this.name = "ShopifyApiError";
  }
}

// ─── Factory ───────────────────────────────────────────────────

export async function createShopifyService(storeId: string): Promise<ShopifyService> {
  const store = await db.shopifyStore.findUnique({
    where: { id: storeId },
  });

  if (!store || !store.isActive) {
    throw new Error("Shopify store not found or inactive");
  }

  return new ShopifyService(store.shopDomain, store.accessToken, storeId);
}
