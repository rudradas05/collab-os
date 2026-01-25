import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { WorkspaceRole } from "@/generated/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;
    const token = getTokenFromCookies(request.headers.get("cookie"));

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
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
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    // Check if user is the owner or has OWNER role in workspace members
    const isOwner = workspace.owner.id === payload.userId;
    const memberRole = workspace.members[0]?.role;
    const hasOwnerRole = memberRole === WorkspaceRole.OWNER;

    if (!isOwner && !hasOwnerRole) {
      return NextResponse.json(
        { error: "Only workspace owners can delete a workspace" },
        { status: 403 },
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
