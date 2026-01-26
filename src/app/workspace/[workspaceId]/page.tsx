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
  Shield,
  FolderKanban,
  Plus,
  ArrowRight,
  CheckCircle2,
  ListTodo,
  AlertTriangle,
  Clock,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      tasks: {
        select: {
          status: true,
        },
      },
    },
  });

  const totalProjects = await prisma.project.count({
    where: { workspaceId: workspace.id },
  });

  // Calculate completed projects (all tasks done)
  const completedProjects = projects.filter((p) => {
    if (p.tasks.length === 0) return false;
    return p.tasks.every((t) => t.status === "DONE");
  }).length;

  // Get tasks assigned to current user in this workspace
  const myTasks = await prisma.task.findMany({
    where: {
      assignedTo: user.id,
      project: { workspaceId: workspace.id },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      project: {
        select: { name: true },
      },
    },
  });

  const myTasksCount = await prisma.task.count({
    where: {
      assignedTo: user.id,
      project: { workspaceId: workspace.id },
    },
  });

  // Get overdue tasks (tasks with dueDate in past and not DONE)
  const overdueTasks = await prisma.task.count({
    where: {
      project: { workspaceId: workspace.id },
      status: { not: "DONE" },
      dueDate: { lt: new Date() },
    },
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Welcome back, {user.name || "there"}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your projects today
          </p>
        </div>
        <Link href={`/workspace/${workspace.id}/projects`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Cards - New Design */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-3xl font-bold">{totalProjects}</p>
              <p className="text-xs text-muted-foreground">
                projects in {workspace.name}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
              <FolderKanban className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Completed Projects
              </p>
              <p className="text-3xl font-bold">{completedProjects}</p>
              <p className="text-xs text-muted-foreground">
                of {totalProjects} total
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">My Tasks</p>
              <p className="text-3xl font-bold">{myTasksCount}</p>
              <p className="text-xs text-muted-foreground">assigned to me</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <ListTodo className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Overdue</p>
              <p className="text-3xl font-bold">{overdueTasks}</p>
              <p className="text-xs text-muted-foreground">need attention</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project Overview - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Project Overview</h2>
            <Link
              href={`/workspace/${workspace.id}/projects`}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
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
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const totalTasks = project.tasks.length;
                const doneTasks = project.tasks.filter(
                  (t) => t.status === "DONE",
                ).length;
                const progress =
                  totalTasks > 0
                    ? Math.round((doneTasks / totalTasks) * 100)
                    : 0;

                return (
                  <Link
                    key={project.id}
                    href={`/workspace/${workspace.id}/projects/${project.id}`}
                    className="block"
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {project.name}
                            </h3>
                            {project.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            ACTIVE
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {memberCount} members
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(project.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                progress === 100
                                  ? "bg-emerald-500"
                                  : progress > 50
                                    ? "bg-cyan-500"
                                    : progress > 0
                                      ? "bg-amber-500"
                                      : "bg-muted-foreground/20",
                              )}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar - My Tasks & Overdue */}
        <div className="space-y-4">
          {/* My Tasks Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">My Tasks</CardTitle>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {myTasksCount}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              {myTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks assigned to you
                </p>
              ) : (
                myTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-1 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium text-sm line-clamp-1">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          "uppercase font-medium",
                          task.status === "DONE" && "text-emerald-600",
                          task.status === "IN_PROGRESS" && "text-amber-600",
                          task.status === "TODO" && "text-muted-foreground",
                        )}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                      <span>•</span>
                      <span
                        className={cn(
                          "font-medium",
                          task.priority === "HIGH" && "text-red-600",
                          task.priority === "MEDIUM" && "text-amber-600",
                          task.priority === "LOW" && "text-emerald-600",
                        )}
                      >
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Overdue Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Overdue</CardTitle>
              </div>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  overdueTasks > 0
                    ? "bg-red-500 text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {overdueTasks}
              </span>
            </CardHeader>
            <CardContent>
              {overdueTasks === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No overdue tasks 🎉
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You have {overdueTasks} task{overdueTasks === 1 ? "" : "s"}{" "}
                  that need attention
                </p>
              )}
            </CardContent>
          </Card>

          {/* Workspace Info Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Workspace Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Your Role</span>
                <span className="font-medium capitalize flex items-center gap-1">
                  {workspace.role === "OWNER" && (
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  {workspace.role === "ADMIN" && (
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                  )}
                  {workspace.role.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-medium truncate max-w-30">
                  {owner?.name}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium">{memberCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {new Date(workspace.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
