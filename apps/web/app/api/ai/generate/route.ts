import { NextRequest } from "next/server";
import { getAuthOrg, apiError, apiSuccess } from "@/lib/utils/auth";
import { generateAdCopy, suggestAudiences, optimizeBudget, detectAnomalies, scoreProducts } from "@/lib/ai/service";
import { AIAdCopySchema, AIBudgetOptimizationSchema } from "@growthpilot/shared";

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getAuthOrg();
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case "ad-copy": {
        const parsed = AIAdCopySchema.safeParse(params);
        if (!parsed.success) return apiError(`Validation: ${parsed.error.issues[0]?.message}`, 422);
        const result = await generateAdCopy(parsed.data);
        return apiSuccess(result);
      }
      case "suggest-audiences": {
        const result = await suggestAudiences(orgId, params.productIds);
        return apiSuccess(result);
      }
      case "optimize-budget": {
        const parsed = AIBudgetOptimizationSchema.safeParse(params);
        if (!parsed.success) return apiError(`Validation: ${parsed.error.issues[0]?.message}`, 422);
        const result = await optimizeBudget(parsed.data);
        return apiSuccess(result);
      }
      case "detect-anomalies": {
        const result = await detectAnomalies(orgId);
        return apiSuccess(result);
      }
      case "score-products": {
        if (!params.storeId) return apiError("storeId required", 422);
        const scored = await scoreProducts(params.storeId);
        return apiSuccess({ scored });
      }
      default:
        return apiError(`Unknown action: ${action}`, 400);
    }
  } catch (error) {
    console.error("AI action error:", error);
    return apiError(error instanceof Error ? error.message : "AI operation failed", 500);
  }
}
