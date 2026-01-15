// Coin economy constants
export const COIN_REWARDS = {
  TASK_COMPLETED: 10,
  AI_USED: 2,
  PROJECT_COMPLETED_EARLY: 50,
  INVITE_TEAMMATE: 20,
  CREATE_AUTOMATION: 15,
} as const;

// Subscription tiers and coin requirements
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: "Free",
    minCoins: 0,
    maxCoins: 499,
    price: 0,
    features: ["Basic access", "Limited docs", "Basic AI"],
  },
  PRO: {
    name: "Pro",
    minCoins: 500,
    maxCoins: 1499,
    price: 9.99,
    features: ["Unlimited docs", "Basic AI", "Team collaboration"],
  },
  ELITE: {
    name: "Elite",
    minCoins: 1500,
    maxCoins: 2999,
    price: 19.99,
    features: ["Realtime collaboration", "Automations", "Advanced AI"],
  },
  LEGEND: {
    name: "Legend",
    minCoins: 3000,
    maxCoins: Infinity,
    price: 39.99,
    features: ["Custom AI bots", "Analytics", "Priority support"],
  },
} as const;

// Task statuses
export const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// Project statuses
export const PROJECT_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;

// Workspace member roles
export const WORKSPACE_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: "task_assigned",
  TASK_COMPLETED: "task_completed",
  PROJECT_DEADLINE: "project_deadline",
  COIN_EARNED: "coin_earned",
  COIN_SPENT: "coin_spent",
  TIER_UPGRADED: "tier_upgraded",
  INVITE_RECEIVED: "invite_received",
  AUTOMATION_TRIGGERED: "automation_triggered",
} as const;

// Coin transaction types
export const COIN_TRANSACTION_TYPES = {
  TASK_COMPLETED: "task_completed",
  AI_USED: "ai_used",
  PROJECT_COMPLETED: "project_completed",
  INVITE: "invite",
  AUTOMATION: "automation",
  SUBSCRIPTION: "subscription",
  MANUAL_ADJUSTMENT: "manual_adjustment",
} as const;