import { NextRequest } from "next/server";
import { db } from "@/lib/prisma/client";
import { getAuthOrg, apiError, apiSuccess } from "@/lib/utils/auth";
import { MetaConnectSchema } from "@growthpilot/shared";
import { createMetaService } from "@/lib/meta/service";

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getAuthOrg();
    const body = await req.json();
    const parsed = MetaConnectSchema.safeParse(body);
    if (!parsed.success) return apiError(`Validation: ${parsed.error.issues[0]?.message}`, 422);

    const { accessToken, adAccountId, name } = parsed.data;
    const existing = await db.metaAdAccount.findUnique({ where: { metaAccountId: adAccountId } });
    if (existing) return apiError("Ad account already connected", 409);

    const account = await db.metaAdAccount.create({
      data: { organizationId: orgId, metaAccountId: adAccountId, accessToken, name },
    });

    const service = await createMetaService(account.id);
    service.syncCampaigns().catch(console.error);

    return apiSuccess({ accountId: account.id });
  } catch (error) {
    console.error("Meta connect error:", error);
    return apiError("Failed to connect Meta account", 500);
  }
}

export async function GET() {
  try {
    const { orgId } = await getAuthOrg();
    const accounts = await db.metaAdAccount.findMany({
      where: { organizationId: orgId },
      include: {
        _count: { select: { adCampaigns: true, ads: true } },
        adCampaigns: { take: 5, orderBy: { syncedAt: "desc" }, select: { id: true, name: true, status: true, spend: true, roas: true } },
      },
    });
    return apiSuccess(accounts);
  } catch (error) {
    return apiError("Failed to fetch Meta accounts", 500);
  }
}
