import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ApiErrors } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase().trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        workspaces: [],
        projects: [],
        tasks: [],
      });
    }

    // Get all workspaces the user is a member of
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      select: { workspaceId: true },
    });

    const workspaceIds = userWorkspaces.map((w) => w.workspaceId);

    // Parallel search for workspaces, projects, and tasks
    const [workspaces, projects, tasks] = await Promise.all([
      // Search workspaces
      prisma.workspace.findMany({
        where: {
          id: { in: workspaceIds },
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
        },
        take: 5,
      }),

      // Search projects
      prisma.project.findMany({
        where: {
          workspaceId: { in: workspaceIds },
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          workspaceId: true,
          workspace: {
            select: { name: true },
          },
        },
        take: 5,
      }),

      // Search tasks
      prisma.task.findMany({
        where: {
          project: {
            workspaceId: { in: workspaceIds },
          },
          title: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          project: {
            select: {
              name: true,
              workspaceId: true,
            },
          },
        },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      workspaces,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        workspaceId: p.workspaceId,
        workspaceName: p.workspace.name,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        projectId: t.projectId,
        projectName: t.project.name,
        workspaceId: t.project.workspaceId,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return ApiErrors.internalError("Search failed");
  }
}
