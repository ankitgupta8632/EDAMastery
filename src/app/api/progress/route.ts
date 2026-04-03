import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateStreak, calculateLessonXp, getLevelFromXp } from "@/lib/gamification";
import { XP_TABLE } from "@/lib/constants";

const DEFAULT_USER_ID = "default-user";

export async function GET() {
  try {
    const phases = await prisma.phase.findMany({
      orderBy: { order: "asc" },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              include: {
                progress: {
                  where: { userId: DEFAULT_USER_ID },
                },
              },
            },
          },
        },
      },
    });

    const phaseProgress = phases.map((phase) => {
      const modules = phase.modules.map((mod) => {
        const totalLessons = mod.lessons.length;
        const completedLessons = mod.lessons.filter(
          (l) => l.progress[0]?.status === "completed"
        ).length;
        const inProgressLessons = mod.lessons.filter(
          (l) => l.progress[0]?.status === "in_progress"
        ).length;

        return {
          moduleId: mod.id,
          moduleName: mod.name,
          totalLessons,
          completedLessons,
          inProgressLessons,
          completionPercent:
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0,
          isLocked: false,
        };
      });

      const totalLessons = modules.reduce((s, m) => s + m.totalLessons, 0);
      const completedLessons = modules.reduce(
        (s, m) => s + m.completedLessons,
        0
      );

      return {
        phaseId: phase.id,
        phaseName: phase.name,
        colorHex: phase.colorHex,
        order: phase.order,
        modules,
        totalLessons,
        completedLessons,
        completionPercent:
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0,
      };
    });

    return NextResponse.json({ phases: phaseProgress });
  } catch (error) {
    console.error("GET /api/progress error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      lessonId,
      status,
      timeSpentSec,
      confidenceScore,
      audioProgress,
      scrollPosition,
    } = body;

    if (!lessonId || !status) {
      return NextResponse.json(
        { error: "lessonId and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = ["in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    if (timeSpentSec !== undefined && (typeof timeSpentSec !== "number" || timeSpentSec < 0)) {
      return NextResponse.json(
        { error: "timeSpentSec must be a non-negative number" },
        { status: 400 }
      );
    }

    // Verify lesson exists
    const lessonExists = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lessonExists) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const now = new Date();
    const isCompleted = status === "completed";

    // Upsert lesson progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: DEFAULT_USER_ID,
          lessonId,
        },
      },
      update: {
        status,
        ...(timeSpentSec !== undefined && { timeSpentSec }),
        ...(confidenceScore !== undefined && { confidenceScore }),
        ...(audioProgress !== undefined && { audioProgress }),
        ...(scrollPosition !== undefined && { scrollPosition }),
        ...(isCompleted && { completedAt: now }),
      },
      create: {
        userId: DEFAULT_USER_ID,
        lessonId,
        status,
        timeSpentSec: timeSpentSec ?? 0,
        confidenceScore: confidenceScore ?? null,
        audioProgress: audioProgress ?? 0,
        scrollPosition: scrollPosition ?? 0,
        ...(isCompleted && { completedAt: now }),
      },
    });

    let xpEarned = 0;
    let streakUpdate = null;

    if (isCompleted) {
      xpEarned = calculateLessonXp(lessonExists.contentType ?? "mixed");

      // Update streak
      const existingStreak = await prisma.streak.findUnique({
        where: { userId: DEFAULT_USER_ID },
      });

      const streakState = existingStreak ?? {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        graceDaysUsed: 0,
        graceDaysMax: 1,
        consecutiveDaysAfterGrace: 0,
      };

      streakUpdate = updateStreak(streakState);
      xpEarned += streakUpdate.streakXp;

      // Upsert streak
      await prisma.streak.upsert({
        where: { userId: DEFAULT_USER_ID },
        update: {
          currentStreak: streakUpdate.currentStreak,
          longestStreak: streakUpdate.longestStreak,
          lastActiveDate: streakUpdate.lastActiveDate,
          graceDaysUsed: streakUpdate.graceDaysUsed,
          consecutiveDaysAfterGrace: streakUpdate.consecutiveDaysAfterGrace,
          totalXp: { increment: xpEarned },
        },
        create: {
          userId: DEFAULT_USER_ID,
          currentStreak: streakUpdate.currentStreak,
          longestStreak: streakUpdate.longestStreak,
          lastActiveDate: streakUpdate.lastActiveDate,
          graceDaysUsed: streakUpdate.graceDaysUsed,
          graceDaysMax: streakUpdate.graceDaysMax,
          consecutiveDaysAfterGrace: streakUpdate.consecutiveDaysAfterGrace,
          totalXp: xpEarned,
        },
      });
    }

    return NextResponse.json({
      progress,
      xpEarned,
      streak: streakUpdate
        ? {
            currentStreak: streakUpdate.currentStreak,
            longestStreak: streakUpdate.longestStreak,
            streakBroken: streakUpdate.streakBroken,
            graceDayUsed: streakUpdate.graceDayUsed,
          }
        : null,
    });
  } catch (error) {
    console.error("POST /api/progress error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
