import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  calculateQuizXp,
  updateStreak,
  checkAchievements,
} from "@/lib/gamification";
import { XP_TABLE } from "@/lib/constants";

const DEFAULT_USER_ID = "default-user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId, answers, timeSpentSec } = body as {
      quizId: string;
      answers: Record<string, string>;
      timeSpentSec: number;
    };

    if (!quizId || !answers) {
      return NextResponse.json(
        { error: "quizId and answers are required" },
        { status: 400 }
      );
    }

    // Fetch quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: { orderBy: { order: "asc" } },
        lesson: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Score the quiz
    const totalQuestions = quiz.questions.length;
    let correctCount = 0;

    for (const question of quiz.questions) {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctCount++;
      }
    }

    const score =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Calculate XP
    const xpEarned = calculateQuizXp(score);

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: DEFAULT_USER_ID,
        quizId,
        score,
        answers: JSON.stringify(answers),
        timeSpentSec: timeSpentSec ?? 0,
      },
    });

    // Update LessonProgress.quizBestScore if this is better
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: DEFAULT_USER_ID,
          lessonId: quiz.lessonId,
        },
      },
    });

    if (!existingProgress || (existingProgress.quizBestScore ?? 0) < score) {
      await prisma.lessonProgress.upsert({
        where: {
          userId_lessonId: {
            userId: DEFAULT_USER_ID,
            lessonId: quiz.lessonId,
          },
        },
        update: { quizBestScore: score },
        create: {
          userId: DEFAULT_USER_ID,
          lessonId: quiz.lessonId,
          status: "in_progress",
          quizBestScore: score,
        },
      });
    }

    // Update streak and XP
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

    const streakResult = updateStreak(streakState);
    const totalXpEarned = xpEarned + streakResult.streakXp;

    await prisma.streak.upsert({
      where: { userId: DEFAULT_USER_ID },
      update: {
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastActiveDate: streakResult.lastActiveDate,
        graceDaysUsed: streakResult.graceDaysUsed,
        consecutiveDaysAfterGrace: streakResult.consecutiveDaysAfterGrace,
        totalXp: { increment: totalXpEarned },
      },
      create: {
        userId: DEFAULT_USER_ID,
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastActiveDate: streakResult.lastActiveDate,
        graceDaysUsed: streakResult.graceDaysUsed,
        graceDaysMax: streakResult.graceDaysMax,
        consecutiveDaysAfterGrace: streakResult.consecutiveDaysAfterGrace,
        totalXp: totalXpEarned,
      },
    });

    // Check achievements
    const existingAchievements = await prisma.userAchievement.findMany({
      where: { userId: DEFAULT_USER_ID },
      select: { achievementId: true },
    });

    const allAttempts = await prisma.quizAttempt.findMany({
      where: { userId: DEFAULT_USER_ID },
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: { userId: DEFAULT_USER_ID, status: "completed" },
    });

    const newAchievements = checkAchievements({
      lessonsCompleted: completedLessons,
      quizzesCompleted: allAttempts.length,
      perfectQuizzes: allAttempts.filter((a) => a.score === 100).length,
      currentStreak: streakResult.currentStreak,
      quickWinsCompleted: 0,
      reviewsCompleted: 0,
      modulesCompleted: [],
      phasesCompleted: [],
      sessionHour: new Date().getHours(),
      sessionDurationMin: Math.round((timeSpentSec ?? 0) / 60),
      graceDayUsed: streakResult.graceDayUsed,
      existingAchievements: existingAchievements.map((a) => a.achievementId),
    });

    // Save new achievements
    if (newAchievements.length > 0) {
      for (const achievementId of newAchievements) {
        await prisma.userAchievement.upsert({
          where: {
            userId_achievementId: { userId: DEFAULT_USER_ID, achievementId },
          },
          update: {},
          create: { userId: DEFAULT_USER_ID, achievementId },
        });
      }
    }

    return NextResponse.json({
      score,
      xpEarned: totalXpEarned,
      correctCount,
      totalQuestions,
      newAchievements,
    });
  } catch (error) {
    console.error("POST /api/quiz/submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
