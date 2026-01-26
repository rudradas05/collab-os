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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Coins, History, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser?.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      coins: true,
      tier: true,
    },
  });

  const transactions = await prisma.coinTransaction.findMany({
    where: { userId: sessionUser?.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      amount: true,
      reason: true,
      createdAt: true,
    },
  });

  const tierInfo = getNextTierInfo(user?.coins ?? 0);
  const currentTier = (user?.tier as Tier) || "FREE";
  const tierStyle = tierColors[currentTier];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">View your account information</p>
      </div>

      <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your personal details and account settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 transition-all duration-300 hover:ring-4 hover:ring-primary/20 hover:scale-105">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
              <AvatarFallback className="text-xl">
                {getInitials(user?.name || "")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <span
                className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}
              >
                {currentTier}
              </span>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Full Name
              </p>
              <p className="text-base">{user?.name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Email Address
              </p>
              <p className="text-base">{user?.email}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Account Role
              </p>
              <p className="text-base capitalize">{user?.role.toLowerCase()}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Coin Balance
              </p>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <p className="text-base font-semibold">{user?.coins ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Progress to {tierInfo.nextTier ?? "Max Tier"}
              </p>
              <p className="text-sm font-medium">{tierInfo.progressPercent}%</p>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${tierInfo.progressPercent}%` }}
              />
            </div>
            {tierInfo.nextTier && (
              <p className="text-xs text-muted-foreground">
                {tierInfo.coinsToNext} more coins needed for {tierInfo.nextTier}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coin History Card */}
      <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>Coin History</CardTitle>
          </div>
          <CardDescription>Your recent coin transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Coins className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No coin transactions yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Complete tasks to earn coins!
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              <div className="grid grid-cols-3 gap-4 pb-2 text-sm font-medium text-muted-foreground border-b">
                <span>Amount</span>
                <span>Reason</span>
                <span className="text-right">Date</span>
              </div>
              <div className="divide-y">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="grid grid-cols-3 gap-4 py-3 text-sm items-center hover:bg-muted/50 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {transaction.amount > 0 ? (
                        <ArrowUpCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`font-semibold ${
                          transaction.amount > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </span>
                    </div>
                    <span className="truncate">{transaction.reason}</span>
                    <span className="text-right text-muted-foreground text-xs">
                      {formatDate(transaction.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
