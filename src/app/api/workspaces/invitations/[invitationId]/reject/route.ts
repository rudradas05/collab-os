import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { InvitationStatus } from "@/generated/prisma";
import { createNotification } from "@/lib/notifications";
import { ApiErrors } from "@/lib/api-errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> },
) {
  try {
    const { invitationId } = await params;
    const user = await getCurrentUser(request);

    if (!user) {
      return ApiErrors.unauthorized();
    }

    // Get the invitation
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!invitation) {
      return ApiErrors.notFound("Invitation");
    }

    // Check if the invitation is for the current user
    if (invitation.inviteeId !== user.id) {
      return ApiErrors.forbidden("This invitation is not for you");
    }

    // Check if already responded
    if (invitation.status !== InvitationStatus.PENDING) {
      return ApiErrors.badRequest(
        `This invitation has already been ${invitation.status.toLowerCase()}`,
      );
    }

    // Reject invitation: update status
    await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.REJECTED,
        respondedAt: new Date(),
      },
    });

    // Mark the invitation notification as read and clear metadata
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        metadata: {
          contains: invitationId,
        },
      },
      data: {
        read: true,
        metadata: null,
      },
    });

    // Notify the inviter
    await createNotification({
      userId: invitation.inviterId,
      title: "Invitation Declined",
      message: `${user.name || user.email} declined your invitation to join "${invitation.workspace.name}"`,
      type: "WARNING",
    });

    return NextResponse.json({
      message: "Invitation declined",
    });
  } catch (error) {
    console.error("Reject invitation error:", error);
    return ApiErrors.internalError();
  }
}
