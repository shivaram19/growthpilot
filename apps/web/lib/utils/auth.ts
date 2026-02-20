import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma/client";
import { NextResponse } from "next/server";
import type { ApiResponse } from "@growthpilot/shared";

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export async function getAuthOrg() {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new AuthError("Unauthorized", 401);
  }

  let organization;

  if (orgId) {
    organization = await db.organization.findUnique({
      where: { clerkOrgId: orgId },
    });
  } else {
    // Find personal org for this user
    const member = await db.member.findFirst({
      where: { clerkUserId: userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    organization = member?.organization;
  }

  if (!organization) {
    // Auto-create personal org on first access
    organization = await db.organization.create({
      data: {
        name: "My Organization",
        slug: `org-${userId.slice(-8)}`,
        members: {
          create: {
            clerkUserId: userId,
            role: "OWNER",
          },
        },
      },
    });
  }

  return { userId, orgId: organization.id, organization };
}

export function apiError(message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: message } satisfies ApiResponse,
    { status }
  );
}

export function apiSuccess<T>(data: T, meta?: ApiResponse["meta"]): NextResponse {
  return NextResponse.json(
    { success: true, data, meta } satisfies ApiResponse<T>,
    { status: 200 }
  );
}
