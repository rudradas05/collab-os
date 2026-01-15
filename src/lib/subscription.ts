// Subscription and billing logic
import { db } from "./db";
import { spendCoins } from "./coins";
import { SUBSCRIPTION_TIERS } from "./constants";

export interface ProcessSubscriptionParams {
  userId: string;
  plan: keyof typeof SUBSCRIPTION_TIERS;
}

/**
 * Process subscription payment with coin deduction
 * If coins are insufficient, return the remaining amount to charge via Stripe
 */
export async function processSubscription(params: ProcessSubscriptionParams) {
  const { userId, plan } = params;

  const tier = SUBSCRIPTION_TIERS[plan];
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { points: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const userCoins = user.coins;
  const subscriptionCost = tier.price * 100; // Convert to cents

  // Calculate how much coins can cover (1 coin = $0.01)
  const coinValueInCents = userCoins * 1; // 1 coin = 1 cent
  const remainingAmount = Math.max(0, subscriptionCost - coinValueInCents);

  // Deduct coins if available
  let coinsUsed = 0;
  if (userCoins > 0 && subscriptionCost > 0) {
    const coinsToDeduct = Math.min(userCoins, subscriptionCost);
    try {
      await spendCoins({
        userId,
        amount: coinsToDeduct,
        type: "SUBSCRIPTION",
        description: `Subscription payment for ${plan} plan`,
        metadata: { plan, coinsUsed: coinsToDeduct },
      });
      coinsUsed = coinsToDeduct;
    } catch (error) {
      console.error("Error deducting coins:", error);
    }
  }

  // Get or create subscription
  let subscription = await db.subscription.findFirst({
    where: {
      userId,
      status: "active",
    },
  });

  const now = new Date();
  const renewalDate = new Date(now);
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  if (subscription) {
    subscription = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        plan: tier.name,
        coinsUsed: subscription.coinsUsed + coinsUsed,
        amountPaid: remainingAmount > 0 ? (remainingAmount / 100) : 0,
        currentPeriodStart: now,
        currentPeriodEnd: renewalDate,
        renewalDate,
        status: "active",
      },
    });
  } else {
    subscription = await db.subscription.create({
      data: {
        userId,
        plan: tier.name,
        coinsUsed,
        amountPaid: remainingAmount > 0 ? (remainingAmount / 100) : 0,
        currentPeriodStart: now,
        currentPeriodEnd: renewalDate,
        renewalDate,
        status: "active",
      },
    });
  }

  // Update user tier
  await db.user.update({
    where: { id: userId },
    data: { tier: tier.name },
  });

  return {
    subscription,
    coinsUsed,
    remainingAmount: remainingAmount / 100, // Convert back to dollars
    needsStripePayment: remainingAmount > 0,
  };
}

/**
 * Check if subscription needs renewal
 */
export async function checkSubscriptionRenewal(userId: string) {
  const subscription = await db.subscription.findFirst({
    where: {
      userId,
      status: "active",
    },
  });

  if (!subscription) {
    return null;
  }

  const now = new Date();
  const daysUntilRenewal = Math.ceil(
    (subscription.renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    subscription,
    daysUntilRenewal,
    needsRenewal: daysUntilRenewal <= 0,
  };
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string) {
  const subscription = await db.subscription.findFirst({
    where: {
      userId,
      status: "active",
    },
  });

  if (!subscription) {
    throw new Error("No active subscription found");
  }

  return await db.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });
}