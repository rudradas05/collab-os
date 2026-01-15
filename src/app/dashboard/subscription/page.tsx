// Subscription page
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getCoinStats } from "@/lib/coins";
import { db } from "@/lib/db";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Check, Crown } from "lucide-react";

export default async function SubscriptionPage() {
  const user = await requireAuth();

  const coinStats = await getCoinStats(user.id);
  const subscription = await db.subscription.findFirst({
    where: {
      userId: user.id,
      status: "active",
    },
  });

  // Get current tier safely
  const tierKey = user.tier.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS;
  const currentTier = tierKey in SUBSCRIPTION_TIERS 
    ? SUBSCRIPTION_TIERS[tierKey] 
    : SUBSCRIPTION_TIERS.FREE;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Subscription & Coins</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Coin Balance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Your Coin Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold">{coinStats.coins}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Current Tier: <Badge>{coinStats.tier}</Badge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-xl font-semibold">{coinStats.totalEarned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Tiers */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Subscription Plans</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
              const isCurrentTier = user.tier === tier.name;
              const canAfford = coinStats.coins >= tier.minCoins;

              return (
                <Card
                  key={key}
                  className={isCurrentTier ? "border-primary border-2" : ""}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{tier.name}</CardTitle>
                      {isCurrentTier && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {tier.minCoins === 0
                        ? "Free"
                        : `${tier.minCoins}-${tier.maxCoins === Infinity ? "∞" : tier.maxCoins} coins`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold">
                          ${tier.price}
                          <span className="text-sm font-normal text-muted-foreground">
                            /month
                          </span>
                        </p>
                      </div>
                      <ul className="space-y-2">
                        {tier.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isCurrentTier ? "outline" : "default"}
                        disabled={isCurrentTier || !canAfford}
                      >
                        {isCurrentTier
                          ? "Current Plan"
                          : canAfford
                          ? "Subscribe"
                          : "Not Enough Coins"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        {coinStats.recentTransactions && coinStats.recentTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your coin earning and spending history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {coinStats.recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-semibold">
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount} coins
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}