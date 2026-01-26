import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addCoins } from "@/lib/coins";

const COIN_REWARD = 10;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body = await request.json();
    const { status, title, assignedTo } = body;

    // Get task with project to verify access
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
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
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 },
      );
    }

    // Build update data
    const updateData: {
      status?: "TODO" | "IN_PROGRESS" | "DONE";
      title?: string;
      assignedTo?: string | null;
      completedAt?: Date | null;
    } = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return NextResponse.json(
          { error: "Task title cannot be empty" },
          { status: 400 },
        );
      }
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
          return NextResponse.json(
            { error: "Assignee must be a workspace member" },
            { status: 400 },
          );
        }
      }
      updateData.assignedTo = assignedTo || null;
    }

    let coinAwarded = false;
    let coinsEarned = 0;
    let newTier: string | undefined;

    if (status !== undefined) {
      if (!["TODO", "IN_PROGRESS", "DONE"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
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
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
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
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 },
      );
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
