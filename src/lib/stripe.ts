import Stripe from "stripe";

function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_")) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover",
  });
}

export const stripe = getStripe();

export type SubscriptionPlan = "PRO" | "ELITE" | "LEGEND";

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  PRO: 999, // $9.99 in cents
  ELITE: 1999, // $19.99 in cents
  LEGEND: 4999, // $49.99 in cents
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  PRO: [
    "50 AI prompts per day",
    "Priority support",
    "Up to 5 workspaces",
    "Advanced analytics",
  ],
  ELITE: [
    "200 AI prompts per day",
    "Dedicated support",
    "Unlimited workspaces",
    "Custom integrations",
  ],
  LEGEND: [
    "Unlimited AI prompts",
    "24/7 Priority support",
    "White-label options",
    "API access",
  ],
};

export function getPriceId(plan: SubscriptionPlan): string | null {
  switch (plan) {
    case "PRO":
      return process.env.STRIPE_PRICE_PRO || null;
    case "ELITE":
      return process.env.STRIPE_PRICE_ELITE || null;
    case "LEGEND":
      return process.env.STRIPE_PRICE_LEGEND || null;
    default:
      return null;
  }
}

export function isValidPlan(plan: string): plan is SubscriptionPlan {
  return ["PRO", "ELITE", "LEGEND"].includes(plan);
}
