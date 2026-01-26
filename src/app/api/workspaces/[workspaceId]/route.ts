import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyToken,
  getTokenFromCookies,
  unauthorizedResponse,
} from "@/lib/auth";
import { WorkspaceRole } from "@/generated/prisma";
import { updateWorkspaceSchema } from "@/lib/validations";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const token = getTokenFromCookies(request.headers.get("cookie"));

    if (!token) {
      return unauthorizedResponse();
    }

    const payload = verifyToken(token);

    if (!payload) {
      return unauthorizedResponse("Invalid token");
    }

    // Get workspace with members
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!workspace) {
      return ApiErrors.notFound("Workspace");
    }

    // Check if user is a member
    const userMembership = workspace.members.find(
      (m) => m.userId === payload.userId,
    );

    if (!userMembership) {
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt,
        owner: workspace.owner,
      },
      members: workspace.members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role,
        joinedAt: m.createdAt,
      })),
      userRole: userMembership.role,
      isOwner: userMembership.role === WorkspaceRole.OWNER,
    });
  } catch (error) {
    console.error("Get workspace error:", error);
    return ApiErrors.internalError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const token = getTokenFromCookies(request.headers.get("cookie"));

    if (!token) {
      return unauthorizedResponse();
    }

    const payload = verifyToken(token);

    if (!payload) {
      return unauthorizedResponse("Invalid token");
    }

    const body = await request.json();
    const parseResult = updateWorkspaceSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { name } = parseResult.data;

    // Check if workspace exists and user has permission
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId: payload.userId },
          select: { role: true },
        },
      },
    });

    if (!workspace) {
      return ApiErrors.notFound("Workspace");
    }

    const memberRole = workspace.members[0]?.role;

    if (memberRole !== WorkspaceRole.OWNER) {
      return ApiErrors.forbidden("Only workspace owners can update settings");
    }

    // Build update data
    const updateData: { name?: string } = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return ApiErrors.badRequest("No fields to update");
    }

    // Update workspace
    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Workspace updated successfully",
      workspace: {
        id: updated.id,
        name: updated.name,
      },
    });
  } catch (error) {
    console.error("Update workspace error:", error);
    return ApiErrors.internalError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const token = getTokenFromCookies(request.headers.get("cookie"));

    if (!token) {
      return unauthorizedResponse();
    }

    const payload = verifyToken(token);

    if (!payload) {
      return unauthorizedResponse("Invalid token");
    }

    // Check if workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { userId: payload.userId },
          select: { role: true },
        },
        owner: {
          select: { id: true },
        },
      },
    });

    if (!workspace) {
      return ApiErrors.notFound("Workspace");
    }

    // Check if user is the owner or has OWNER role in workspace members
    const isOwner = workspace.owner.id === payload.userId;
    const memberRole = workspace.members[0]?.role;
    const hasOwnerRole = memberRole === WorkspaceRole.OWNER;

    if (!isOwner && !hasOwnerRole) {
      return ApiErrors.forbidden(
        "Only workspace owners can delete a workspace",
      );
    }

    // Delete workspace (cascade will handle members)
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return NextResponse.json(
      { message: "Workspace deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete workspace error:", error);
    return ApiErrors.internalError();
  }
}
