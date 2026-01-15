// Coin system engine
import { db } from "./db";
import { COIN_REWARDS, SUBSCRIPTION_TIERS, COIN_TRANSACTION_TYPES } from "./constants";

export interface CoinEarnParams {
  userId: string;
  amount: number;
  type: keyof typeof COIN_TRANSACTION_TYPES;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CoinSpendParams {
  userId: string;
  amount: number;
  type: keyof typeof COIN_TRANSACTION_TYPES;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Calculate user tier based on coin balance
 */
export function calculateTier(coins: number): string {
  if (coins >= SUBSCRIPTION_TIERS.LEGEND.minCoins) {
    return SUBSCRIPTION_TIERS.LEGEND.name;
  }
  if (coins >= SUBSCRIPTION_TIERS.ELITE.minCoins) {
    return SUBSCRIPTION_TIERS.ELITE.name;
  }
  if (coins >= SUBSCRIPTION_TIERS.PRO.minCoins) {
    return SUBSCRIPTION_TIERS.PRO.name;
  }
  return SUBSCRIPTION_TIERS.FREE.name;
}

/**
 * Earn coins for user actions
 */
export async function earnCoins(params: CoinEarnParams) {
  const { userId, amount, type, description, metadata } = params;

  // Get or create user points
  let userPoints = await db.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) {
    userPoints = await db.userPoints.create({
      data: {
        userId,
        coins: 0,
        totalEarned: 0,
        totalSpent: 0,
        tier: "Free",
      },
    });
  }

  // Update coins
  const newBalance = userPoints.coins + amount;
  const newTier = calculateTier(newBalance);

  // Update user points
  await db.userPoints.update({
    where: { userId },
    data: {
      coins: newBalance,
      totalEarned: userPoints.totalEarned + amount,
      tier: newTier,
    },
  });

  // Update user tier if changed
  const tierChanged = newTier !== userPoints.tier;
  if (tierChanged) {
    await db.user.update({
      where: { id: userId },
      data: { tier: newTier, coins: newBalance },
    });
  } else {
    await db.user.update({
      where: { id: userId },
      data: { coins: newBalance },
    });
  }

  // Create transaction record
  await db.coinTransaction.create({
    data: {
      userId,
      amount,
      type: COIN_TRANSACTION_TYPES[type],
      description: description || `Earned ${amount} coins for ${type}`,
      metadata: metadata || {},
    },
  });

  // Create notification if tier upgraded
  if (tierChanged) {
    await db.notification.create({
      data: {
        userId,
        type: "tier_upgraded",
        title: "Tier Upgraded!",
        message: `Congratulations! You've been upgraded to ${newTier} tier.`,
        metadata: { oldTier: userPoints.tier, newTier },
      },
    });
  }

  return {
    newBalance,
    newTier,
    tierChanged,
  };
}

/**
 * Spend coins (for subscriptions, etc.)
 */
export async function spendCoins(params: CoinSpendParams) {
  const { userId, amount, type, description, metadata } = params;

  // Get user points
  const userPoints = await db.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) {
    throw new Error("User points not found");
  }

  if (userPoints.coins < amount) {
    throw new Error("Insufficient coins");
  }

  // Update coins
  const newBalance = userPoints.coins - amount;
  const newTier = calculateTier(newBalance);

  // Update user points
  await db.userPoints.update({
    where: { userId },
    data: {
      coins: newBalance,
      totalSpent: userPoints.totalSpent + amount,
      tier: newTier,
    },
  });

  // Update user
  await db.user.update({
    where: { id: userId },
    data: { coins: newBalance, tier: newTier },
  });

  // Create transaction record
  await db.coinTransaction.create({
    data: {
      userId,
      amount: -amount,
      type: COIN_TRANSACTION_TYPES[type],
      description: description || `Spent ${amount} coins for ${type}`,
      metadata: metadata || {},
    },
  });

  return {
    newBalance,
    newTier,
  };
}

/**
 * Get coin statistics for user
 */
export async function getCoinStats(userId: string) {
  const userPoints = await db.userPoints.findUnique({
    where: { userId },
  });

  if (!userPoints) {
    return {
      coins: 0,
      tier: "Free",
      totalEarned: 0,
      totalSpent: 0,
      netCoins: 0,
    };
  }

  const recentTransactions = await db.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    coins: userPoints.coins,
    tier: userPoints.tier,
    totalEarned: userPoints.totalEarned,
    totalSpent: userPoints.totalSpent,
    netCoins: userPoints.totalEarned - userPoints.totalSpent,
    recentTransactions,
  };
}