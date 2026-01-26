import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addCoins } from "@/lib/coins";
import { createNotification } from "@/lib/notifications";
import { createAutomationSchema } from "@/lib/validations";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

const AUTOMATION_TYPES = ["TASK_DONE", "DEADLINE", "PROJECT_CREATED"] as const;
type AutomationType = (typeof AUTOMATION_TYPES)[number];

const AUTOMATION_COIN_REWARD = 15;

const AUTOMATION_DESCRIPTIONS: Record<
  AutomationType,
  { title: string; description: string }
> = {
  TASK_DONE: {
    title: "Task Completion Alerts",
    description: "Get notified and receive email when tasks are marked as done",
  },
  DEADLINE: {
    title: "Deadline Reminders",
    description: "Get notified when task deadlines are approaching",
  },
  PROJECT_CREATED: {
    title: "New Project Alerts",
    description: "Get notified when new projects are created in the workspace",
  },
};

function isValidAutomationType(type: string): type is AutomationType {
  return AUTOMATION_TYPES.includes(type as AutomationType);
}

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

    // Verify user is member of workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!membership) {
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    // Get existing automations for this workspace
    const automations = await prisma.automation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });

    // Build full list with all automation types
    const automationList = AUTOMATION_TYPES.map((type) => {
      const existing = automations.find((a) => a.type === type);
      const info = AUTOMATION_DESCRIPTIONS[type];
      return {
        id: existing?.id || null,
        workspaceId,
        type,
        title: info.title,
        description: info.description,
        enabled: existing?.enabled ?? false,
        exists: !!existing,
        createdAt: existing?.createdAt || null,
      };
    });

    return NextResponse.json({
      automations: automationList,
      isOwner: membership.role === "OWNER",
    });
  } catch (error) {
    console.error("Get automations error:", error);
    return ApiErrors.internalError("Failed to fetch automations");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for automations (20/min)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `automations:create:${clientId}`,
      RATE_LIMITS.AUTOMATIONS,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const parseResult = createAutomationSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { workspaceId, type } = parseResult.data;

    if (!isValidAutomationType(type)) {
      return ApiErrors.badRequest("Invalid automation type");
    }

    // Verify user is OWNER of workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!membership || membership.role !== "OWNER") {
      return ApiErrors.forbidden(
        "Only workspace owners can create automations",
      );
    }

    // Check if automation already exists
    const existing = await prisma.automation.findUnique({
      where: {
        workspaceId_type: {
          workspaceId,
          type,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This automation already exists" },
        { status: 409 },
      );
    }

    // Create automation
    const automation = await prisma.automation.create({
      data: {
        workspaceId,
        type,
        enabled: true,
      },
    });

    // Award coins for creating automation
    const coinResult = await addCoins(
      user.id,
      AUTOMATION_COIN_REWARD,
      "Automation created",
      automation.id,
    );

    // Create notification
    await createNotification({
      userId: user.id,
      title: "Automation Created",
      message: `You created "${AUTOMATION_DESCRIPTIONS[type].title}" and earned ${AUTOMATION_COIN_REWARD} coins!`,
      type: "SUCCESS",
    });

    return NextResponse.json(
      {
        automation: {
          ...automation,
          title: AUTOMATION_DESCRIPTIONS[type].title,
          description: AUTOMATION_DESCRIPTIONS[type].description,
          exists: true,
        },
        coinsEarned: AUTOMATION_COIN_REWARD,
        newTier: coinResult.newTier,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create automation error:", error);
    return ApiErrors.internalError("Failed to create automation");
  }
}
