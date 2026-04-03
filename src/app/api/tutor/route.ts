import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { askTutor } from "@/lib/claude-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, lessonId } = body;

    if (!question || !lessonId) {
      return NextResponse.json(
        { error: "question and lessonId are required" },
        { status: 400 }
      );
    }

    // Load lesson content for context
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const lessonContent = lesson.contentMarkdown ?? lesson.description ?? "";
    const answer = await askTutor(question, lessonContent, lesson.module.name);

    return NextResponse.json({
      answer,
      source: "claude",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Tutor error:", message);
    return NextResponse.json(
      { error: "Failed to get answer. Please try again." },
      { status: 500 }
    );
  }
}
