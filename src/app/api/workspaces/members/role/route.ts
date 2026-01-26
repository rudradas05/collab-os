import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { changeMemberRoleSchema } from "@/lib/validations";
import { requireWorkspaceOwner } from "@/lib/workspace";
import { WorkspaceRole } from "@/generated/prisma";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `workspaces:role:${clientId}`,
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
    const parseResult = changeMemberRoleSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { workspaceId, targetUserId, newRole } = parseResult.data;

    // Only OWNER (or system ADMIN) can change roles
    const permission = await requireWorkspaceOwner(workspaceId, user.id);

    if (!permission.allowed) {
      return ApiErrors.forbidden(
        "Only workspace owners can change member roles",
      );
    }

    // Prevent changing own role
    if (targetUserId === user.id) {
      return ApiErrors.badRequest("You cannot change your own role");
    }

    // Get target member
    const targetMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
    });

    if (!targetMember) {
      return ApiErrors.notFound("Member");
    }

    // Cannot modify OWNER role
    if (targetMember.role === WorkspaceRole.OWNER) {
      return ApiErrors.forbidden("Cannot modify owner role");
    }

    // Map the string role to WorkspaceRole enum
    const roleMap: Record<string, WorkspaceRole> = {
      ADMIN: WorkspaceRole.ADMIN,
      MEMBER: WorkspaceRole.MEMBER,
    };

    const newWorkspaceRole = roleMap[newRole];

    // Update the member's role
    const updatedMember = await prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },
      data: {
        role: newWorkspaceRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Role updated successfully",
      member: {
        userId: updatedMember.userId,
        name: updatedMember.user.name,
        email: updatedMember.user.email,
        role: updatedMember.role,
      },
    });
  } catch (error) {
    console.error("Change role error:", error);
    return ApiErrors.internalError();
  }
}
