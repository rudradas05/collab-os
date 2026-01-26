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
export type UserTier = "FREE" | SubscriptionPlan;

// Prices in paisa (1 rupee = 100 paisa)
export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  PRO: 39900, // ₹399
  ELITE: 99900, // ₹999
  LEGEND: 199900, // ₹1999
};

// Plan limits configuration
export const PLAN_LIMITS: Record<
  UserTier,
  {
    maxWorkspaces: number;
    maxProjects: number;
    maxAIPromptsPerDay: number;
    maxTasks: number; // -1 means unlimited
  }
> = {
  FREE: {
    maxWorkspaces: 2,
    maxProjects: 5,
    maxAIPromptsPerDay: 5,
    maxTasks: -1, // unlimited
  },
  PRO: {
    maxWorkspaces: 10,
    maxProjects: 20,
    maxAIPromptsPerDay: 50,
    maxTasks: -1, // unlimited
  },
  ELITE: {
    maxWorkspaces: 20,
    maxProjects: -1, // unlimited
    maxAIPromptsPerDay: 200,
    maxTasks: -1, // unlimited
  },
  LEGEND: {
    maxWorkspaces: -1, // unlimited
    maxProjects: -1, // unlimited
    maxAIPromptsPerDay: -1, // unlimited
    maxTasks: -1, // unlimited
  },
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  PRO: [
    "50 AI prompts per day",
    "Priority support",
    "Up to 10 workspaces",
    "Up to 20 projects",
    "Unlimited tasks",
  ],
  ELITE: [
    "200 AI prompts per day",
    "Dedicated support",
    "Up to 20 workspaces",
    "Unlimited projects",
    "Unlimited tasks",
  ],
  LEGEND: [
    "Unlimited AI prompts",
    "24/7 Priority support",
    "Unlimited workspaces",
    "Unlimited projects",
    "Unlimited tasks",
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
