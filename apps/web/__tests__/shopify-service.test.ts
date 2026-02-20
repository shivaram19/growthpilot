import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShopifyService, ShopifyApiError } from "@/lib/shopify/service";
import { db } from "@/lib/prisma/client";

// Create a stable mock reference that persists across clearAllMocks
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ShopifyService", () => {
  let service: ShopifyService;

  beforeEach(() => {
    // Reset all mock call history & implementations, but keep the mock functions
    mockFetch.mockReset();
    vi.mocked(db.syncLog.create).mockReset().mockResolvedValue({ id: "log-1" } as any);
    vi.mocked(db.syncLog.update).mockReset().mockResolvedValue({} as any);

    service = new ShopifyService("test.myshopify.com", "shpat_test123", "store-1");
  });

  // ─── syncProducts ──────────────────────────────────────────

  describe("syncProducts", () => {
    it("syncs products from Shopify API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: [
            {
              id: 111,
              title: "Cool T-Shirt",
              body_html: "<p>A cool shirt</p>",
              vendor: "TestBrand",
              product_type: "Apparel",
              tags: "summer, sale",
              status: "active",
              image: { src: "https://cdn.shopify.com/test.jpg" },
              variants: [{ price: "29.99", compare_at_price: "39.99", inventory_quantity: 100 }],
            },
          ],
        }),
      });

      vi.mocked(db.product.upsert).mockResolvedValue({} as any);
      const count = await service.syncProducts();

      expect(count).toBe(1);
      expect(db.product.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopifyId_storeId: { shopifyId: "111", storeId: "store-1" } },
        })
      );
      expect(db.syncLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "completed", itemsCount: 1 }),
        })
      );
    });

    it("handles API errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        text: async () => "Rate limited",
      });

      await expect(service.syncProducts()).rejects.toThrow(ShopifyApiError);
      expect(db.syncLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "failed" }),
        })
      );
    });

    it("handles products with no variants", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: [{
            id: 222, title: "No Variant Product", body_html: "", vendor: "", product_type: "",
            tags: "", status: "active", variants: [],
          }],
        }),
      });

      vi.mocked(db.product.upsert).mockResolvedValue({} as any);
      const count = await service.syncProducts();
      expect(count).toBe(1);
    });
  });

  // ─── syncOrders ────────────────────────────────────────────

  describe("syncOrders", () => {
    it("syncs orders with line items", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orders: [{
            id: 999, total_price: "149.99", subtotal_price: "139.99", currency: "USD",
            financial_status: "paid", fulfillment_status: "fulfilled", order_number: 1001,
            customer: { id: 555 },
            line_items: [{ product_id: 111, title: "Cool T-Shirt", quantity: 2, price: "29.99" }],
            created_at: "2024-01-15T10:00:00Z",
          }],
        }),
      });

      vi.mocked(db.shopifyCustomer.findFirst).mockResolvedValue({ id: "cust-1" } as any);
      vi.mocked(db.order.upsert).mockResolvedValue({ id: "order-1" } as any);
      // Use vi.mocked — findFirst is defined in setup.ts mock
      vi.mocked(db.product.findFirst).mockResolvedValue({ id: "prod-1" } as any);
      vi.mocked(db.orderItem.create).mockResolvedValue({} as any);

      const count = await service.syncOrders();
      expect(count).toBe(1);
      expect(db.orderItem.create).toHaveBeenCalled();
    });
  });

  // ─── syncCustomers ────────────────────────────────────────

  describe("syncCustomers", () => {
    it("syncs customers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          customers: [
            { id: 555, email: "test@test.com", first_name: "John", last_name: "Doe", total_spent: "500.00", orders_count: 5, tags: "vip, loyal" },
            { id: 556, email: "jane@test.com", first_name: "Jane", last_name: "Smith", total_spent: "100.00", orders_count: 1, tags: "" },
          ],
        }),
      });

      vi.mocked(db.shopifyCustomer.upsert).mockResolvedValue({} as any);
      const count = await service.syncCustomers();
      expect(count).toBe(2);
      expect(db.shopifyCustomer.upsert).toHaveBeenCalledTimes(2);
    });
  });

  // ─── registerWebhooks ──────────────────────────────────────

  describe("registerWebhooks", () => {
    it("registers all webhook topics", async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ webhook: { id: 1 } }) });

      await service.registerWebhooks("https://app.test.com");

      expect(mockFetch).toHaveBeenCalledTimes(8);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/webhooks.json"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});

describe("ShopifyApiError", () => {
  it("captures status code and body", () => {
    const error = new ShopifyApiError("Test error", 429, "Rate limited");
    expect(error.statusCode).toBe(429);
    expect(error.body).toBe("Rate limited");
    expect(error.name).toBe("ShopifyApiError");
  });
});
