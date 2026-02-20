import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardMetrics, getComparisonMetrics } from "@/lib/utils/analytics";
import { db } from "@/lib/prisma/client";

describe("getDashboardMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.shopifyStore.findMany).mockResolvedValue([{ id: "s1" } as any]);
    vi.mocked(db.metaAdAccount.findMany).mockResolvedValue([{ id: "a1" } as any]);
    vi.mocked(db.audience.findMany).mockResolvedValue([]);
  });

  it("calculates metrics from orders and campaigns", async () => {
    vi.mocked(db.order.findMany).mockResolvedValue([
      { totalPrice: 100, createdAt: new Date(), items: [{ productId: "p1", title: "Shirt", price: 50, quantity: 2 }] } as any,
      { totalPrice: 200, createdAt: new Date(), items: [{ productId: "p2", title: "Pants", price: 200, quantity: 1 }] } as any,
    ]);
    vi.mocked(db.metaAdCampaign.findMany).mockResolvedValue([
      { id: "c1", name: "Sale", spend: 50, impressions: 10000, clicks: 200, conversions: 5, revenue: 300 } as any,
    ]);

    const metrics = await getDashboardMetrics("org-1");

    expect(metrics.totalRevenue).toBe(300);
    expect(metrics.totalOrders).toBe(2);
    expect(metrics.averageOrderValue).toBe(150);
    expect(metrics.totalSpend).toBe(50);
    expect(metrics.roas).toBe(6); // 300/50
    expect(metrics.impressions).toBe(10000);
    expect(metrics.clicks).toBe(200);
    expect(metrics.topProducts).toHaveLength(2);
    expect(metrics.topCampaigns).toHaveLength(1);
  });

  it("handles empty data gracefully", async () => {
    vi.mocked(db.order.findMany).mockResolvedValue([]);
    vi.mocked(db.metaAdCampaign.findMany).mockResolvedValue([]);

    const metrics = await getDashboardMetrics("org-1");
    expect(metrics.totalRevenue).toBe(0);
    expect(metrics.totalOrders).toBe(0);
    expect(metrics.roas).toBe(0);
    expect(metrics.ctr).toBe(0);
    expect(metrics.topProducts).toHaveLength(0);
    expect(metrics.topCampaigns).toHaveLength(0);
  });

  it("accepts custom date range", async () => {
    vi.mocked(db.order.findMany).mockResolvedValue([]);
    vi.mocked(db.metaAdCampaign.findMany).mockResolvedValue([]);

    await getDashboardMetrics("org-1", {
      start: "2024-01-01T00:00:00Z",
      end: "2024-01-31T23:59:59Z",
    });

    expect(db.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });

  it("sorts top products by revenue descending", async () => {
    vi.mocked(db.order.findMany).mockResolvedValue([
      { totalPrice: 50, createdAt: new Date(), items: [{ productId: "p1", title: "Cheap", price: 10, quantity: 1 }] } as any,
      { totalPrice: 500, createdAt: new Date(), items: [{ productId: "p2", title: "Expensive", price: 500, quantity: 1 }] } as any,
    ]);
    vi.mocked(db.metaAdCampaign.findMany).mockResolvedValue([]);

    const metrics = await getDashboardMetrics("org-1");
    expect(metrics.topProducts[0].title).toBe("Expensive");
    expect(metrics.topProducts[1].title).toBe("Cheap");
  });

  it("sorts campaigns by ROAS descending", async () => {
    vi.mocked(db.order.findMany).mockResolvedValue([]);
    vi.mocked(db.metaAdCampaign.findMany).mockResolvedValue([
      { id: "c1", name: "Low", spend: 100, revenue: 50, impressions: 0, clicks: 0, conversions: 0 } as any,
      { id: "c2", name: "High", spend: 100, revenue: 500, impressions: 0, clicks: 0, conversions: 0 } as any,
    ]);

    const metrics = await getDashboardMetrics("org-1");
    expect(metrics.topCampaigns[0].name).toBe("High");
  });
});

describe("getComparisonMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.shopifyStore.findMany).mockResolvedValue([{ id: "s1" } as any]);
    vi.mocked(db.metaAdAccount.findMany).mockResolvedValue([]);
    vi.mocked(db.order.findMany).mockResolvedValue([]);
    vi.mocked(db.metaAdCampaign.findMany).mockResolvedValue([]);
    vi.mocked(db.audience.findMany).mockResolvedValue([]);
  });

  it("returns current, previous and changes", async () => {
    const result = await getComparisonMetrics("org-1", "month");
    expect(result.current).toBeDefined();
    expect(result.previous).toBeDefined();
    expect(result.changes).toBeDefined();
    expect(typeof result.changes.totalRevenue).toBe("number");
  });

  it("calculates positive change correctly", async () => {
    // First call (current) returns orders
    vi.mocked(db.order.findMany)
      .mockResolvedValueOnce([{ totalPrice: 200, createdAt: new Date(), items: [] } as any])
      .mockResolvedValueOnce([{ totalPrice: 100, createdAt: new Date(Date.now() - 40 * 86400000), items: [] } as any]);

    const result = await getComparisonMetrics("org-1", "month");
    expect(result.changes.totalRevenue).toBe(100); // 100% increase
  });
});
