import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { addCoins, type Tier } from "@/lib/coins";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AI_COST = 2;

const TIER_DAILY_LIMITS: Record<Tier, number> = {
  FREE: 5,
  PRO: 50,
  ELITE: 200,
  LEGEND: Infinity,
};

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Gemini API error:", error);
    throw new Error("Failed to get response from AI");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from AI");
  }

  return text;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, message } = body;

    if (!workspaceId || typeof workspaceId !== "string") {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 },
      );
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 },
      );
    }

    // Get user's current data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { coins: true, tier: true },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    return NextResponse.json(
      { error: "Failed to process AI request" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 },
      );
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
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}
