import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { WorkspaceRole } from "@/generated/prisma";
import { createNotification } from "@/lib/notifications";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";
import { z } from "zod";

const removeMemberSchema = z.object({
  workspaceId: z.string().min(1, "Workspace ID is required"),
  targetUserId: z.string().min(1, "Target user ID is required"),
});

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `workspaces:remove-member:${clientId}`,
      RATE_LIMITS.GENERAL,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const parseResult = removeMemberSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { workspaceId, targetUserId } = parseResult.data;

    // Get current user's membership
    const currentMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!currentMember) {
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    // Only OWNER and ADMIN can remove members
    if (
      currentMember.role !== WorkspaceRole.OWNER &&
      currentMember.role !== WorkspaceRole.ADMIN
    ) {
      return ApiErrors.forbidden("Only owners and admins can remove members");
    }

    // Cannot remove yourself
    if (targetUserId === user.id) {
      return ApiErrors.badRequest(
        "You cannot remove yourself from the workspace",
      );
    }

    // Get target member
    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workspace: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!targetMember) {
      return ApiErrors.notFound("Member");
    }

    // Cannot remove OWNER
    if (targetMember.role === WorkspaceRole.OWNER) {
      return ApiErrors.forbidden("Cannot remove the workspace owner");
    }

    // ADMIN can only remove MEMBER (not other ADMINs)
    if (
      currentMember.role === WorkspaceRole.ADMIN &&
      targetMember.role === WorkspaceRole.ADMIN
    ) {
      return ApiErrors.forbidden(
        "Admins cannot remove other admins. Only the owner can do this.",
      );
    }

    // Remove the member
    await prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
    });

    // Notify the removed user
    await createNotification({
      userId: targetUserId,
      title: "Removed from Workspace",
      message: `You have been removed from the workspace "${targetMember.workspace.name}" by ${user.name || user.email}`,
      type: "WARNING",
    });

    return NextResponse.json({
      success: true,
      message: `${targetMember.user.name || targetMember.user.email} has been removed from the workspace`,
    });
  } catch (error) {
    console.error("Remove member error:", error);
    return ApiErrors.internalError("Failed to remove member");
  }
}
