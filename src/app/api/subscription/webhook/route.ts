import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";
import { createNotification } from "@/lib/notifications";
import { sendSubscriptionUpdatedEmail } from "@/lib/email";
import { ApiErrors } from "@/lib/api-errors";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// In-memory idempotency cache for processed events (in production, use Redis)
const processedEvents = new Map<string, number>();
const EVENT_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function isEventProcessed(eventId: string): boolean {
  const timestamp = processedEvents.get(eventId);
  if (!timestamp) return false;

  // Check if entry has expired
  if (Date.now() - timestamp > EVENT_CACHE_TTL) {
    processedEvents.delete(eventId);
    return false;
  }

  return true;
}

function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now());

  // Cleanup old entries periodically
  if (processedEvents.size > 1000) {
    const now = Date.now();
    for (const [id, timestamp] of processedEvents.entries()) {
      if (now - timestamp > EVENT_CACHE_TTL) {
        processedEvents.delete(id);
      }
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 },
      );
    }

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 503 },
      );
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return ApiErrors.badRequest("Missing signature");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return ApiErrors.badRequest("Invalid signature");
    }

    // Idempotency check - prevent duplicate processing
    if (isEventProcessed(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed after successful handling
    markEventProcessed(event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return ApiErrors.internalError("Webhook handler failed");
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!stripeSubscriptionId || !stripe) {
    console.error("Missing subscription ID");
    return;
  }

  // Get subscription details from Stripe
  const stripeSubscription =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);

  // Get the current period end from the subscription (use type assertion for Stripe API compatibility)
  const subData = stripeSubscription as unknown as {
    current_period_end?: number;
  };
  const currentPeriodEnd = subData.current_period_end
    ? new Date(subData.current_period_end * 1000)
    : new Date();

  // Create or update subscription record
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      plan,
      status: "active",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId,
      currentPeriodEnd,
    },
    create: {
      userId,
      plan,
      status: "active",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId,
      currentPeriodEnd,
    },
  });

  // Update user tier
  await prisma.user.update({
    where: { id: userId },
    data: { tier: plan },
  });

  // Get user details for notification and email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  // Create in-app notification
  await createNotification({
    userId,
    title: "Subscription Activated",
    message: `Welcome to the ${plan} plan! Enjoy your enhanced features.`,
    type: "SUCCESS",
  });

  // Send email notification
  if (user?.email) {
    await sendSubscriptionUpdatedEmail(
      user.email,
      user.name,
      plan,
      "activated",
    );
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) return;

  // Find subscription by Stripe subscription ID
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSubscription) {
    console.log("Subscription not found for update:", subscription.id);
    return;
  }

  const status = mapStripeStatus(subscription.status);

  // Use type assertion for Stripe API compatibility
  const subData = subscription as unknown as { current_period_end?: number };
  const currentPeriodEnd = subData.current_period_end
    ? new Date(subData.current_period_end * 1000)
    : new Date();

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status,
      currentPeriodEnd,
    },
  });

  // Update user tier if subscription is no longer active
  if (status !== "active") {
    await prisma.user.update({
      where: { id: existingSubscription.userId },
      data: { tier: "FREE" },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find subscription by Stripe subscription ID
  const existingSubscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSubscription) {
    console.log("Subscription not found for deletion:", subscription.id);
    return;
  }

  await prisma.subscription.update({
    where: { id: existingSubscription.id },
    data: {
      status: "canceled",
    },
  });

  // Reset user tier to FREE
  await prisma.user.update({
    where: { id: existingSubscription.userId },
    data: { tier: "FREE" },
  });

  // Get user details for notification and email
  const user = await prisma.user.findUnique({
    where: { id: existingSubscription.userId },
    select: { name: true, email: true },
  });

  // Create in-app notification
  await createNotification({
    userId: existingSubscription.userId,
    title: "Subscription Canceled",
    message:
      "Your subscription has been canceled. You've been moved to the FREE plan.",
    type: "WARNING",
  });

  // Send email notification
  if (user?.email) {
    await sendSubscriptionUpdatedEmail(
      user.email,
      user.name,
      "FREE",
      "canceled",
    );
  }
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
      return "incomplete";
    case "incomplete_expired":
      return "incomplete_expired";
    case "trialing":
      return "trialing";
    case "paused":
      return "paused";
    default:
      return "unknown";
  }
}
