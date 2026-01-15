// Dashboard page
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCoinStats } from "@/lib/coins";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Coins, 
  Briefcase, 
  CheckCircle, 
  TrendingUp,
  Plus,
  ArrowRight
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Get user stats
  const coinStats = await getCoinStats(user.id);
  
  // Get workspaces
  const workspaces = await db.workspace.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      _count: {
        select: {
          projects: true,
          documents: true,
          members: true,
        },
      },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  // Get recent tasks
  const recentTasks = await db.task.findMany({
    where: {
      OR: [
        { assignedTo: user.id },
        { createdById: user.id },
      ],
    },
    include: {
      project: {
        include: {
          workspace: true,
        },
      },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  // Get recent projects
  const recentProjects = await db.project.findMany({
    where: {
      workspace: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    },
    include: {
      workspace: true,
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-4">
              <Link href="/dashboard/subscription">
                <Button variant="outline">
                  <Coins className="h-4 w-4 mr-2" />
                  {coinStats.coins} Coins
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coins</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coinStats.coins}</div>
              <p className="text-xs text-muted-foreground">
                {coinStats.tier} Tier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workspaces.length}</div>
              <p className="text-xs text-muted-foreground">
                Active workspaces
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                Recent tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coinStats.totalEarned}</div>
              <p className="text-xs text-muted-foreground">
                Lifetime coins
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Workspaces */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Workspaces</CardTitle>
                  <CardDescription>Your collaborative workspaces</CardDescription>
                </div>
                <Link href="/dashboard/workspaces/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {workspaces.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No workspaces yet</p>
                  <Link href="/dashboard/workspaces/new">
                    <Button variant="outline" className="mt-4">
                      Create Workspace
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {workspaces.map((workspace) => (
                    <Link
                      key={workspace.id}
                      href={`/dashboard/workspaces/${workspace.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{workspace.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {workspace._count.projects} projects • {workspace._count.members} members
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Tasks assigned to you or created by you</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{task.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {task.project.workspace.name} • {task.project.name}
                          </p>
                        </div>
                        <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}