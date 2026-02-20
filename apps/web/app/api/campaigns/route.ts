import { NextRequest } from "next/server";
import { db } from "@/lib/prisma/client";
import { getAuthOrg, apiError, apiSuccess } from "@/lib/utils/auth";
import { CampaignCreateSchema, PaginationSchema } from "@growthpilot/shared";

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getAuthOrg();
    const { searchParams } = new URL(req.url);
    const { page, limit, sortBy, sortOrder } = PaginationSchema.parse(Object.fromEntries(searchParams));
    const status = searchParams.get("status");

    const where = {
      organizationId: orgId,
      ...(status ? { status: status as any } : {}),
    };

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        include: {
          metaCampaign: { select: { spend: true, impressions: true, clicks: true, conversions: true, roas: true } },
          audienceTargets: { include: { audience: { select: { id: true, name: true, size: true } } } },
          _count: { select: { automationRules: true } },
        },
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.campaign.count({ where }),
    ]);

    return apiSuccess(campaigns, { page, limit, total });
  } catch (error) {
    return apiError("Failed to fetch campaigns", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getAuthOrg();
    const body = await req.json();
    const parsed = CampaignCreateSchema.safeParse(body);
    if (!parsed.success) return apiError(`Validation: ${parsed.error.issues[0]?.message}`, 422);

    const { audienceIds, ...data } = parsed.data;

    const campaign = await db.campaign.create({
      data: {
        ...data,
        organizationId: orgId,
        ...(audienceIds?.length
          ? { audienceTargets: { create: audienceIds.map((audienceId) => ({ audienceId })) } }
          : {}),
      },
      include: { audienceTargets: { include: { audience: true } } },
    });

    return apiSuccess(campaign);
  } catch (error) {
    console.error("Campaign create error:", error);
    return apiError("Failed to create campaign", 500);
  }
}
