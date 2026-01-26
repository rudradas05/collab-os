import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { createWorkspaceSchema } from "@/lib/validations";
import { Role, WorkspaceRole } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if user has permission to create workspaces (OWNER or ADMIN only)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    if (!user || user.role === Role.USER) {
      return NextResponse.json(
        { error: "Only workspace owners or admins can create workspaces" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const result = createWorkspaceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { name } = result.data;

    // Create workspace and member in a transaction
    const workspace = await prisma.$transaction(async (tx) => {
      // Create workspace
      const newWorkspace = await tx.workspace.create({
        data: {
          name,
          ownerId: payload.userId,
        },
      });

      // Create workspace member with OWNER role
      await tx.workspaceMember.create({
        data: {
          userId: payload.userId,
          workspaceId: newWorkspace.id,
          role: WorkspaceRole.OWNER,
        },
      });

      return newWorkspace;
    });

    return NextResponse.json(
      {
        message: "Workspace created successfully",
        workspace: {
          id: workspace.id,
          name: workspace.name,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create workspace error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get all workspaces the user is a member of
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: payload.userId },
      include: {
        workspace: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const workspaces = memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      role: membership.role,
      owner: membership.workspace.owner,
      memberCount: membership.workspace._count.members,
      createdAt: membership.workspace.createdAt,
    }));

    return NextResponse.json({ workspaces }, { status: 200 });
  } catch (error) {
    console.error("List workspaces error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
