import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getNextTierInfo, type Tier } from "@/lib/coins";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Coins,
  Trophy,
  TrendingUp,
  Zap,
  FolderKanban,
  ListTodo,
  Building2,
  ArrowRight,
  Circle,
  Clock,
  CheckCircle2,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tierColors: Record<Tier, { bg: string; text: string; border: string }> = {
  FREE: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  PRO: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
  },
  ELITE: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-300",
  },
  LEGEND: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
  },
};

export default async function DashboardPage() {
  const sessionUser = await getCurrentUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser?.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      coins: true,
      tier: true,
    },
  });

  // Get user's workspaces
  const workspaceMemberships = await prisma.workspaceMember.findMany({
    where: { userId: sessionUser?.id },
    include: {
      workspace: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const workspaces = workspaceMemberships.map((m) => m.workspace);

  // Get recent projects across all workspaces
  const recentProjects = await prisma.project.findMany({
    where: {
      workspaceId: { in: workspaces.map((w) => w.id) },
    },
    include: {
      workspace: { select: { name: true } },
      _count: { select: { tasks: true } },
      tasks: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get tasks assigned to user
  const myTasks = await prisma.task.findMany({
    where: {
      assignedTo: sessionUser?.id,
    },
    include: {
      project: {
        include: {
          workspace: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const tierInfo = getNextTierInfo(user?.coins ?? 0);
  const currentTier = (user?.tier as Tier) || "FREE";
  const tierStyle = tierColors[currentTier];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your account
        </p>
      </div>

      {/* Coin Stats Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Coin Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.coins ?? 0}</div>
            <p className="text-xs text-muted-foreground">Total coins earned</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}
              >
                {currentTier}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentTier === "LEGEND"
                ? "Maximum tier reached!"
                : `Next: ${tierInfo.nextTier}`}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tierInfo.progressPercent}%
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${tierInfo.progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tierInfo.nextTier
                ? `${tierInfo.coinsToNext} coins to ${tierInfo.nextTier}`
                : "Max tier achieved!"}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Account Status
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-lg font-medium">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your account is in good standing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Info Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>Your registered email address</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{user?.email}</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Role</CardTitle>
            <CardDescription>Your current account role</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium capitalize">
              {user?.role.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Tier Benefits</CardTitle>
            <CardDescription>Your current tier perks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {currentTier === "FREE" && "Basic features included"}
              {currentTier === "PRO" && "Priority support + advanced features"}
              {currentTier === "ELITE" && "All Pro benefits + exclusive tools"}
              {currentTier === "LEGEND" && "Full access to all features"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects and Tasks Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Workspaces */}
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Recent Workspaces</CardTitle>
            </div>
            <Link
              href="/dashboard/workspaces"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {workspaces.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No workspaces yet
              </p>
            ) : (
              workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/workspace/${workspace.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium truncate">
                    {workspace.name}
                  </span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">Recent Projects</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No projects yet
              </p>
            ) : (
              recentProjects.map((project) => {
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
                    href={`/workspace/${project.workspaceId}/projects/${project.id}`}
                    className="block p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {project.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
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
                      <span className="text-[10px] text-muted-foreground">
                        {project.workspace.name}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* My Tasks */}
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">My Tasks</CardTitle>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {myTasks.length}
            </span>
          </CardHeader>
          <CardContent className="space-y-2">
            {myTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks assigned to you
              </p>
            ) : (
              myTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/workspace/${task.project.workspace.id}/projects/${task.projectId}`}
                  className="block p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "mt-0.5",
                        task.status === "DONE" && "text-emerald-500",
                        task.status === "IN_PROGRESS" && "text-amber-500",
                        task.status === "TODO" && "text-slate-400",
                      )}
                    >
                      {task.status === "DONE" && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {task.status === "IN_PROGRESS" && (
                        <Clock className="h-4 w-4" />
                      )}
                      {task.status === "TODO" && <Circle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          task.status === "DONE" &&
                            "line-through text-muted-foreground",
                        )}
                      >
                        {task.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {task.project.name}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
