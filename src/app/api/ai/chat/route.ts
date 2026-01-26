import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addCoins, type Tier } from "@/lib/coins";
import { aiChatSchema } from "@/lib/validations";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
  getClientIdentifier,
} from "@/lib/rate-limit";
import { handleZodError, ApiErrors } from "@/lib/api-errors";


const AI_COST = 2;



const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

console.log("GEMINI KEY OK:", !!process.env.GEMINI_API_KEY);

const TIER_DAILY_LIMITS: Record<Tier, number> = {
  FREE: 5,
  PRO: 50,
  ELITE: 200,
  LEGEND: Infinity,
};



async function callGemini(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);

    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error("EMPTY_RESPONSE");
    }

    return text;
  } catch (error: any) {
    console.error("Gemini error:", error);

    if (error?.message?.includes("quota") || error?.status === 429) {
      throw new Error("RATE_LIMIT_EXCEEDED");
    }

    throw new Error("AI_FAILED");
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for AI (20/hour)
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkRateLimit(
      `ai:chat:${clientId}`,
      RATE_LIMITS.AI,
    );
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const parseResult = aiChatSchema.safeParse(body);

    if (!parseResult.success) {
      return handleZodError(parseResult.error);
    }

    const { workspaceId, message } = parseResult.data;

    // Verify user is member of workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!membership) {
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    // Get user's current data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { coins: true, tier: true },
    });

    if (!userData) {
      return ApiErrors.notFound("User");
    }

    const userTier = (userData.tier as Tier) || "FREE";
    const dailyLimit = TIER_DAILY_LIMITS[userTier];

    // Check daily AI usage count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayUsage = await prisma.aIMessage.count({
      where: {
        userId: user.id,
        role: "USER",
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    if (todayUsage >= dailyLimit) {
      return NextResponse.json(
        {
          error: `Daily limit reached. ${userTier} tier allows ${dailyLimit} AI prompts per day.`,
          limitReached: true,
        },
        { status: 429 },
      );
    }

    // Check coin balance
    if (userData.coins < AI_COST) {
      return NextResponse.json(
        {
          error: `Insufficient coins. AI prompts cost ${AI_COST} coins. You have ${userData.coins} coins.`,
          insufficientCoins: true,
        },
        { status: 402 },
      );
    }

    // Deduct coins BEFORE calling Gemini
    const coinResult = await addCoins(
      user.id,
      -AI_COST,
      "AI prompt",
      `ai-${user.id}-${Date.now()}`,
    );

    if (!coinResult.success) {
      return NextResponse.json(
        { error: "Failed to process payment" },
        { status: 500 },
      );
    }

    // Call Gemini API
    let aiResponse: string;
    try {
      aiResponse = await callGemini(message.trim());
    } catch (error) {
      // Refund coins if AI call fails
      await addCoins(
        user.id,
        AI_COST,
        "AI prompt refund (error)",
        `ai-refund-${user.id}-${Date.now()}`,
      );
      console.error("AI call error:", error);

      // Check for rate limit error
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage === "RATE_LIMIT_EXCEEDED") {
        return NextResponse.json(
          {
            error:
              "AI service quota exceeded. Please try again later or upgrade your plan. Coins refunded.",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { error: "Failed to get AI response. Coins refunded." },
        { status: 500 },
      );
    }

    // Save messages
    const [userMessage, assistantMessage] = await prisma.$transaction([
      prisma.aIMessage.create({
        data: {
          userId: user.id,
          workspaceId,
          role: "USER",
          content: message.trim(),
        },
      }),
      prisma.aIMessage.create({
        data: {
          userId: user.id,
          workspaceId,
          role: "ASSISTANT",
          content: aiResponse,
        },
      }),
    ]);

    return NextResponse.json({
      userMessage: {
        id: userMessage.id,
        role: userMessage.role,
        content: userMessage.content,
        createdAt: userMessage.createdAt,
      },
      assistantMessage: {
        id: assistantMessage.id,
        role: assistantMessage.role,
        content: assistantMessage.content,
        createdAt: assistantMessage.createdAt,
      },
      coinsSpent: AI_COST,
      newBalance: coinResult.newBalance,
      remainingToday: dailyLimit - todayUsage - 1,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return ApiErrors.internalError("Failed to process AI request");
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return ApiErrors.badRequest("Workspace ID is required");
    }

    // Verify user is member of workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!membership) {
      return ApiErrors.forbidden("You are not a member of this workspace");
    }

    // Get messages for this workspace
    const messages = await prisma.aIMessage.findMany({
      where: {
        userId: user.id,
        workspaceId,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    // Get user's current data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { coins: true, tier: true },
    });

    const userTier = (userData?.tier as Tier) || "FREE";
    const dailyLimit = TIER_DAILY_LIMITS[userTier];

    // Check daily usage
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayUsage = await prisma.aIMessage.count({
      where: {
        userId: user.id,
        role: "USER",
        createdAt: {
          gte: startOfDay,
        },
      },
    });

    return NextResponse.json({
      messages,
      coins: userData?.coins ?? 0,
      tier: userTier,
      dailyLimit,
      usedToday: todayUsage,
      remainingToday: Math.max(0, dailyLimit - todayUsage),
    });
  } catch (error) {
    console.error("Get AI messages error:", error);
    return ApiErrors.internalError("Failed to fetch messages");
  }
}
