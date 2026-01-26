import { prisma } from "@/lib/prisma";

// Tier thresholds
const TIER_THRESHOLDS = {
  FREE: { min: 0, max: 499 },
  PRO: { min: 500, max: 1499 },
  ELITE: { min: 1500, max: 2999 },
  LEGEND: { min: 3000, max: Infinity },
} as const;

export type Tier = keyof typeof TIER_THRESHOLDS;

/**
 * Calculate the tier based on coin balance
 */
export function recalcTier(coins: number): Tier {
  if (coins >= TIER_THRESHOLDS.LEGEND.min) return "LEGEND";
  if (coins >= TIER_THRESHOLDS.ELITE.min) return "ELITE";
  if (coins >= TIER_THRESHOLDS.PRO.min) return "PRO";
  return "FREE";
}

/**
 * Get the next tier and coins needed to reach it
 */
export function getNextTierInfo(coins: number): {
  currentTier: Tier;
  nextTier: Tier | null;
  coinsToNext: number;
  progressPercent: number;
} {
  const currentTier = recalcTier(coins);

  if (currentTier === "LEGEND") {
    return {
      currentTier,
      nextTier: null,
      coinsToNext: 0,
      progressPercent: 100,
    };
  }

  const tierOrder: Tier[] = ["FREE", "PRO", "ELITE", "LEGEND"];
  const currentIndex = tierOrder.indexOf(currentTier);
  const nextTier = tierOrder[currentIndex + 1];

  const currentMin = TIER_THRESHOLDS[currentTier].min;
  const nextMin = TIER_THRESHOLDS[nextTier].min;
  const coinsInTier = coins - currentMin;
  const coinsNeededForTier = nextMin - currentMin;

  const progressPercent = Math.min(
    100,
    Math.round((coinsInTier / coinsNeededForTier) * 100),
  );

  return {
    currentTier,
    nextTier,
    coinsToNext: nextMin - coins,
    progressPercent,
  };
}

/**
 * Add coins to a user, create transaction, and recalculate tier
 */
export async function addCoins(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string,
): Promise<{
  success: boolean;
  newBalance: number;
  newTier: Tier;
  transaction?: { id: string; amount: number; reason: string };
  error?: string;
}> {
  try {
    // If referenceId provided, check for duplicate
    if (referenceId) {
      const existingTransaction = await prisma.coinTransaction.findUnique({
        where: { referenceId },
      });

      if (existingTransaction) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { coins: true, tier: true },
        });

        return {
          success: false,
          newBalance: user?.coins ?? 0,
          newTier: (user?.tier as Tier) ?? "FREE",
          error: "Transaction already exists for this reference",
        };
      }
    }

    // Get current user coins to calculate new total
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    });

    if (!currentUser) {
      return {
        success: false,
        newBalance: 0,
        newTier: "FREE",
        error: "User not found",
      };
    }

    const newBalance = Math.max(0, currentUser.coins + amount);
    const newTier = recalcTier(newBalance);

    // Use transaction to ensure atomicity
    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          coins: newBalance,
          tier: newTier,
        },
      }),
      prisma.coinTransaction.create({
        data: {
          userId,
          amount,
          reason,
          referenceId: referenceId ?? `${userId}-${Date.now()}`,
        },
      }),
    ]);

    return {
      success: true,
      newBalance: updatedUser.coins,
      newTier: updatedUser.tier as Tier,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        reason: transaction.reason,
      },
    };
  } catch (error) {
    console.error("addCoins error:", error);
    return {
      success: false,
      newBalance: 0,
      newTier: "FREE",
      error: "Failed to add coins",
    };
  }
}
