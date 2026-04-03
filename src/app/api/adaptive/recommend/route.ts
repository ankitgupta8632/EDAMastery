import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRecommendation } from "@/lib/adaptive-engine";

const DEFAULT_USER_ID = "default-user";

export async function GET(request: NextRequest) {
  try {
    const userId =
      request.nextUrl.searchParams.get("userId") ?? DEFAULT_USER_ID;

    // Load user settings
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    const prefs = {
      preferredMode: settings?.preferredMode ?? "auto",
      commuteStartTime: settings?.commuteStartTime ?? "08:00",
      commuteEndTime: settings?.commuteEndTime ?? "09:00",
      eveningStartTime: settings?.eveningStartTime ?? "20:00",
      eveningEndTime: settings?.eveningEndTime ?? "22:00",
      overwhelmedMode: settings?.overwhelmedMode ?? false,
      overwhelmedUntil: settings?.overwhelmedUntil ?? null,
      dailyGoalMinutes: settings?.dailyGoalMinutes ?? 15,
      reducedGoalMinutes: settings?.reducedGoalMinutes ?? 5,
      weekendLearning: settings?.weekendLearning ?? false,
    };

    const recommendation = getRecommendation(prefs);

    // Get completed lesson IDs
    const completedLessonIds = (
      await prisma.lessonProgress.findMany({
        where: { userId, status: "completed" },
        select: { lessonId: true },
      })
    ).map((p) => p.lessonId);

    // Get all modules with prerequisites
    const modules = await prisma.module.findMany({
      include: {
        prerequisites: { select: { prerequisiteId: true } },
        lessons: {
          orderBy: { order: "asc" },
          include: {
            progress: {
              where: { userId },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    // Find completed modules
    const completedModuleIds = new Set<string>();
    for (const mod of modules) {
      if (mod.lessons.length > 0) {
        const allDone = mod.lessons.every(
          (l) => l.progress[0]?.status === "completed"
        );
        if (allDone) completedModuleIds.add(mod.id);
      }
    }

    // Find next suggested lessons (not completed, prerequisites met)
    const suggestedLessons: Array<{
      id: string;
      title: string;
      moduleName: string;
      moduleId: string;
      estimatedMinutes: number;
      difficulty: string;
      contentType: string;
    }> = [];

    for (const mod of modules) {
      // Check prerequisites met
      const prereqsMet = mod.prerequisites.every((p) =>
        completedModuleIds.has(p.prerequisiteId)
      );
      if (!prereqsMet) continue;

      // Find first incomplete lesson in this module
      for (const lesson of mod.lessons) {
        if (lesson.progress[0]?.status !== "completed") {
          suggestedLessons.push({
            id: lesson.id,
            title: lesson.title,
            moduleName: mod.name,
            moduleId: mod.id,
            estimatedMinutes: lesson.estimatedMinutes,
            difficulty: lesson.difficulty,
            contentType: lesson.contentType,
          });
          break; // Only suggest first incomplete per module
        }
      }

      if (suggestedLessons.length >= 5) break;
    }

    return NextResponse.json({
      recommendation,
      suggestedLessons,
    });
  } catch (error) {
    console.error("GET /api/adaptive/recommend error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendation" },
      { status: 500 }
    );
  }
}
