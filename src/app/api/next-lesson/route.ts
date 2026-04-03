import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId") ?? "default-user";

  // Get all lessons ordered by curriculum sequence
  const lessons = await prisma.lesson.findMany({
    include: {
      module: { include: { phase: true } },
      progress: { where: { userId } },
    },
    orderBy: [
      { module: { phase: { order: "asc" } } },
      { module: { order: "asc" } },
      { order: "asc" },
    ],
  });

  // Find first incomplete lesson
  const nextLesson = lessons.find(
    (l) => !l.progress.some((p) => p.status === "completed")
  );

  if (!nextLesson) {
    return NextResponse.json({ completed: true, message: "All lessons completed!" });
  }

  // Count today's completed lessons
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const lessonsToday = await prisma.lessonProgress.count({
    where: {
      userId,
      status: "completed",
      completedAt: { gte: todayStart },
    },
  });

  // Calculate module progress
  const moduleLessons = lessons.filter((l) => l.moduleId === nextLesson.moduleId);
  const moduleCompleted = moduleLessons.filter((l) =>
    l.progress.some((p) => p.status === "completed")
  ).length;

  return NextResponse.json({
    completed: false,
    lessonId: nextLesson.id,
    title: nextLesson.title,
    description: nextLesson.description,
    moduleId: nextLesson.moduleId,
    moduleName: nextLesson.module.name,
    phaseName: nextLesson.module.phase.name,
    phaseOrder: nextLesson.module.phase.order,
    estimatedMinutes: nextLesson.estimatedMinutes,
    difficulty: nextLesson.difficulty,
    lessonsToday,
    moduleProgress: {
      completed: moduleCompleted,
      total: moduleLessons.length,
    },
  });
}
