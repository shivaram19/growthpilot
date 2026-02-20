import { NextRequest } from "next/server";
import { getAuthOrg, apiError, apiSuccess } from "@/lib/utils/auth";
import { getDashboardMetrics, getComparisonMetrics } from "@/lib/utils/analytics";

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getAuthOrg();
    const { searchParams } = new URL(req.url);
    const compare = searchParams.get("compare") === "true";
    const period = (searchParams.get("period") as "day" | "week" | "month") ?? "month";
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (compare) {
      const metrics = await getComparisonMetrics(orgId, period);
      return apiSuccess(metrics);
    }

    const dateRange = start && end ? { start, end } : undefined;
    const metrics = await getDashboardMetrics(orgId, dateRange);
    return apiSuccess(metrics);
  } catch (error) {
    console.error("Analytics error:", error);
    return apiError("Failed to fetch analytics", 500);
  }
}
