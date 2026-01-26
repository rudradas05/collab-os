import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getWorkspaceWithMembership } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import {
  Building2,
  Users,
  Calendar,
  Crown,
  FolderKanban,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  // Get workspace projects
  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });

  const totalProjects = await prisma.project.count({
    where: { workspaceId: workspace.id },
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Projects
            </CardTitle>
            <CardDescription>
              {totalProjects === 0
                ? "Create your first project to get started"
                : `${totalProjects} project${totalProjects === 1 ? "" : "s"} in this workspace`}
            </CardDescription>
          </div>
          <Link href={`/workspace/${workspace.id}/projects`}>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Project
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <FolderKanban className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No projects yet
              </h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                Projects help you organize your work and collaborate with your
                team
              </p>
              <Link href={`/workspace/${workspace.id}/projects`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/workspace/${workspace.id}/projects/${project.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project._count.tasks} task
                          {project._count.tasks === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
              {totalProjects > 5 && (
                <Link
                  href={`/workspace/${workspace.id}/projects`}
                  className="block"
                >
                  <Button variant="ghost" className="w-full">
                    View all {totalProjects} projects
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
