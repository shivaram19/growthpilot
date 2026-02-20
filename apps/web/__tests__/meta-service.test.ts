import { describe, it, expect, vi, beforeEach } from "vitest";
import { MetaAdsService, MetaApiError } from "@/lib/meta/service";
import { db } from "@/lib/prisma/client";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("MetaAdsService", () => {
  let service: MetaAdsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MetaAdsService("EAABtest", "123456789", "acc-1");
    vi.mocked(db.syncLog.create).mockResolvedValue({ id: "log-1" } as any);
    vi.mocked(db.syncLog.update).mockResolvedValue({} as any);
  });

  it("fetches campaigns", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "c1", name: "Sale", objective: "SALES", status: "ACTIVE" }] }) });
    const campaigns = await service.getCampaigns();
    expect(campaigns).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("act_123456789/campaigns"), expect.any(Object));
  });

  it("creates campaign with budget in cents", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: "new-1" }) });
    const id = await service.createCampaign({ name: "BF", objective: "CONVERSIONS", dailyBudget: 100 });
    expect(id).toBe("new-1");
    expect(JSON.parse((mockFetch.mock.calls[0][1] as any).body).daily_budget).toBe(10000);
  });

  it("creates ad set with targeting", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: "as-1" }) });
    const id = await service.createAdSet({ campaignId: "c1", name: "Women", dailyBudget: 50, targeting: { age_min: 25 } });
    expect(id).toBe("as-1");
  });

  it("returns zeros when no insights data", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
    const insights = await service.getCampaignInsights("c1");
    expect(insights.spend).toBe("0");
  });

  it("creates custom audience", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: "aud-1" }) });
    const id = await service.createCustomAudience({ name: "VIP", subtype: "CUSTOM" });
    expect(id).toBe("aud-1");
  });

  it("creates lookalike audience", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ id: "la-1" }) });
    const id = await service.createLookalikeAudience({ name: "1% LA", originAudienceId: "aud-1", country: "US", ratio: 0.01 });
    expect(id).toBe("la-1");
    expect(JSON.parse((mockFetch.mock.calls[0][1] as any).body).subtype).toBe("LOOKALIKE");
  });

  it("syncs campaigns to DB", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "c1", name: "T", objective: "SALES", status: "ACTIVE", daily_budget: "5000" }] }) });
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ spend: "50", impressions: "10000", clicks: "200", ctr: "2", cpc: "0.25", actions: [] }] }) });
    vi.mocked(db.metaAdCampaign.upsert).mockResolvedValue({} as any);

    const count = await service.syncCampaigns();
    expect(count).toBe(1);
    expect(db.syncLog.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "completed" }) }));
  });

  it("throws MetaApiError on failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400, json: async () => ({ error: { message: "Bad" } }) });
    await expect(service.getCampaigns()).rejects.toThrow(MetaApiError);
  });
});
