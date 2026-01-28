import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/**
 * Ensures coin-only subscriptions expire and downgrade users after the period ends.
 * Stripe subscriptions are managed by webhooks and are not touched here.
 */
export async function reconcileUserSubscription(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      id: true,
      plan: true,
      status: true,
      currentPeriodEnd: true,
      stripeSubscriptionId: true,
    },
  });

  if (!subscription) return;

  if (subscription.status !== "active") return;

  if (!subscription.currentPeriodEnd) return;

  const isCoinOnly = !subscription.stripeSubscriptionId;
  if (!isCoinOnly) return;

  if (subscription.currentPeriodEnd > new Date()) return;

  const endedAt = subscription.currentPeriodEnd;

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "expired" },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { tier: "FREE" },
    }),
  ]);

  await createNotification({
    userId,
    title: "Subscription Expired",
    message: `Your ${subscription.plan} plan expired on ${endedAt.toLocaleDateString()}. You've been moved to the FREE plan.`,
    type: "WARNING",
  });
}
