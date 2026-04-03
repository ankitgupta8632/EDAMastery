import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateNextReview } from "@/lib/spaced-repetition";
import { XP_TABLE } from "@/lib/constants";

const DEFAULT_USER_ID = "default-user";

export async function GET(request: NextRequest) {
  try {
    const userId =
      request.nextUrl.searchParams.get("userId") ?? DEFAULT_USER_ID;

    const now = new Date();

    const dueItems = await prisma.reviewItem.findMany({
      where: {
        userId,
        nextReview: { lte: now },
      },
      include: {
        lesson: {
          select: {
            title: true,
            moduleId: true,
            module: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { nextReview: "asc" },
    });

    const items = dueItems.map((item) => ({
      id: item.id,
      lessonId: item.lessonId,
      lessonTitle: item.lesson.title,
      moduleName: item.lesson.module.name,
      easeFactor: item.easeFactor,
      interval: item.interval,
      repetitions: item.repetitions,
      nextReview: item.nextReview,
      lastReview: item.lastReview,
      quality: item.quality,
    }));

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    console.error("GET /api/review error:", error);
    return NextResponse.json(
      { error: "Failed to fetch review items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewItemId, quality } = body as {
      reviewItemId: string;
      quality: number;
    };

    if (!reviewItemId || quality === undefined) {
      return NextResponse.json(
        { error: "reviewItemId and quality are required" },
        { status: 400 }
      );
    }

    if (quality < 0 || quality > 5) {
      return NextResponse.json(
        { error: "quality must be between 0 and 5" },
        { status: 400 }
      );
    }

    const existing = await prisma.reviewItem.findUnique({
      where: { id: reviewItemId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Review item not found" },
        { status: 404 }
      );
    }

    // Calculate next review using SM-2
    const result = calculateNextReview(
      {
        easeFactor: existing.easeFactor,
        interval: existing.interval,
        repetitions: existing.repetitions,
      },
      quality
    );

    // Update review item
    const updated = await prisma.reviewItem.update({
      where: { id: reviewItemId },
      data: {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        nextReview: result.nextReview,
        lastReview: new Date(),
        quality,
      },
    });

    // Award review XP
    const xpEarned = XP_TABLE.REVIEW_ITEM;
    await prisma.streak.upsert({
      where: { userId: existing.userId },
      update: { totalXp: { increment: xpEarned } },
      create: {
        userId: existing.userId,
        totalXp: xpEarned,
      },
    });

    return NextResponse.json({
      item: updated,
      xpEarned,
    });
  } catch (error) {
    console.error("POST /api/review error:", error);
    return NextResponse.json(
      { error: "Failed to record review" },
      { status: 500 }
    );
  }
}
