// API: Projects
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");

    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
      // Check if user has access to workspace
      const member = await db.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: user.id,
          },
        },
      });

      if (!member) {
        return NextResponse.json(
          { error: "Access denied to workspace" },
          { status: 403 }
        );
      }
    }

    const projects = await db.project.findMany({
      where,
      include: {
        workspace: true,
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("Error getting projects:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get projects",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { name, description, workspaceId, deadline } = body;

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: "Name and workspaceId are required" },
        { status: 400 }
      );
    }

    // Check workspace access
    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Access denied to workspace" },
        { status: 403 }
      );
    }

    const project = await db.project.create({
      data: {
        name,
        description,
        workspaceId,
        deadline: deadline ? new Date(deadline) : null,
      },
      include: {
        workspace: true,
        tasks: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create project",
      },
      { status: 500 }
    );
  }
}