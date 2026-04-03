import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_USER_ID = "default-user";

export async function GET(request: NextRequest) {
  try {
    const userId =
      request.nextUrl.searchParams.get("userId") ?? DEFAULT_USER_ID;

    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Return defaults
      return NextResponse.json({
        userId,
        dailyGoalMinutes: 15,
        weekendLearning: false,
        reminderTime: null,
        reminderEnabled: true,
        preferredMode: "auto",
        commuteStartTime: "08:00",
        commuteEndTime: "09:00",
        eveningStartTime: "20:00",
        eveningEndTime: "22:00",
        autoPlayAudio: true,
        playbackSpeed: 1.0,
        overwhelmedMode: false,
        overwhelmedUntil: null,
        reducedGoalMinutes: 5,
        notebookLmConfigured: false,
        onboardingCompleted: false,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId =
      request.nextUrl.searchParams.get("userId") ?? DEFAULT_USER_ID;
    const body = await request.json();

    // Validate numeric fields
    if (body.dailyGoalMinutes !== undefined) {
      if (typeof body.dailyGoalMinutes !== "number" || body.dailyGoalMinutes < 1 || body.dailyGoalMinutes > 480) {
        return NextResponse.json(
          { error: "dailyGoalMinutes must be between 1 and 480" },
          { status: 400 }
        );
      }
    }

    // Whitelist allowed fields
    const allowedFields = [
      "dailyGoalMinutes", "preferredDifficulty", "notificationsEnabled",
      "soundEnabled", "overwhelmedMode", "overwhelmedUntil",
      "onboardingCompleted", "morningStartTime", "morningEndTime",
      "eveningStartTime", "eveningEndTime", "weekendLearning",
      "reducedGoalMinutes", "notebookLmConfigured",
    ];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) updateData[key] = body[key];
    }
    if (body.overwhelmedMode === true && !body.overwhelmedUntil) {
      const until = new Date();
      until.setDate(until.getDate() + 3);
      updateData.overwhelmedUntil = until;
    } else if (body.overwhelmedMode === false) {
      updateData.overwhelmedUntil = null;
    }

    // Remove userId from update data if present
    delete updateData.userId;
    delete updateData.id;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
