import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;

    // Support lookup by ID or slug
    const lesson = await prisma.lesson.findFirst({
      where: {
        OR: [{ id: lessonId }, { slug: lessonId }],
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            order: true,
            phaseId: true,
            phase: { select: { order: true } },
          },
        },
        quiz: {
          select: { id: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Find next and previous lessons in the same module
    const siblingLessons = await prisma.lesson.findMany({
      where: { moduleId: lesson.moduleId },
      orderBy: { order: "asc" },
      select: { id: true, title: true, order: true, estimatedMinutes: true },
    });

    const currentIndex = siblingLessons.findIndex((l) => l.id === lessonId);
    let prevLesson: { id: string; title: string; order: number; estimatedMinutes?: number; moduleId?: string; moduleName?: string } | null =
      currentIndex > 0 ? siblingLessons[currentIndex - 1] : null;
    let nextLesson: { id: string; title: string; order: number; estimatedMinutes?: number; moduleId?: string; moduleName?: string } | null =
      currentIndex < siblingLessons.length - 1 ? siblingLessons[currentIndex + 1] : null;

    // If at end of module, find first lesson of next module
    if (!nextLesson) {
      const nextModuleLesson = await prisma.lesson.findFirst({
        where: {
          module: {
            phase: { order: { gte: lesson.module.phase.order } },
            order: { gt: lesson.module.order },
          },
        },
        orderBy: [
          { module: { phase: { order: "asc" } } },
          { module: { order: "asc" } },
          { order: "asc" },
        ],
        select: { id: true, title: true, estimatedMinutes: true, module: { select: { id: true, name: true } } },
      });
      if (nextModuleLesson) {
        nextLesson = {
          id: nextModuleLesson.id,
          title: nextModuleLesson.title,
          order: 0,
          estimatedMinutes: nextModuleLesson.estimatedMinutes,
          moduleId: nextModuleLesson.module.id,
          moduleName: nextModuleLesson.module.name,
        };
      }
    }

    // If at start of module, find last lesson of previous module
    if (!prevLesson) {
      const prevModuleLesson = await prisma.lesson.findFirst({
        where: {
          module: {
            phase: { order: { lte: lesson.module.phase.order } },
            order: { lt: lesson.module.order },
          },
        },
        orderBy: [
          { module: { phase: { order: "desc" } } },
          { module: { order: "desc" } },
          { order: "desc" },
        ],
        select: { id: true, title: true, estimatedMinutes: true, module: { select: { id: true, name: true } } },
      });
      if (prevModuleLesson) {
        prevLesson = {
          id: prevModuleLesson.id,
          title: prevModuleLesson.title,
          order: 0,
          estimatedMinutes: prevModuleLesson.estimatedMinutes,
          moduleId: prevModuleLesson.module.id,
          moduleName: prevModuleLesson.module.name,
        };
      }
    }

    return NextResponse.json({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      description: lesson.description,
      order: lesson.order,
      estimatedMinutes: lesson.estimatedMinutes,
      contentType: lesson.contentType,
      difficulty: lesson.difficulty,
      moduleId: lesson.moduleId,
      moduleName: lesson.module.name,
      phaseId: lesson.module.phaseId,
      contentMarkdown: lesson.contentMarkdown,
      contentJson: lesson.contentJson ? JSON.parse(lesson.contentJson) : null,
      videoUrl: lesson.videoUrl,
      audioUrl: lesson.audioUrl,
      audioTranscript: lesson.audioTranscript,
      videoTranscript: lesson.videoTranscript ?? null,
      flashcardsJson: lesson.flashcardsJson ?? null,
      infographicUrl: lesson.infographicUrl ?? null,
      protiumNote: lesson.protiumNote,
      labUrl: lesson.labUrl,
      labInstructions: lesson.labInstructions,
      contentStatus: lesson.contentStatus,
      generatedAt: lesson.generatedAt,
      hasQuiz: !!lesson.quiz,
      quizId: lesson.quiz?.id ?? null,
      nextLesson,
      prevLesson,
    });
  } catch (error) {
    console.error("GET /api/content/[lessonId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson content" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const body = await request.json();
    const { contentMarkdown, contentStatus, protiumNote, audioUrl } = body;

    const updateData: Record<string, unknown> = {};
    if (contentMarkdown !== undefined) updateData.contentMarkdown = contentMarkdown;
    if (contentStatus !== undefined) {
      updateData.contentStatus = contentStatus;
      if (contentStatus === "reviewed") {
        updateData.reviewedAt = new Date();
      }
    }
    if (protiumNote !== undefined) updateData.protiumNote = protiumNote;
    if (audioUrl !== undefined) updateData.audioUrl = audioUrl;

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      contentStatus: updated.contentStatus,
      contentMarkdown: updated.contentMarkdown,
      protiumNote: updated.protiumNote,
      audioUrl: updated.audioUrl,
    });
  } catch (error) {
    console.error("PUT /api/content/[lessonId] error:", error);
    return NextResponse.json(
      { error: "Failed to update lesson content" },
      { status: 500 }
    );
  }
}
