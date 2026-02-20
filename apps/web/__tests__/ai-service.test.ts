import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectAnomalies, scoreProducts } from "@/lib/ai/service";
import { db } from "@/lib/prisma/client";

describe("detectAnomalies", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty when no active campaigns", async () => {
    vi.mocked(db.metaAdCampaign.findMany).mockResolvedValue([]);
    const anomalies = await detectAnomalies("org-1");
    expect(anomalies).toHaveLength(0);
  });

  it("detects ROAS drop below 1.0", async () => {
    vi.mocked(db.metaAdCampaign.findMany).mockResolvedValue([
      { id: "c1", name: "Losing Campaign", spend: 100, clicks: 500, impressions: 10000, conversions: 5, revenue: 50, dailyBudget: 50, status: "ACTIVE" } as any,
    ]);
    vi.mocked(db.aIInsight.create).mockResolvedValue({} as any);

    const anomalies = await detectAnomalies("org-1");
    const roasDrop = anomalies.find((a) => a.type === "ROAS_DROP");
    expect(roasDrop).toBeDefined();
    expect(roasDrop!.severity).toMatch(/HIGH|CRITICAL/);
  });

  it("detects creative fatigue with low CTR", async () => {
    vi.mocked(db.metaAdCampaign.findMany).mockResolvedValue([
      { id: "c2", name: "Stale Ads", spend: 200, clicks: 10, impressions: 50000, conversions: 1, revenue: 50, dailyBudget: 100, status: "ACTIVE" } as any,
    ]);
    vi.mocked(db.aIInsight.create).mockResolvedValue({} as any);

    const anomalies = await detectAnomalies("org-1");
    const fatigue = anomalies.find((a) => a.type === "CREATIVE_FATIGUE");
    expect(fatigue).toBeDefined();
  });

  it("detects CPA spike", async () => {
    vi.mocked(db.metaAdCampaign.findMany).mockResolvedValue([
      { id: "c3", name: "Expensive", spend: 500, clicks: 100, impressions: 5000, conversions: 2, revenue: 100, dailyBudget: 100, status: "ACTIVE" } as any,
    ]);
    vi.mocked(db.aIInsight.create).mockResolvedValue({} as any);

    const anomalies = await detectAnomalies("org-1");
    const cpa = anomalies.find((a) => a.type === "CPA_SPIKE");
    expect(cpa).toBeDefined();
  });
});

describe("scoreProducts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("scores products based on order data", async () => {
    vi.mocked(db.product.findMany).mockResolvedValue([
      {
        id: "p1", inventory: 50, price: 29.99, compareAtPrice: 39.99,
        orderItems: [
          { price: 29.99, quantity: 2, order: { createdAt: new Date() } },
          { price: 29.99, quantity: 1, order: { createdAt: new Date() } },
        ],
      } as any,
      {
        id: "p2", inventory: 0, price: 99.99, compareAtPrice: null,
        orderItems: [],
      } as any,
    ]);
    vi.mocked(db.product.update).mockResolvedValue({} as any);

    const scored = await scoreProducts("store-1");
    expect(scored).toBe(2);
    expect(db.product.update).toHaveBeenCalledTimes(2);

    // First product should have higher score
    const firstCall = vi.mocked(db.product.update).mock.calls[0][0] as any;
    const secondCall = vi.mocked(db.product.update).mock.calls[1][0] as any;
    expect(firstCall.data.aiScore).toBeGreaterThan(secondCall.data.aiScore);
  });

  it("handles empty product list", async () => {
    vi.mocked(db.product.findMany).mockResolvedValue([]);
    const scored = await scoreProducts("store-1");
    expect(scored).toBe(0);
  });
});
