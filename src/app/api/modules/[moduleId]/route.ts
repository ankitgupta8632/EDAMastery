import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const DEFAULT_USER_ID = "default-user";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params;
    const userId =
      request.nextUrl.searchParams.get("userId") ?? DEFAULT_USER_ID;

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        phase: true,
        lessons: {
          orderBy: { order: "asc" },
          include: {
            progress: {
              where: { userId },
            },
            quiz: true,
          },
        },
      },
    });

    if (!mod) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    const lessons = mod.lessons.map((lesson) => {
      const prog = lesson.progress[0];
      const quiz = lesson.quiz;

      return {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        order: lesson.order,
        difficulty: lesson.difficulty,
        estimatedMinutes: lesson.estimatedMinutes,
        contentType: lesson.contentType,
        audioUrl: lesson.audioUrl,
        status: prog?.status ?? "not_started",
        completedAt: prog?.completedAt ?? null,
        timeSpentSec: prog?.timeSpentSec ?? 0,
        quizBestScore: prog?.quizBestScore ?? null,
        quizId: quiz?.id ?? null,
      };
    });

    const completedCount = lessons.filter(
      (l) => l.status === "completed"
    ).length;

    const lessonsProgress: Record<string, { status: string; completedAt: string | null; timeSpentSec: number; quizBestScore: number | null }> = {};
    for (const l of lessons) {
      lessonsProgress[l.id] = {
        status: l.status,
        completedAt: l.completedAt?.toISOString() ?? null,
        timeSpentSec: l.timeSpentSec,
        quizBestScore: l.quizBestScore,
      };
    }

    return NextResponse.json({
      id: mod.id,
      name: mod.name,
      description: mod.description,
      order: mod.order,
      phaseId: mod.phaseId,
      phaseName: mod.phase.name,
      lessons,
      progress: {
        completionPercent:
          mod.lessons.length > 0
            ? Math.round((completedCount / mod.lessons.length) * 100)
            : 0,
        lessons: lessonsProgress,
      },
    });
  } catch (error) {
    console.error("GET /api/modules/[moduleId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}
