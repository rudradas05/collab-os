import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyToken,
  getTokenFromCookies,
  unauthorizedResponse,
} from "@/lib/auth";
import { createWorkspaceSchema } from "@/lib/validations";
import { WorkspaceRole } from "@/generated/prisma";
import { createNotification } from "@/lib/notifications";
import { sendWorkspaceCreatedEmail } from "@/lib/email";
import { PLAN_LIMITS, type UserTier } from "@/lib/stripe";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

const DEFAULT_AUTOMATIONS = [
  "TASK_DONE",
  "DEADLINE",
  "PROJECT_CREATED",
] as const;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for workspace creation
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `workspaces:create:${clientId}`,
      RATE_LIMITS.GENERAL,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const token = getTokenFromCookies(request.headers.get("cookie"));

    if (!token) {
      return unauthorizedResponse();
    }

    const payload = verifyToken(token);

    if (!payload) {
      return unauthorizedResponse("Invalid token");
    }

    // Get user with tier info
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, tier: true },
    });

    if (!user) {
      return ApiErrors.unauthorized("User not found");
    }

    // Check workspace limit based on user's tier
    const userTier = (user.tier || "FREE") as UserTier;
    const limits = PLAN_LIMITS[userTier];

    if (limits.maxWorkspaces !== -1) {
      const currentWorkspaceCount = await prisma.workspaceMember.count({
        where: {
          userId: user.id,
          role: WorkspaceRole.OWNER, // Only count workspaces they own
        },
      });

      if (currentWorkspaceCount >= limits.maxWorkspaces) {
        return ApiErrors.forbidden(
          `You've reached the maximum of ${limits.maxWorkspaces} workspaces for your ${userTier} plan. Upgrade to create more.`,
        );
      }
    }

    const body = await request.json();
    const result = createWorkspaceSchema.safeParse(body);

    if (!result.success) {
      return handleZodError(result.error);
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

      // Create workspace member with OWNER role (creator is always OWNER)
      await tx.workspaceMember.create({
        data: {
          userId: payload.userId,
          workspaceId: newWorkspace.id,
          role: WorkspaceRole.OWNER,
        },
      });

      // Seed default automations as enabled
      await tx.automation.createMany({
        data: DEFAULT_AUTOMATIONS.map((type) => ({
          workspaceId: newWorkspace.id,
          type,
          enabled: true,
        })),
        skipDuplicates: true,
      });

      return newWorkspace;
    });

    // Create in-app notification
    await createNotification({
      userId: payload.userId,
      title: "Workspace Created",
      message: `Your workspace "${workspace.name}" is ready. Start adding projects and team members!`,
      type: "SUCCESS",
    });

    // Send email notification
    if (user.email) {
      await sendWorkspaceCreatedEmail(user.email, user.name, workspace.name);
    }

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
    return ApiErrors.internalError();
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request.headers.get("cookie"));

    if (!token) {
      return unauthorizedResponse();
    }

    const payload = verifyToken(token);

    if (!payload) {
      return unauthorizedResponse("Invalid token");
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
    return ApiErrors.internalError();
  }
}
