import { prisma } from "@/lib/prisma";
import { WorkspaceRole, Role } from "@/generated/prisma";

export interface WorkspaceWithRole {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  role: WorkspaceRole;
}

export interface WorkspaceMembership {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

export interface PermissionCheckResult {
  allowed: boolean;
  membership: WorkspaceMembership | null;
  isSystemAdmin: boolean;
}

/**
 * Get workspace membership for a user
 */
export async function getWorkspaceMembership(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceMembership | null> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: {
      userId: true,
      workspaceId: true,
      role: true,
    },
  });

  return membership;
}

/**
 * Check if user is a system admin
 */
export async function isSystemAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === Role.ADMIN;
}

/**
 * Check if user is a member of the workspace (any role)
 */
export async function requireWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<PermissionCheckResult> {
  const [membership, systemAdmin] = await Promise.all([
    getWorkspaceMembership(workspaceId, userId),
    isSystemAdmin(userId),
  ]);

  return {
    allowed: !!membership || systemAdmin,
    membership,
    isSystemAdmin: systemAdmin,
  };
}

/**
 * Check if user is ADMIN or OWNER of the workspace
 * Required for: creating projects, creating tasks
 */
export async function requireWorkspaceAdminOrOwner(
  workspaceId: string,
  userId: string,
): Promise<PermissionCheckResult> {
  const [membership, systemAdmin] = await Promise.all([
    getWorkspaceMembership(workspaceId, userId),
    isSystemAdmin(userId),
  ]);

  const allowed =
    systemAdmin ||
    membership?.role === WorkspaceRole.OWNER ||
    membership?.role === WorkspaceRole.ADMIN;

  return {
    allowed,
    membership,
    isSystemAdmin: systemAdmin,
  };
}

/**
 * Check if user is OWNER of the workspace
 * Required for: inviting users, deleting workspace, changing roles
 */
export async function requireWorkspaceOwner(
  workspaceId: string,
  userId: string,
): Promise<PermissionCheckResult> {
  const [membership, systemAdmin] = await Promise.all([
    getWorkspaceMembership(workspaceId, userId),
    isSystemAdmin(userId),
  ]);

  const allowed = systemAdmin || membership?.role === WorkspaceRole.OWNER;

  return {
    allowed,
    membership,
    isSystemAdmin: systemAdmin,
  };
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
