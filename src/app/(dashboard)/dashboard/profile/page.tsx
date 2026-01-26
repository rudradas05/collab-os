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
import { Coins, History, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { ProfileEditor } from "@/components/dashboard/profile-editor";

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

  // Prepare user data for the client component
  const userData = {
    id: user?.id || "",
    name: user?.name || "",
    email: user?.email || "",
    role: user?.role || "USER",
    avatar: user?.avatar || null,
    coins: user?.coins ?? 0,
    tier: currentTier,
  };

  const tierData = {
    currentTier,
    nextTier: tierInfo.nextTier,
    coinsToNext: tierInfo.coinsToNext,
    progressPercent: tierInfo.progressPercent,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          View and edit your account information
        </p>
      </div>

      <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Your personal details and account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileEditor user={userData} tierInfo={tierData} />
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
