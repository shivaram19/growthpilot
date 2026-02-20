import { describe, it, expect } from "vitest";
import {
  ShopifyConnectSchema, MetaConnectSchema, MetaCampaignCreateSchema,
  CampaignCreateSchema, CampaignUpdateSchema, AudienceCreateSchema,
  AutomationRuleSchema, AIAdCopySchema, AIBudgetOptimizationSchema,
  PaginationSchema, PLANS,
} from "@growthpilot/shared";

describe("ShopifyConnectSchema", () => {
  it("accepts valid domain", () => {
    expect(ShopifyConnectSchema.safeParse({ shopDomain: "store.myshopify.com", accessToken: "tok", scope: "read_products" }).success).toBe(true);
  });
  it("rejects invalid domain", () => {
    expect(ShopifyConnectSchema.safeParse({ shopDomain: "bad.com", accessToken: "t", scope: "s" }).success).toBe(false);
  });
  it("rejects empty fields", () => {
    expect(ShopifyConnectSchema.safeParse({}).success).toBe(false);
    expect(ShopifyConnectSchema.safeParse({ shopDomain: "x.myshopify.com", accessToken: "", scope: "s" }).success).toBe(false);
  });
});

describe("MetaConnectSchema", () => {
  it("accepts valid input", () => {
    expect(MetaConnectSchema.safeParse({ accessToken: "tok", adAccountId: "123", name: "Acc" }).success).toBe(true);
  });
  it("rejects empty fields", () => {
    expect(MetaConnectSchema.safeParse({ accessToken: "", adAccountId: "x", name: "x" }).success).toBe(false);
  });
});

describe("MetaCampaignCreateSchema", () => {
  it("accepts valid campaign", () => {
    const r = MetaCampaignCreateSchema.safeParse({ name: "Sale", objective: "SALES", dailyBudget: 50 });
    expect(r.success).toBe(true);
  });
  it("defaults status to PAUSED", () => {
    const r = MetaCampaignCreateSchema.safeParse({ name: "T", objective: "TRAFFIC" });
    expect(r.success && r.data.status).toBe("PAUSED");
  });
  it("rejects invalid objective", () => {
    expect(MetaCampaignCreateSchema.safeParse({ name: "T", objective: "BAD" }).success).toBe(false);
  });
  it("rejects negative budget", () => {
    expect(MetaCampaignCreateSchema.safeParse({ name: "T", objective: "SALES", dailyBudget: -1 }).success).toBe(false);
  });
});

describe("CampaignCreateSchema", () => {
  it("accepts all campaign types", () => {
    for (const type of ["AWARENESS", "TRAFFIC", "CONVERSIONS", "RETARGETING", "LOOKALIKE", "DYNAMIC_PRODUCT"]) {
      expect(CampaignCreateSchema.safeParse({ name: "T", type }).success).toBe(true);
    }
  });
  it("rejects name > 255 chars", () => {
    expect(CampaignCreateSchema.safeParse({ name: "x".repeat(256), type: "AWARENESS" }).success).toBe(false);
  });
  it("accepts audience IDs", () => {
    expect(CampaignCreateSchema.safeParse({ name: "T", type: "TRAFFIC", audienceIds: ["a1", "a2"] }).success).toBe(true);
  });
});

describe("CampaignUpdateSchema", () => {
  it("accepts partial updates", () => {
    expect(CampaignUpdateSchema.safeParse({}).success).toBe(true);
    expect(CampaignUpdateSchema.safeParse({ name: "U" }).success).toBe(true);
    expect(CampaignUpdateSchema.safeParse({ status: "ACTIVE" }).success).toBe(true);
  });
  it("rejects invalid status", () => {
    expect(CampaignUpdateSchema.safeParse({ status: "BAD" }).success).toBe(false);
  });
});

describe("AudienceCreateSchema", () => {
  it("accepts valid audience", () => {
    expect(AudienceCreateSchema.safeParse({ name: "HS", type: "CUSTOM", rules: [{ field: "spent", operator: "gt", value: "500" }] }).success).toBe(true);
  });
  it("validates operators", () => {
    for (const op of ["equals", "not_equals", "contains", "gt", "lt", "gte", "lte", "in", "not_in", "between"]) {
      expect(AudienceCreateSchema.safeParse({ name: "T", type: "CUSTOM", rules: [{ field: "x", operator: op, value: "v" }] }).success).toBe(true);
    }
    expect(AudienceCreateSchema.safeParse({ name: "T", type: "CUSTOM", rules: [{ field: "x", operator: "BAD", value: "v" }] }).success).toBe(false);
  });
});

describe("AutomationRuleSchema", () => {
  it("validates all trigger types", () => {
    for (const trigger of ["ROAS_DROP", "BUDGET_THRESHOLD", "CPA_SPIKE", "CREATIVE_FATIGUE", "INVENTORY_LOW", "SCHEDULE", "CONVERSION_DROP", "NEW_PRODUCT"]) {
      expect(AutomationRuleSchema.safeParse({ name: "R", trigger, condition: {}, action: {} }).success).toBe(true);
    }
  });
});

describe("AIAdCopySchema", () => {
  it("applies defaults", () => {
    const r = AIAdCopySchema.safeParse({ productId: "p1" });
    expect(r.success && r.data.tone).toBe("professional");
    expect(r.success && r.data.platform).toBe("meta_feed");
    expect(r.success && r.data.includeEmoji).toBe(false);
  });
  it("validates tones", () => {
    for (const tone of ["professional", "casual", "urgent", "playful", "luxurious"]) {
      expect(AIAdCopySchema.safeParse({ productId: "x", tone }).success).toBe(true);
    }
    expect(AIAdCopySchema.safeParse({ productId: "x", tone: "BAD" }).success).toBe(false);
  });
});

describe("AIBudgetOptimizationSchema", () => {
  it("rejects non-positive budget", () => {
    expect(AIBudgetOptimizationSchema.safeParse({ campaignIds: ["x"], totalBudget: 0 }).success).toBe(false);
    expect(AIBudgetOptimizationSchema.safeParse({ campaignIds: ["x"], totalBudget: -1 }).success).toBe(false);
  });
});

describe("PaginationSchema", () => {
  it("applies defaults", () => {
    const r = PaginationSchema.safeParse({});
    expect(r.success && r.data.page).toBe(1);
    expect(r.success && r.data.limit).toBe(20);
    expect(r.success && r.data.sortOrder).toBe("desc");
  });
  it("coerces strings", () => {
    const r = PaginationSchema.safeParse({ page: "3", limit: "50" });
    expect(r.success && r.data.page).toBe(3);
  });
  it("rejects limit > 100", () => {
    expect(PaginationSchema.safeParse({ limit: 200 }).success).toBe(false);
  });
});

describe("PLANS", () => {
  it("FREE is restricted", () => {
    expect(PLANS.FREE.price).toBe(0);
    expect(PLANS.FREE.aiInsights).toBe(false);
  });
  it("ENTERPRISE is unlimited", () => {
    expect(PLANS.ENTERPRISE.maxProducts).toBe(-1);
    expect(PLANS.ENTERPRISE.aiInsights).toBe(true);
  });
  it("prices increase with tier", () => {
    expect(PLANS.FREE.price).toBeLessThan(PLANS.STARTER.price);
    expect(PLANS.STARTER.price).toBeLessThan(PLANS.GROWTH.price);
    expect(PLANS.GROWTH.price).toBeLessThan(PLANS.ENTERPRISE.price);
  });
});
