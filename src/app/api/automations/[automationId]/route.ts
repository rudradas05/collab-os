import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateAutomationSchema } from "@/lib/validations";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ automationId: string }> },
) {
  try {
    // Rate limiting for automations (20/min)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `automations:update:${clientId}`,
      RATE_LIMITS.AUTOMATIONS,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const { automationId } = await params;
    const body = await request.json();
    const parseResult = updateAutomationSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { enabled } = parseResult.data;

    // Get automation
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
    });

    if (!automation) {
      return ApiErrors.notFound("Automation");
    }

    // Verify user is OWNER of workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: automation.workspaceId,
        },
      },
    });

    if (!membership || membership.role !== "OWNER") {
      return ApiErrors.forbidden(
        "Only workspace owners can update automations",
      );
    }

    // Update automation
    const updated = await prisma.automation.update({
      where: { id: automationId },
      data: { enabled },
    });

    return NextResponse.json({ automation: updated });
  } catch (error) {
    console.error("Update automation error:", error);
    return ApiErrors.internalError("Failed to update automation");
  }
}
