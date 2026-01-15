// API: Process subscription payment
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { processSubscription } from "@/lib/subscription";
import { SUBSCRIPTION_TIERS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { plan } = body;

    if (!plan || !(plan.toUpperCase() in SUBSCRIPTION_TIERS)) {
      return NextResponse.json(
        { error: "Invalid subscription plan" },
        { status: 400 }
      );
    }

    const result = await processSubscription({
      userId: user.id,
      plan: plan.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS,
    });

    return NextResponse.json({
      success: true,
      data: result,
      // If Stripe payment is needed, return client secret or payment intent
      needsStripePayment: result.needsStripePayment,
      stripeAmount: result.remainingAmount,
    });
  } catch (error) {
    console.error("Error processing subscription:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process subscription",
      },
      { status: 500 }
    );
  }
}