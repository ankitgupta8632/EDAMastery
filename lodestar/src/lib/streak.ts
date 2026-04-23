import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";

function dateKey(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

export async function bumpStreak(userId: string = DEFAULT_USER_ID): Promise<{
  current: number;
  longest: number;
  graceUsed: boolean;
}> {
  const today = dateKey();
  const current = await prisma.streak.upsert({
    where: { userId },
    create: { userId, current: 1, longest: 1, lastActiveDate: today, graceUsed: false },
    update: {},
  });

  if (current.lastActiveDate === today) {
    return { current: current.current, longest: current.longest, graceUsed: current.graceUsed };
  }

  const gap = current.lastActiveDate ? daysBetween(current.lastActiveDate, today) : 1;

  let nextCurrent = current.current;
  let nextGraceUsed = current.graceUsed;

  if (gap === 1) {
    nextCurrent += 1;
    // 2 consecutive active days resets grace pool
    if (nextGraceUsed && gap === 1) nextGraceUsed = false;
  } else if (gap === 2 && !current.graceUsed) {
    nextCurrent += 1;
    nextGraceUsed = true;
  } else {
    nextCurrent = 1;
    nextGraceUsed = false;
  }

  const nextLongest = Math.max(current.longest, nextCurrent);
  const updated = await prisma.streak.update({
    where: { userId },
    data: {
      current: nextCurrent,
      longest: nextLongest,
      lastActiveDate: today,
      graceUsed: nextGraceUsed,
    },
  });

  return { current: updated.current, longest: updated.longest, graceUsed: updated.graceUsed };
}

export async function readStreak(userId: string = DEFAULT_USER_ID): Promise<{
  current: number;
  longest: number;
  lastActiveDate: string | null;
}> {
  const s = await prisma.streak.findUnique({ where: { userId } });
  return {
    current: s?.current ?? 0,
    longest: s?.longest ?? 0,
    lastActiveDate: s?.lastActiveDate ?? null,
  };
}
