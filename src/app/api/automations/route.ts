// API: Automations
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createAutomation } from "@/lib/automation";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");

    const where: any = { userId: user.id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const automations = await db.automation.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: automations,
    });
  } catch (error) {
    console.error("Error getting automations:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get automations",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { name, description, workspaceId, trigger, conditions, actions } =
      body;

    if (!name || !trigger || !actions) {
      return NextResponse.json(
        { error: "Name, trigger, and actions are required" },
        { status: 400 }
      );
    }

    const automation = await createAutomation({
      userId: user.id,
      workspaceId,
      name,
      description,
      trigger,
      conditions,
      actions,
    });

    return NextResponse.json({
      success: true,
      data: automation,
    });
  } catch (error) {
    console.error("Error creating automation:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create automation",
      },
      { status: 500 }
    );
  }
}