import { db } from "@/lib/prisma/client";

// ─── Types ─────────────────────────────────────────────────────

interface MetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

interface MetaAdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  targeting?: Record<string, unknown>;
  daily_budget?: string;
}

interface MetaAd {
  id: string;
  name: string;
  adset_id: string;
  status: string;
  creative?: { id: string };
}

interface MetaInsights {
  spend: string;
  impressions: string;
  clicks: string;
  conversions?: string;
  actions?: Array<{ action_type: string; value: string }>;
  ctr: string;
  cpc: string;
}

// ─── Meta Ads API Client ───────────────────────────────────────

export class MetaAdsService {
  private readonly API_VERSION = "v21.0";
  private readonly BASE_URL = "https://graph.facebook.com";
  private accessToken: string;
  private adAccountId: string;
  private dbAccountId: string;

  constructor(accessToken: string, adAccountId: string, dbAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
    this.dbAccountId = dbAccountId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const separator = endpoint.includes("?") ? "&" : "?";
    const url = `${this.BASE_URL}/${this.API_VERSION}/${endpoint}${separator}access_token=${this.accessToken}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new MetaApiError(
        `Meta API error: ${response.status}`,
        response.status,
        errorBody
      );
    }

    return response.json();
  }

  // ─── Campaigns ─────────────────────────────────────────────

  async getCampaigns(): Promise<MetaCampaign[]> {
    const data = await this.request<{ data: MetaCampaign[] }>(
      `act_${this.adAccountId}/campaigns?fields=id,name,objective,status,daily_budget,lifetime_budget,start_time,stop_time`
    );
    return data.data;
  }

  async createCampaign(params: {
    name: string;
    objective: string;
    status?: string;
    dailyBudget?: number;
    specialAdCategories?: string[];
  }): Promise<string> {
    const body: Record<string, unknown> = {
      name: params.name,
      objective: params.objective,
      status: params.status ?? "PAUSED",
      special_ad_categories: params.specialAdCategories ?? [],
    };

    if (params.dailyBudget) {
      body.daily_budget = Math.round(params.dailyBudget * 100); // Meta uses cents
    }

    const data = await this.request<{ id: string }>(
      `act_${this.adAccountId}/campaigns`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    return data.id;
  }

  async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    await this.request(`${campaignId}`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
  }

  // ─── Ad Sets ───────────────────────────────────────────────

  async createAdSet(params: {
    campaignId: string;
    name: string;
    dailyBudget: number;
    targeting: Record<string, unknown>;
    billingEvent?: string;
    optimizationGoal?: string;
  }): Promise<string> {
    const data = await this.request<{ id: string }>(
      `act_${this.adAccountId}/adsets`,
      {
        method: "POST",
        body: JSON.stringify({
          campaign_id: params.campaignId,
          name: params.name,
          daily_budget: Math.round(params.dailyBudget * 100),
          targeting: params.targeting,
          billing_event: params.billingEvent ?? "IMPRESSIONS",
          optimization_goal: params.optimizationGoal ?? "OFFSITE_CONVERSIONS",
          status: "PAUSED",
        }),
      }
    );

    return data.id;
  }

  // ─── Ads ───────────────────────────────────────────────────

  async createAd(params: {
    adSetId: string;
    name: string;
    creativeId: string;
    status?: string;
  }): Promise<string> {
    const data = await this.request<{ id: string }>(
      `act_${this.adAccountId}/ads`,
      {
        method: "POST",
        body: JSON.stringify({
          adset_id: params.adSetId,
          name: params.name,
          creative: { creative_id: params.creativeId },
          status: params.status ?? "PAUSED",
        }),
      }
    );

    return data.id;
  }

  // ─── Insights ──────────────────────────────────────────────

  async getCampaignInsights(
    campaignId: string,
    dateRange?: { since: string; until: string }
  ): Promise<MetaInsights> {
    const timeRange = dateRange
      ? `&time_range={"since":"${dateRange.since}","until":"${dateRange.until}"}`
      : "";

    const data = await this.request<{ data: MetaInsights[] }>(
      `${campaignId}/insights?fields=spend,impressions,clicks,actions,ctr,cpc${timeRange}`
    );

    return data.data[0] ?? {
      spend: "0",
      impressions: "0",
      clicks: "0",
      ctr: "0",
      cpc: "0",
    };
  }

  async getAccountInsights(
    dateRange?: { since: string; until: string }
  ): Promise<MetaInsights> {
    const timeRange = dateRange
      ? `&time_range={"since":"${dateRange.since}","until":"${dateRange.until}"}`
      : "";

    const data = await this.request<{ data: MetaInsights[] }>(
      `act_${this.adAccountId}/insights?fields=spend,impressions,clicks,actions,ctr,cpc${timeRange}`
    );

    return data.data[0] ?? {
      spend: "0",
      impressions: "0",
      clicks: "0",
      ctr: "0",
      cpc: "0",
    };
  }

  // ─── Custom Audiences ─────────────────────────────────────

  async createCustomAudience(params: {
    name: string;
    description?: string;
    subtype: string;
    customerFileSource?: string;
  }): Promise<string> {
    const data = await this.request<{ id: string }>(
      `act_${this.adAccountId}/customaudiences`,
      {
        method: "POST",
        body: JSON.stringify({
          name: params.name,
          description: params.description,
          subtype: params.subtype,
          customer_file_source: params.customerFileSource ?? "USER_PROVIDED_ONLY",
        }),
      }
    );

    return data.id;
  }

  async createLookalikeAudience(params: {
    name: string;
    originAudienceId: string;
    country: string;
    ratio: number; // 0.01 to 0.20
  }): Promise<string> {
    const data = await this.request<{ id: string }>(
      `act_${this.adAccountId}/customaudiences`,
      {
        method: "POST",
        body: JSON.stringify({
          name: params.name,
          subtype: "LOOKALIKE",
          origin_audience_id: params.originAudienceId,
          lookalike_spec: JSON.stringify({
            country: params.country,
            ratio: params.ratio,
            type: "similarity",
          }),
        }),
      }
    );

    return data.id;
  }

  // ─── Sync to DB ────────────────────────────────────────────

  async syncCampaigns(): Promise<number> {
    let synced = 0;
    const syncLog = await db.syncLog.create({
      data: { adAccountId: this.dbAccountId, type: "meta_campaigns", status: "running" },
    });

    try {
      const campaigns = await this.getCampaigns();

      for (const campaign of campaigns) {
        const insights = await this.getCampaignInsights(campaign.id).catch(
          () => null
        );

        const conversions = insights?.actions?.find(
          (a) => a.action_type === "offsite_conversion.fb_pixel_purchase"
        );

        await db.metaAdCampaign.upsert({
          where: {
            metaCampaignId_adAccountId: {
              metaCampaignId: campaign.id,
              adAccountId: this.dbAccountId,
            },
          },
          update: {
            name: campaign.name,
            objective: campaign.objective,
            status: campaign.status,
            dailyBudget: campaign.daily_budget
              ? Number(campaign.daily_budget) / 100
              : null,
            spend: insights ? Number(insights.spend) : 0,
            impressions: insights ? Number(insights.impressions) : 0,
            clicks: insights ? Number(insights.clicks) : 0,
            conversions: conversions ? Number(conversions.value) : 0,
            syncedAt: new Date(),
          },
          create: {
            metaCampaignId: campaign.id,
            adAccountId: this.dbAccountId,
            name: campaign.name,
            objective: campaign.objective,
            status: campaign.status,
            dailyBudget: campaign.daily_budget
              ? Number(campaign.daily_budget) / 100
              : null,
          },
        });
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
}

// ─── Error Class ───────────────────────────────────────────────

export class MetaApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public body: unknown
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

// ─── Factory ───────────────────────────────────────────────────

export async function createMetaService(accountId: string): Promise<MetaAdsService> {
  const account = await db.metaAdAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.isActive) {
    throw new Error("Meta ad account not found or inactive");
  }

  return new MetaAdsService(account.accessToken, account.metaAccountId, accountId);
}
