// API: AI query endpoint
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  generateDocumentContent,
  breakDownTask,
  generateProjectSummary,
  suggestAutomations,
} from "@/lib/ai";
import { earnCoins } from "@/lib/coins";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { type, prompt, context, metadata } = body;

    if (!type || !prompt) {
      return NextResponse.json(
        { error: "Type and prompt are required" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "document":
        result = await generateDocumentContent(prompt, context);
        break;

      case "task_breakdown":
        result = await breakDownTask(prompt);
        break;

      case "project_summary":
        if (!metadata?.tasks) {
          return NextResponse.json(
            { error: "Tasks are required for project summary" },
            { status: 400 }
          );
        }
        result = await generateProjectSummary(prompt, metadata.tasks);
        break;

      case "automation_suggestions":
        result = await suggestAutomations(
          prompt,
          metadata?.currentAutomations || []
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid AI query type" },
          { status: 400 }
        );
    }

    // Award coins for AI usage
    await earnCoins({
      userId: user.id,
      amount: 2,
      type: "AI_USED",
      description: `Used AI for ${type}`,
      metadata: { type, prompt: prompt.substring(0, 100) },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error processing AI query:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process AI query",
      },
      { status: 500 }
    );
  }
}