"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  CreditCard,
  Package,
  Coins,
  Check,
  Sparkles,
  Crown,
  Zap,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Plan = "FREE" | "PRO" | "ELITE" | "LEGEND";

interface SubscriptionData {
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
  coins: number;
  tier: string;
}

const PLAN_DETAILS: Record<
  Exclude<Plan, "FREE">,
  {
    name: string;
    price: number;
    icon: typeof Sparkles;
    features: string[];
    color: string;
  }
> = {
  PRO: {
    name: "Pro",
    price: 39900, // ₹399 in paisa
    icon: Sparkles,
    features: [
      "50 AI prompts per day",
      "Priority support",
      "Up to 10 workspaces",
      "Up to 20 projects",
      "Unlimited tasks",
    ],
    color: "text-blue-500",
  },
  ELITE: {
    name: "Elite",
    price: 99900, // ₹999 in paisa
    icon: Zap,
    features: [
      "200 AI prompts per day",
      "Dedicated support",
      "Up to 20 workspaces",
      "Unlimited projects",
      "Unlimited tasks",
    ],
    color: "text-purple-500",
  },
  LEGEND: {
    name: "Legend",
    price: 199900, // ₹1999 in paisa
    icon: Crown,
    features: [
      "Unlimited AI prompts",
      "24/7 Priority support",
      "Unlimited workspaces",
      "Unlimited projects",
      "Unlimited tasks",
      "API access",
    ],
    color: "text-amber-500",
  },
};

function formatPrice(paisa: number): string {
  return `₹${(paisa / 100).toFixed(0)}`;
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();

    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");

    if (success === "true") {
      toast.success("Subscription activated successfully!");
    } else if (canceled === "true") {
      toast.info("Subscription checkout was canceled.");
    }
  }, [searchParams]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscription/create");
      const result = await response.json();

      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
      toast.error("Failed to load subscription data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    setUpgradingPlan(plan);

    try {
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Check if it's a Stripe-related error
        if (
          result.error?.includes("Stripe") ||
          result.error?.includes("payment")
        ) {
          toast.error("Card payments coming soon! Use your coins to upgrade.");
        } else {
          toast.error(result.error || "Failed to create subscription");
        }
        return;
      }

      if (result.success) {
        toast.success(result.message);
        fetchSubscription();
        return;
      }

      if (result.url) {
        // Stripe checkout URL - show coins message instead
        toast.error("Card payments coming soon! Use your coins to upgrade.");
        return;
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Card payments coming soon! Use your coins to upgrade.");
    } finally {
      setUpgradingPlan(null);
    }
  };

  const currentPlan = (data?.subscription?.plan as Plan) || "FREE";
  const coins = data?.coins ?? 0;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading billing info...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Current Plan
            </CardTitle>
            <CardDescription>Your active subscription plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold">
                  {currentPlan === "FREE" ? "Free Plan" : `${currentPlan} Plan`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan === "FREE"
                    ? "Basic features for getting started"
                    : data?.subscription?.status === "active"
                      ? "Active subscription"
                      : `Status: ${data?.subscription?.status}`}
                </p>
              </div>
              {data?.subscription?.currentPeriodEnd && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    Renews on{" "}
                    {new Date(
                      data.subscription.currentPeriodEnd,
                    ).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Coin Balance
            </CardTitle>
            <CardDescription>
              Use coins for subscription discounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold">{coins} coins</p>
                <p className="text-sm text-muted-foreground">
                  1 coin = ₹1 discount
                </p>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                Earn coins by completing tasks
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Upgrade Your Plan</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {(["PRO", "ELITE", "LEGEND"] as const).map((plan, index) => {
            const details = PLAN_DETAILS[plan];
            const Icon = details.icon;
            const isCurrentPlan = currentPlan === plan;
            const coinValueInPaisa = coins * 100; // 1 coin = 100 paisa (₹1)
            const priceAfterDiscount = Math.max(
              0,
              details.price - coinValueInPaisa,
            );
            const effectiveDiscount = Math.min(coinValueInPaisa, details.price);

            return (
              <motion.div
                key={plan}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
                    isCurrentPlan && "border-primary shadow-lg",
                    plan === "ELITE" && "border-purple-500/50",
                  )}
                >
                  {plan === "ELITE" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={cn("h-5 w-5", details.color)} />
                      {details.name}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-bold text-foreground">
                        {formatPrice(details.price)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {details.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Separator />

                    {coins > 0 && !isCurrentPlan && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Original price
                          </span>
                          <span>{formatPrice(details.price)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Coin discount</span>
                          <span>-{formatPrice(effectiveDiscount)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>You pay</span>
                          <span>{formatPrice(priceAfterDiscount)}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      variant={isCurrentPlan ? "outline" : "default"}
                      disabled={isCurrentPlan || upgradingPlan !== null}
                      onClick={() => handleUpgrade(plan)}
                    >
                      {upgradingPlan === plan ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : priceAfterDiscount === 0 ? (
                        "Upgrade with Coins"
                      ) : (
                        `Upgrade to ${details.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
          <CardDescription>Secure payments powered by Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              256-bit SSL encryption
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              PCI DSS compliant
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Cancel anytime
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
