// Authentication utilities
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";

/**
 * Get current authenticated user from Clerk and sync with database
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  // Get user from Clerk
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  // Find or create user in database
  let user = await db.user.findUnique({
    where: { clerkId },
    include: {
      points: true,
      subscriptions: {
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    // Create new user
    user = await db.user.create({
      data: {
        clerkId,
        firstName: clerkUser.firstName || "User",
        lastName: clerkUser.lastName || "",
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        avatar: clerkUser.imageUrl,
        coins: 100, // Welcome bonus
        tier: "Free",
      },
      include: {
        points: true,
        subscriptions: true,
      },
    });

    // Create user points
    await db.userPoints.create({
      data: {
        userId: user.id,
        coins: 100,
        totalEarned: 100,
        totalSpent: 0,
        tier: "Free",
      },
    });

    // Create welcome transaction
    await db.coinTransaction.create({
      data: {
        userId: user.id,
        amount: 100,
        type: "manual_adjustment",
        description: "Welcome bonus",
        metadata: { source: "signup" },
      },
    });
  } else {
    // Update user info from Clerk if needed
    user = await db.user.update({
      where: { id: user.id },
      data: {
        firstName: clerkUser.firstName || user.firstName,
        lastName: clerkUser.lastName || user.lastName,
        email: clerkUser.emailAddresses[0]?.emailAddress || user.email,
        avatar: clerkUser.imageUrl || user.avatar,
      },
      include: {
        points: true,
        subscriptions: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  return user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}