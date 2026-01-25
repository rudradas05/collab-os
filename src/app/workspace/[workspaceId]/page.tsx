import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getWorkspaceWithMembership } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { Building2, Users, Calendar, Crown, FolderKanban } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { workspaceId } = await params;
  const workspace = await getWorkspaceWithMembership(workspaceId, user.id);

  if (!workspace) {
    redirect("/dashboard/workspaces");
  }

  // Get workspace stats
  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId: workspace.id },
  });

  const owner = await prisma.user.findUnique({
    where: { id: workspace.ownerId },
    select: { name: true, email: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{workspace.name}</h1>
        <p className="text-muted-foreground">Workspace Overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {workspace.role.toLowerCase()}
            </div>
            <p className="text-xs text-muted-foreground">
              {workspace.role === "OWNER"
                ? "Full workspace access"
                : "Workspace member access"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
            <p className="text-xs text-muted-foreground">
              {memberCount === 1 ? "Team member" : "Team members"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{owner?.name}</div>
            <p className="text-xs text-muted-foreground truncate">
              {owner?.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(workspace.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(workspace.createdAt).getFullYear()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projects
          </CardTitle>
          <CardDescription>
            Projects feature will be available in the next update
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <FolderKanban className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No projects yet
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Projects will allow you to organize your work and collaborate with
              your team
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
