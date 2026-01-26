import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { inviteMemberSchema } from "@/lib/validations";
import { requireWorkspaceAdminOrOwner } from "@/lib/workspace";
import { InvitationStatus } from "@/generated/prisma";
import { createNotification } from "@/lib/notifications";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `workspaces:invite:${clientId}`,
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
    const parseResult = inviteMemberSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { workspaceId, email } = parseResult.data;

    // Only OWNER or ADMIN can invite members
    const permission = await requireWorkspaceAdminOrOwner(workspaceId, user.id);

    if (!permission.allowed) {
      return ApiErrors.forbidden(
        "Only workspace owners and admins can invite members",
      );
    }

    // Find the user to invite by email
    const invitee = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true },
    });

    if (!invitee) {
      return ApiErrors.notFound(
        "User not found. They must have an account first.",
      );
    }

    // Cannot invite yourself
    if (invitee.id === user.id) {
      return ApiErrors.badRequest("You cannot invite yourself");
    }

    // Check if user is already a member
    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: invitee.id,
          workspaceId,
        },
      },
    });

    if (existingMembership) {
      return ApiErrors.badRequest("User is already a member of this workspace");
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.workspaceInvitation.findUnique({
      where: {
        workspaceId_inviteeId: {
          workspaceId,
          inviteeId: invitee.id,
        },
      },
    });

    if (existingInvitation) {
      if (existingInvitation.status === InvitationStatus.PENDING) {
        return ApiErrors.badRequest(
          "An invitation is already pending for this user",
        );
      }
      // If rejected or accepted (and later removed), allow re-inviting by deleting old invitation
      await prisma.workspaceInvitation.delete({
        where: { id: existingInvitation.id },
      });
    }

    // Get workspace name for notification
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    // Create invitation (pending)
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        inviterId: user.id,
        inviteeId: invitee.id,
        status: InvitationStatus.PENDING,
      },
      include: {
        invitee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Send notification to the invited user with invitation ID for accept/reject
    await createNotification({
      userId: invitee.id,
      title: "Workspace Invitation",
      message: `${user.name || user.email} invited you to join workspace "${workspace?.name}"`,
      type: "INFO",
      metadata: JSON.stringify({
        type: "WORKSPACE_INVITATION",
        invitationId: invitation.id,
        workspaceId,
        workspaceName: workspace?.name,
        inviterName: user.name || user.email,
      }),
    });

    return NextResponse.json(
      {
        message: "Invitation sent successfully",
        invitation: {
          id: invitation.id,
          userId: invitation.invitee.id,
          name: invitation.invitee.name,
          email: invitation.invitee.email,
          avatar: invitation.invitee.avatar,
          status: invitation.status,
          createdAt: invitation.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Invite member error:", error);
    return ApiErrors.internalError();
  }
}
