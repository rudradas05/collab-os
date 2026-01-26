import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getNextTierInfo, type Tier } from "@/lib/coins";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Coins, Trophy, TrendingUp, Zap } from "lucide-react";

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
    </div>
  );
}
