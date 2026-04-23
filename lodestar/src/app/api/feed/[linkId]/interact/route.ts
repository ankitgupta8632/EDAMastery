import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { bumpStreak } from "@/lib/streak";

const ACTIONS = new Set(["opened", "completed", "saved", "dismissed", "loved", "not_for_me"]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ linkId: string }> }
): Promise<NextResponse> {
  const { linkId } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    action?: string;
    msWatched?: number;
  } | null;
  const action = body?.action ?? "";
  if (!ACTIONS.has(action)) {
    return NextResponse.json({ error: "invalid action" }, { status: 400 });
  }

  await prisma.interaction.create({
    data: {
      userId: DEFAULT_USER_ID,
      linkId,
      action,
      msWatched: body?.msWatched ?? 0,
    },
  });

  // Update today's FeedItem status if present
  const date = todayKey();
  const session = await prisma.feedSession.findUnique({
    where: { userId_date: { userId: DEFAULT_USER_ID, date } },
  });
  if (session) {
    const item = await prisma.feedItem.findFirst({
      where: { sessionId: session.id, linkId },
    });
    if (item) {
      const nextStatus =
        action === "completed"
          ? "completed"
          : action === "loved"
          ? "loved"
          : action === "dismissed" || action === "not_for_me"
          ? "skipped"
          : "opened";
      await prisma.feedItem.update({
        where: { id: item.id },
        data: { status: nextStatus },
      });
    }
    if (action === "completed" && body?.msWatched) {
      await prisma.feedSession.update({
        where: { id: session.id },
        data: { minutesWatched: { increment: Math.round(body.msWatched / 60000) } },
      });
    }
  }

  let streak: { current: number; longest: number; graceUsed: boolean } | null = null;
  if (action === "completed") {
    streak = await bumpStreak();
  }
  return NextResponse.json({ ok: true, streak });
}

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
