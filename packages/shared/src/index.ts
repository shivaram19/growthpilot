import { z } from "zod";

// ─── API Response Types ────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// ─── Shopify Types ─────────────────────────────────────────────

export const ShopifyConnectSchema = z.object({
  shopDomain: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z0-9-]+\.myshopify\.com$/, "Invalid Shopify domain"),
  accessToken: z.string().min(1),
  scope: z.string().min(1),
});

export const ShopifyWebhookSchema = z.object({
  topic: z.string(),
  shop: z.string(),
  payload: z.record(z.unknown()),
});

export type ShopifyConnectInput = z.infer<typeof ShopifyConnectSchema>;

// ─── Meta Ads Types ────────────────────────────────────────────

export const MetaConnectSchema = z.object({
  accessToken: z.string().min(1),
  adAccountId: z.string().min(1),
  name: z.string().min(1),
});

export const MetaCampaignCreateSchema = z.object({
  name: z.string().min(1).max(255),
  objective: z.enum([
    "AWARENESS",
    "TRAFFIC",
    "ENGAGEMENT",
    "LEADS",
    "APP_PROMOTION",
    "SALES",
  ]),
  dailyBudget: z.number().positive().optional(),
  lifetimeBudget: z.number().positive().optional(),
  startTime: z.string().datetime().optional(),
  stopTime: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
});

export type MetaConnectInput = z.infer<typeof MetaConnectSchema>;
export type MetaCampaignCreateInput = z.infer<typeof MetaCampaignCreateSchema>;

// ─── Campaign Types ────────────────────────────────────────────

export const CampaignCreateSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum([
    "AWARENESS",
    "TRAFFIC",
    "CONVERSIONS",
    "RETARGETING",
    "LOOKALIKE",
    "DYNAMIC_PRODUCT",
  ]),
  goal: z.string().optional(),
  budget: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  audienceIds: z.array(z.string()).optional(),
  aiOptimized: z.boolean().default(false),
});

export const CampaignUpdateSchema = CampaignCreateSchema.partial().extend({
  status: z
    .enum(["DRAFT", "REVIEW", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"])
    .optional(),
});

export type CampaignCreateInput = z.infer<typeof CampaignCreateSchema>;
export type CampaignUpdateInput = z.infer<typeof CampaignUpdateSchema>;

// ─── Audience Types ────────────────────────────────────────────

export const AudienceRuleSchema = z.object({
  field: z.string(),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "gt",
    "lt",
    "gte",
    "lte",
    "in",
    "not_in",
    "between",
  ]),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

export const AudienceCreateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["CUSTOM", "LOOKALIKE", "SAVED", "AI_GENERATED"]),
  rules: z.array(AudienceRuleSchema),
  syncToMeta: z.boolean().default(false),
});

export type AudienceRule = z.infer<typeof AudienceRuleSchema>;
export type AudienceCreateInput = z.infer<typeof AudienceCreateSchema>;

// ─── Automation Types ──────────────────────────────────────────

export const AutomationRuleSchema = z.object({
  name: z.string().min(1).max(255),
  trigger: z.enum([
    "ROAS_DROP",
    "BUDGET_THRESHOLD",
    "CPA_SPIKE",
    "CREATIVE_FATIGUE",
    "INVENTORY_LOW",
    "SCHEDULE",
    "CONVERSION_DROP",
    "NEW_PRODUCT",
  ]),
  condition: z.record(z.unknown()),
  action: z.record(z.unknown()),
  campaignId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type AutomationRuleInput = z.infer<typeof AutomationRuleSchema>;

// ─── AI Types ──────────────────────────────────────────────────

export const AIAdCopySchema = z.object({
  productId: z.string(),
  tone: z.enum(["professional", "casual", "urgent", "playful", "luxurious"]).default("professional"),
  platform: z.enum(["meta_feed", "meta_story", "meta_reel"]).default("meta_feed"),
  targetAudience: z.string().optional(),
  includeEmoji: z.boolean().default(false),
});

export const AIAudienceSuggestionSchema = z.object({
  productIds: z.array(z.string()).optional(),
  baseAudienceId: z.string().optional(),
  goal: z.enum(["expand", "refine", "lookalike"]).default("expand"),
});

export const AIBudgetOptimizationSchema = z.object({
  campaignIds: z.array(z.string()),
  totalBudget: z.number().positive(),
  optimizeFor: z.enum(["roas", "conversions", "cpa"]).default("roas"),
});

export type AIAdCopyInput = z.infer<typeof AIAdCopySchema>;
export type AIAudienceSuggestionInput = z.infer<typeof AIAudienceSuggestionSchema>;
export type AIBudgetOptimizationInput = z.infer<typeof AIBudgetOptimizationSchema>;

// ─── Analytics Types ───────────────────────────────────────────

export interface DashboardMetrics {
  totalRevenue: number;
  totalSpend: number;
  roas: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpa: number;
  revenueByDay: Array<{ date: string; revenue: number; spend: number }>;
  topProducts: Array<{ id: string; title: string; revenue: number; orders: number }>;
  topCampaigns: Array<{ id: string; name: string; spend: number; revenue: number; roas: number }>;
  audienceBreakdown: Array<{ name: string; size: number; conversions: number }>;
}

export interface DateRange {
  start: string;
  end: string;
}

// ─── Utility Types ─────────────────────────────────────────────

export type PaginationParams = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ─── Constants ─────────────────────────────────────────────────

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    maxProducts: 50,
    maxCampaigns: 3,
    maxAutomations: 1,
    aiInsights: false,
    metaIntegration: false,
  },
  STARTER: {
    name: "Starter",
    price: 49,
    maxProducts: 500,
    maxCampaigns: 10,
    maxAutomations: 5,
    aiInsights: true,
    metaIntegration: true,
  },
  GROWTH: {
    name: "Growth",
    price: 149,
    maxProducts: 5000,
    maxCampaigns: 50,
    maxAutomations: 25,
    aiInsights: true,
    metaIntegration: true,
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 499,
    maxProducts: -1,
    maxCampaigns: -1,
    maxAutomations: -1,
    aiInsights: true,
    metaIntegration: true,
  },
} as const;
