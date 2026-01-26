import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export type AutomationType = "TASK_DONE" | "DEADLINE" | "PROJECT_CREATED";

/**
 * Check if an automation is enabled for a workspace
 */
export async function isAutomationEnabled(
  workspaceId: string,
  type: AutomationType,
): Promise<boolean> {
  const automation = await prisma.automation.findUnique({
    where: {
      workspaceId_type: {
        workspaceId,
        type,
      },
    },
  });

  return automation?.enabled ?? false;
}

/**
 * Notify all workspace members about an event if automation is enabled
 */
export async function notifyWorkspaceMembers(
  workspaceId: string,
  automationType: AutomationType,
  title: string,
  message: string,
  excludeUserId?: string,
): Promise<void> {
  // Check if automation is enabled
  const isEnabled = await isAutomationEnabled(workspaceId, automationType);
  if (!isEnabled) return;

  // Get all workspace members
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    select: { userId: true },
  });

  // Create notifications for all members (optionally excluding the triggering user)
  const notificationPromises = members
    .filter((m) => m.userId !== excludeUserId)
    .map((member) =>
      createNotification({
        userId: member.userId,
        title,
        message,
        type: "INFO",
      }),
    );

  await Promise.all(notificationPromises);
}

/**
 * Get automation settings for a workspace
 */
export async function getWorkspaceAutomation(
  workspaceId: string,
  type: AutomationType,
) {
  return prisma.automation.findUnique({
    where: {
      workspaceId_type: {
        workspaceId,
        type,
      },
    },
  });
}
