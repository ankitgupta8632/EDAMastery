import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateStreak, getLevelFromXp, getXpToNextLevel } from "@/lib/gamification";

const DEFAULT_USER_ID = "default-user";

export async function GET(request: NextRequest) {
  try {
    const userId =
      request.nextUrl.searchParams.get("userId") ?? DEFAULT_USER_ID;

    const streak = await prisma.streak.findUnique({
      where: { userId },
    });

    if (!streak) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        totalXp: 0,
        level: { level: 1, name: "Novice", icon: "🌱", xpRequired: 0 },
        xpToNextLevel: { current: 0, needed: 500, progress: 0 },
      });
    }

    const level = getLevelFromXp(streak.totalXp);
    const xpToNextLevel = getXpToNextLevel(streak.totalXp);

    return NextResponse.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      totalXp: streak.totalXp,
      level,
      xpToNextLevel,
    });
  } catch (error) {
    console.error("GET /api/streak error:", error);
    return NextResponse.json(
      { error: "Failed to fetch streak" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId =
      request.nextUrl.searchParams.get("userId") ?? DEFAULT_USER_ID;

    const existingStreak = await prisma.streak.findUnique({
      where: { userId },
    });

    const streakState = existingStreak ?? {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      graceDaysUsed: 0,
      graceDaysMax: 1,
      consecutiveDaysAfterGrace: 0,
    };

    const result = updateStreak(streakState);

    const streak = await prisma.streak.upsert({
      where: { userId },
      update: {
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        lastActiveDate: result.lastActiveDate,
        graceDaysUsed: result.graceDaysUsed,
        consecutiveDaysAfterGrace: result.consecutiveDaysAfterGrace,
        totalXp: { increment: result.streakXp },
      },
      create: {
        userId,
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        lastActiveDate: result.lastActiveDate,
        graceDaysUsed: result.graceDaysUsed,
        graceDaysMax: result.graceDaysMax,
        consecutiveDaysAfterGrace: result.consecutiveDaysAfterGrace,
        totalXp: result.streakXp,
      },
    });

    const level = getLevelFromXp(streak.totalXp);
    const xpToNextLevel = getXpToNextLevel(streak.totalXp);

    return NextResponse.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      streakBroken: result.streakBroken,
      graceDayUsed: result.graceDayUsed,
      streakXp: result.streakXp,
      totalXp: streak.totalXp,
      level,
      xpToNextLevel,
    });
  } catch (error) {
    console.error("POST /api/streak error:", error);
    return NextResponse.json(
      { error: "Failed to update streak" },
      { status: 500 }
    );
  }
}
