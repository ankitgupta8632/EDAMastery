import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/constants";

const DEFAULT_USER_ID = "default-user";

export async function GET(request: NextRequest) {
  try {
    const userId =
      request.nextUrl.searchParams.get("userId") ?? DEFAULT_USER_ID;

    // Get earned achievements
    const earned = await prisma.userAchievement.findMany({
      where: { userId },
    });
    const earnedIds = new Set(earned.map((a) => a.achievementId));

    // Get progress data for unearned achievements
    const [
      lessonsCompleted,
      quizzesCompleted,
      perfectQuizCount,
      streak,
      reviewsCompleted,
    ] = await Promise.all([
      prisma.lessonProgress.count({
        where: { userId, status: "completed" },
      }),
      prisma.quizAttempt.count({
        where: { userId },
      }),
      prisma.quizAttempt.count({
        where: { userId, score: 100 },
      }),
      prisma.streak.findUnique({
        where: { userId },
      }),
      prisma.reviewItem.count({
        where: { userId, lastReview: { not: null } },
      }),
    ]);

    const achievements = ACHIEVEMENTS.map((def) => {
      const isEarned = earnedIds.has(def.id);
      const earnedData = earned.find((e) => e.achievementId === def.id);

      // Calculate progress toward unearned achievements
      let progress: number | undefined;
      if (!isEarned) {
        switch (def.id) {
          case "first_lesson":
            progress = Math.min(lessonsCompleted, 1);
            break;
          case "streak_3":
            progress = Math.min((streak?.currentStreak ?? 0) / 3, 1);
            break;
          case "streak_7":
            progress = Math.min((streak?.currentStreak ?? 0) / 7, 1);
            break;
          case "streak_14":
            progress = Math.min((streak?.currentStreak ?? 0) / 14, 1);
            break;
          case "streak_30":
            progress = Math.min((streak?.currentStreak ?? 0) / 30, 1);
            break;
          case "first_quiz":
            progress = Math.min(quizzesCompleted, 1);
            break;
          case "perfect_quiz":
            progress = Math.min(perfectQuizCount, 1);
            break;
          case "review_master":
            progress = Math.min(reviewsCompleted / 50, 1);
            break;
          default:
            progress = 0;
        }
      }

      return {
        ...def,
        earned: isEarned,
        earnedAt: earnedData?.earnedAt ?? null,
        progress: isEarned ? 1 : progress ?? 0,
      };
    });

    return NextResponse.json({
      achievements,
      earnedCount: earned.length,
      totalCount: ACHIEVEMENTS.length,
    });
  } catch (error) {
    console.error("GET /api/achievements error:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}
