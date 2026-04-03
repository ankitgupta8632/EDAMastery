import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const lessonId = request.nextUrl.searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json(
        { error: "lessonId query parameter is required" },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "No quiz found for this lesson" },
        { status: 404 }
      );
    }

    // Parse options from JSON string to array
    const questionsWithParsedOptions = quiz.questions.map((q) => ({
      ...q,
      options: JSON.parse(q.options) as string[],
    }));

    return NextResponse.json({
      id: quiz.id,
      lessonId: quiz.lessonId,
      questions: questionsWithParsedOptions,
    });
  } catch (error) {
    console.error("GET /api/quiz error:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}
