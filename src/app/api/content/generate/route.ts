import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildLessonPrompt, parseNotebookLmResponse } from "@/lib/content-parser";
import { queryNotebook } from "@/lib/notebooklm";
import { buildQuizPrompt, parseQuizResponse } from "@/lib/quiz-generator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId } = body as { lessonId: string };

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId is required" },
        { status: 400 }
      );
    }

    // Load lesson with module info
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: {
            name: true,
            notebookId: true,
            notebookUrl: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    // Build the prompt
    const prompt = buildLessonPrompt(
      lesson.title,
      lesson.module.name,
      lesson.difficulty,
      lesson.estimatedMinutes
    );

    // Query NotebookLM
    const rawResponse = await queryNotebook(
      prompt,
      lesson.module.notebookId ?? undefined,
      lesson.module.notebookUrl ?? undefined
    );

    // Parse the response
    const parsed = parseNotebookLmResponse(rawResponse);

    // Save to lesson
    const now = new Date();
    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        contentMarkdown: rawResponse,
        contentJson: JSON.stringify(parsed),
        contentStatus: "generated",
        generatedAt: now,
        sourceQuery: prompt,
      },
    });

    // Optionally generate quiz questions
    let quizGenerated = false;
    if (rawResponse.length > 200) {
      try {
        const quizPrompt = buildQuizPrompt(lesson.title, rawResponse, 4);
        const quizRaw = await queryNotebook(
          quizPrompt,
          lesson.module.notebookId ?? undefined,
          lesson.module.notebookUrl ?? undefined
        );
        const questions = parseQuizResponse(quizRaw);

        if (questions.length > 0) {
          // Upsert quiz
          const quiz = await prisma.quiz.upsert({
            where: { lessonId },
            update: {},
            create: { lessonId },
          });

          // Delete existing questions and create new ones
          await prisma.question.deleteMany({
            where: { quizId: quiz.id },
          });

          await prisma.question.createMany({
            data: questions.map((q) => ({
              quizId: quiz.id,
              questionText: q.questionText,
              questionType: q.questionType,
              options: JSON.stringify(q.options),
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              difficulty: q.difficulty,
              order: q.order,
            })),
          });

          quizGenerated = true;
        }
      } catch (quizError) {
        console.error("Quiz generation failed (non-fatal):", quizError);
      }
    }

    return NextResponse.json({
      lesson: {
        id: updated.id,
        title: updated.title,
        contentStatus: updated.contentStatus,
        generatedAt: updated.generatedAt,
      },
      parsed,
      quizGenerated,
    });
  } catch (error) {
    console.error("POST /api/content/generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
