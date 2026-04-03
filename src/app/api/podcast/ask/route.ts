import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { askPodcastHost } from "@/lib/claude-client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, lessonId, audioTimestamp, recentTranscriptSegment } = body;

    if (!question || !lessonId) {
      return NextResponse.json(
        { error: "question and lessonId are required" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const transcript = recentTranscriptSegment || lesson.audioTranscript?.slice(0, 3000) || "";

    const answer = await askPodcastHost(
      question,
      transcript,
      audioTimestamp ?? 0,
      lesson.title,
      lesson.module.name
    );

    return NextResponse.json({
      answer,
      timestamp: audioTimestamp ?? 0,
      source: "podcast_host",
    });
  } catch (error) {
    console.error("Podcast ask error:", error);
    return NextResponse.json(
      { error: "Failed to get podcast host response" },
      { status: 500 }
    );
  }
}
