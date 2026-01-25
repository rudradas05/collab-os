import { prisma } from "@/lib/prisma";
import { WorkspaceRole } from "@/generated/prisma";

export interface WorkspaceWithRole {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  role: WorkspaceRole;
}

export async function getWorkspaceWithMembership(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceWithRole | null> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!membership) {
    return null;
  }

  return {
    id: membership.workspace.id,
    name: membership.workspace.name,
    ownerId: membership.workspace.ownerId,
    createdAt: membership.workspace.createdAt,
    role: membership.role,
  };
}
