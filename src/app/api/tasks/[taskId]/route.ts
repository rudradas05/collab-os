import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addCoins } from "@/lib/coins";
import { createNotification } from "@/lib/notifications";
import { notifyWorkspaceMembers } from "@/lib/automations";
import { updateTaskSchema } from "@/lib/validations";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

const COIN_REWARD = 10;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `tasks:update:${clientId}`,
      RATE_LIMITS.GENERAL,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const { taskId } = await params;
    const body = await request.json();
    const parseResult = updateTaskSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { status, title, assignedTo, priority, dueDate } = parseResult.data;

    // Get task with project to verify access
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!existingTask) {
      return ApiErrors.notFound("Task");
    }

    // Verify user is member of workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: existingTask.project.workspaceId,
        },
      },
    });

    if (!membership) {
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    // Build update data
    const updateData: {
      status?: "TODO" | "IN_PROGRESS" | "DONE";
      title?: string;
      assignedTo?: string | null;
      completedAt?: Date | null;
      priority?: "LOW" | "MEDIUM" | "HIGH";
      dueDate?: Date | null;
    } = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (assignedTo !== undefined) {
      if (assignedTo) {
        const assigneeMembership = await prisma.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: assignedTo,
              workspaceId: existingTask.project.workspaceId,
            },
          },
        });

        if (!assigneeMembership) {
          return ApiErrors.badRequest("Assignee must be a workspace member");
        }
      }
      updateData.assignedTo = assignedTo || null;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    let coinAwarded = false;
    let coinsEarned = 0;
    let newTier: string | undefined;

    if (status !== undefined) {
      updateData.status = status;

      // Check if transitioning to DONE for the first time
      if (status === "DONE" && !existingTask.completedAt) {
        updateData.completedAt = new Date();

        // Award coins using the coin utility
        const coinResult = await addCoins(
          user.id,
          COIN_REWARD,
          "Task completed",
          taskId,
        );

        if (coinResult.success) {
          coinAwarded = true;
          coinsEarned = COIN_REWARD;
          newTier = coinResult.newTier;
        }

        // Create notification for task completion
        await createNotification({
          userId: user.id,
          title: "Task Completed",
          message: `You completed "${existingTask.title}" and earned ${COIN_REWARD} coins!`,
          type: "SUCCESS",
        });

        // Notify workspace members if TASK_DONE automation is enabled
        await notifyWorkspaceMembers(
          existingTask.project.workspaceId,
          "TASK_DONE",
          "Task Completed",
          `${user.name || user.email} completed task "${existingTask.title}"`,
          user.id, // Exclude the user who completed the task
        );
      } else if (status !== "DONE" && existingTask.status === "DONE") {
        // Moving away from DONE - keep completedAt for history
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
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

    return NextResponse.json({
      task,
      coinAwarded,
      coinsEarned,
      newTier,
    });
  } catch (error) {
    console.error("Update task error:", error);
    return ApiErrors.internalError("Failed to update task");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const { taskId } = await params;

    // Get task with project to verify access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!task) {
      return ApiErrors.notFound("Task");
    }

    // Verify user is member of workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: task.project.workspaceId,
        },
      },
    });

    if (!membership) {
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return ApiErrors.internalError("Failed to delete task");
  }
}
