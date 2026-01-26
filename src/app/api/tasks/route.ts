import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createTaskSchema } from "@/lib/validations";
import {
  requireWorkspaceMember,
  requireWorkspaceAdminOrOwner,
} from "@/lib/workspace";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return ApiErrors.badRequest("projectId is required");
    }

    // Get project with workspace to verify access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return ApiErrors.notFound("Project");
    }

    // Verify user is member of workspace (any role can view tasks)
    const permission = await requireWorkspaceMember(
      project.workspaceId,
      user.id,
    );

    if (!permission.allowed) {
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return ApiErrors.internalError("Failed to fetch tasks");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for task creation
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `tasks:create:${clientId}`,
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
    const parseResult = createTaskSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { title, projectId, assignedTo, priority, dueDate } =
      parseResult.data;

    // Get project with workspace to verify access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return ApiErrors.notFound("Project");
    }

    // Only OWNER or ADMIN can create tasks
    const permission = await requireWorkspaceAdminOrOwner(
      project.workspaceId,
      user.id,
    );

    if (!permission.allowed) {
      return ApiErrors.forbidden(
        "Only workspace owners or admins can create tasks",
      );
    }

    // If assignee provided, verify they're a workspace member
    if (assignedTo) {
      const assigneeMembership = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: assignedTo,
            workspaceId: project.workspaceId,
          },
        },
      });

      if (!assigneeMembership) {
        return ApiErrors.badRequest("Assignee must be a workspace member");
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        projectId,
        assignedTo: assignedTo || null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return ApiErrors.internalError("Failed to create task");
  }
}
