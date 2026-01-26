import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { notifyWorkspaceMembers } from "@/lib/automations";
import { createProjectSchema } from "@/lib/validations";
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
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return ApiErrors.badRequest("workspaceId is required");
    }

    // Verify user is member of workspace (any role can view projects)
    const permission = await requireWorkspaceMember(workspaceId, user.id);

    if (!permission.allowed) {
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    return ApiErrors.internalError("Failed to fetch projects");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for project creation
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `projects:create:${clientId}`,
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
    const parseResult = createProjectSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { name, description, workspaceId } = parseResult.data;

    // Only OWNER or ADMIN can create projects
    const permission = await requireWorkspaceAdminOrOwner(workspaceId, user.id);

    if (!permission.allowed) {
      return ApiErrors.forbidden(
        "Only workspace owners or admins can create projects",
      );
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        workspaceId,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    // Create notification for project creation
    await createNotification({
      userId: user.id,
      title: "Project Created",
      message: `Your project "${project.name}" has been created successfully.`,
      type: "SUCCESS",
    });

    // Notify workspace members if PROJECT_CREATED automation is enabled
    await notifyWorkspaceMembers(
      workspaceId,
      "PROJECT_CREATED",
      "New Project Created",
      `${user.name || user.email} created project "${project.name}"`,
      user.id, // Exclude the creator
    );

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return ApiErrors.internalError("Failed to create project");
  }
}
