// API: Tasks
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { earnCoins } from "@/lib/coins";
import { executeAutomation } from "@/lib/automation";
import { createNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        project: {
          include: {
            workspace: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Error getting tasks:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get tasks",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { title, description, projectId, assignedTo, priority, deadline } =
      body;

    if (!title || !projectId) {
      return NextResponse.json(
        { error: "Title and projectId are required" },
        { status: 400 }
      );
    }

    // Check project access
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const hasAccess = project.workspace.members.some(
      (m) => m.userId === user.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to project" },
        { status: 403 }
      );
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        projectId,
        assignedTo: assignedTo || null,
        priority: priority || "medium",
        deadline: deadline ? new Date(deadline) : null,
        createdById: user.id,
      },
      include: {
        assignee: true,
        project: true,
      },
    });

    // Notify assignee if assigned
    if (assignedTo && assignedTo !== user.id) {
      await createNotification({
        userId: assignedTo,
        type: "TASK_ASSIGNED",
        title: "New Task Assigned",
        message: `You've been assigned to "${title}"`,
        link: `/dashboard/tasks/${task.id}`,
        metadata: { taskId: task.id, projectId },
      });
    }

    // Trigger automation
    await executeAutomation(
      { type: "task_created" },
      { taskId: task.id, projectId, userId: user.id }
    );

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create task",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { taskId, status, ...updates } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const task = await db.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const hasAccess = task.project.workspace.members.some(
      (m) => m.userId === user.id
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied to task" },
        { status: 403 }
      );
    }

    const updateData: any = { ...updates };
    if (status) {
      updateData.status = status;
      if (status === "completed") {
        updateData.completedAt = new Date();

        // Award coins for task completion
        await earnCoins({
          userId: user.id,
          amount: 10,
          type: "TASK_COMPLETED",
          description: `Completed task: ${task.title}`,
          metadata: { taskId, projectId: task.projectId },
        });

        // Check if project is completed early
        const project = await db.project.findUnique({
          where: { id: task.projectId },
          include: { tasks: true },
        });

        if (project && project.deadline) {
          const allTasksCompleted =
            project.tasks.every((t) => t.status === "completed") &&
            project.tasks.length > 0;
          const isEarly = new Date() < project.deadline;

          if (allTasksCompleted && isEarly) {
            await earnCoins({
              userId: user.id,
              amount: 50,
              type: "PROJECT_COMPLETED",
              description: `Completed project "${project.name}" before deadline`,
              metadata: { projectId: project.id },
            });
          }
        }

        // Trigger automation
        await executeAutomation(
          { type: "task_completed" },
          { taskId, projectId: task.projectId, userId: user.id }
        );
      }
    }

    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignee: true,
        project: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update task",
      },
      { status: 500 }
    );
  }
}