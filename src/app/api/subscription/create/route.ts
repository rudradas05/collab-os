import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addCoins } from "@/lib/coins";
import {
  stripe,
  PLAN_PRICES,
  getPriceId,
  isValidPlan,
  type SubscriptionPlan,
} from "@/lib/stripe";
import { createSubscriptionSchema } from "@/lib/validations";
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  RATE_LIMITS,
} from "@/lib/rate-limit";
import { ApiErrors, handleZodError } from "@/lib/api-errors";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for subscription operations (5/min)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `subscription:create:${clientId}`,
      RATE_LIMITS.SUBSCRIPTION,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 },
      );
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const parseResult = createSubscriptionSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { plan } = parseResult.data;

    if (!isValidPlan(plan)) {
      return ApiErrors.badRequest(
        "Invalid plan. Must be PRO, ELITE, or LEGEND.",
      );
    }

    const priceId = getPriceId(plan);
    if (!priceId) {
      return ApiErrors.internalError(
        `Price ID not configured for ${plan} plan`,
      );
    }

    // Check if user already has this plan
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (
      existingSubscription &&
      existingSubscription.plan === plan &&
      existingSubscription.status === "active"
    ) {
      return ApiErrors.badRequest("You already have this plan");
    }

    // Get user's coin balance
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { coins: true, email: true },
    });

    if (!userData) {
      return ApiErrors.notFound("User");
    }

    const planPrice = PLAN_PRICES[plan as SubscriptionPlan];
    const coinDiscount = Math.min(userData.coins, planPrice); // 1 coin = 1 cent
    const amountAfterDiscount = planPrice - coinDiscount;

    // Get or create Stripe customer
    let stripeCustomerId = existingSubscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
    }

    // If full discount covers the price, create subscription directly
    if (amountAfterDiscount <= 0) {
      // Deduct coins
      const coinResult = await addCoins(
        user.id,
        -planPrice,
        `Subscription to ${plan} plan (full coin payment)`,
        `subscription-${user.id}-${plan}-${Date.now()}`,
      );

      if (!coinResult.success) {
        return NextResponse.json(
          { error: "Failed to process coin payment" },
          { status: 500 },
        );
      }

      // Create or update subscription record
      const subscription = await prisma.subscription.upsert({
        where: { userId: user.id },
        update: {
          plan,
          status: "active",
          stripeCustomerId,
          stripeSubscriptionId: null,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        create: {
          userId: user.id,
          plan,
          status: "active",
          stripeCustomerId,
          stripeSubscriptionId: null,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Update user tier
      await prisma.user.update({
        where: { id: user.id },
        data: { tier: plan },
      });

      return NextResponse.json({
        success: true,
        message: "Subscription activated with coin payment",
        subscription: {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
        },
        coinsUsed: planPrice,
        amountCharged: 0,
      });
    }

    // Create Stripe Checkout session with discount
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      discounts:
        coinDiscount > 0
          ? [
              {
                coupon: await createOrGetDiscountCoupon(coinDiscount),
              },
            ]
          : undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
        coinDiscount: coinDiscount.toString(),
      },
    });

    // Deduct coins now (before redirect)
    if (coinDiscount > 0) {
      await addCoins(
        user.id,
        -coinDiscount,
        `Subscription discount for ${plan} plan`,
        `subscription-discount-${session.id}`,
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      coinDiscount,
      amountAfterDiscount,
    });
  } catch (error) {
    console.error("Subscription create error:", error);
    return ApiErrors.internalError("Failed to create subscription");
  }
}

async function createOrGetDiscountCoupon(amountOff: number): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");

  // Create a one-time coupon for this specific discount
  const coupon = await stripe.coupons.create({
    amount_off: amountOff,
    currency: "usd",
    duration: "once",
    name: `Coin Discount (${amountOff} cents)`,
  });

  return coupon.id;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { coins: true, tier: true },
    });

    return NextResponse.json({
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
      coins: userData?.coins ?? 0,
      tier: userData?.tier ?? "FREE",
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return ApiErrors.internalError("Failed to fetch subscription");
  }
}
