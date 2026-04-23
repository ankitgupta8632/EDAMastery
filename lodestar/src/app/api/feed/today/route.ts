import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildOrGetTodaySession, refreshTodaySession } from "@/lib/feed/engine";
import { readStreak } from "@/lib/streak";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const minutes = Number(searchParams.get("minutes") ?? 60);
  const rebuild = searchParams.get("rebuild") === "1";

  const { sessionId, date } = rebuild
    ? await refreshTodaySession(DEFAULT_USER_ID, minutes)
    : await buildOrGetTodaySession(DEFAULT_USER_ID, minutes);

  const session = await prisma.feedSession.findUnique({
    where: { id: sessionId },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          link: {
            include: {
              topics: { include: { topic: true } },
              interactions: { select: { action: true } },
            },
          },
        },
      },
    },
  });
  const streak = await readStreak();

  return NextResponse.json({
    date,
    session,
    streak,
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => null)) as { minutes?: number } | null;
  const minutes = body?.minutes ?? 60;
  const { sessionId } = await refreshTodaySession(DEFAULT_USER_ID, minutes);
  return NextResponse.json({ sessionId });
}
