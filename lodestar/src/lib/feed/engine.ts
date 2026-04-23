import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID, FEED_DEFAULT_MINUTES, FEED_INTERLEAVE_PATTERN } from "@/lib/constants";

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface CandidateLink {
  id: string;
  vibe: string | null;
  durationSec: number | null;
  topics: { topicId: string }[];
  addedAt: Date;
  interactions: { action: string }[];
}

interface FeedPlanInput {
  userId: string;
  minutesTarget: number;
}

interface FeedPlanItem {
  linkId: string;
  slot: "deep" | "light" | "serendipity";
}

export async function buildOrGetTodaySession(
  userId: string = DEFAULT_USER_ID,
  minutesTarget: number = FEED_DEFAULT_MINUTES
): Promise<{ sessionId: string; date: string }> {
  const date = todayKey();
  const existing = await prisma.feedSession.findUnique({
    where: { userId_date: { userId, date } },
    include: { items: true },
  });
  if (existing && existing.items.length > 0) return { sessionId: existing.id, date };

  const plan = await planFeed({ userId, minutesTarget });

  const session = existing
    ? existing
    : await prisma.feedSession.create({
        data: { userId, date, minutesTarget },
      });

  if (plan.length > 0) {
    await prisma.feedItem.createMany({
      data: plan.map((p, i) => ({
        sessionId: session.id,
        linkId: p.linkId,
        position: i,
        slot: p.slot,
      })),
    });
  }

  return { sessionId: session.id, date };
}

export async function refreshTodaySession(
  userId: string = DEFAULT_USER_ID,
  minutesTarget: number = FEED_DEFAULT_MINUTES
): Promise<{ sessionId: string; date: string }> {
  const date = todayKey();
  const existing = await prisma.feedSession.findUnique({
    where: { userId_date: { userId, date } },
  });
  if (existing) {
    await prisma.feedItem.deleteMany({ where: { sessionId: existing.id } });
    await prisma.feedSession.update({
      where: { id: existing.id },
      data: { minutesTarget },
    });
  }
  return buildOrGetTodaySession(userId, minutesTarget);
}

async function planFeed({ userId, minutesTarget }: FeedPlanInput): Promise<FeedPlanItem[]> {
  const goals = await prisma.goal.findMany({
    where: { userId, archivedAt: null },
  });
  const goalWeights = new Map<string, number>();
  for (const g of goals) {
    goalWeights.set(g.name.toLowerCase(), g.priority);
  }

  const links: CandidateLink[] = await prisma.link.findMany({
    where: { userId, status: "ready" },
    select: {
      id: true,
      vibe: true,
      durationSec: true,
      addedAt: true,
      topics: { select: { topicId: true } },
      interactions: { select: { action: true } },
    },
    orderBy: { addedAt: "desc" },
  });

  if (links.length === 0) return [];

  const topicNames = await prisma.topic.findMany({
    where: { id: { in: Array.from(new Set(links.flatMap((l) => l.topics.map((t) => t.topicId)))) } },
    select: { id: true, name: true },
  });
  const topicMap = new Map(topicNames.map((t) => [t.id, t.name.toLowerCase()]));

  const scored = links.map((l) => {
    const completed = l.interactions.some((i) => i.action === "completed");
    const dismissed = l.interactions.some((i) => i.action === "dismissed" || i.action === "not_for_me");
    const loved = l.interactions.some((i) => i.action === "loved");

    // base freshness
    const ageDays = (Date.now() - l.addedAt.getTime()) / (1000 * 60 * 60 * 24);
    let score = Math.max(0, 5 - ageDays * 0.2);

    // goal match
    for (const t of l.topics) {
      const name = topicMap.get(t.topicId) ?? "";
      for (const [goalName, prio] of goalWeights.entries()) {
        if (name.includes(goalName) || goalName.includes(name)) {
          score += prio * 2;
        }
      }
    }

    if (loved) score += 3;
    if (completed) score -= 10; // don't re-serve finished items
    if (dismissed) score -= 20;

    return { link: l, score };
  });

  const ranked = scored.filter((s) => s.score > -5).sort((a, b) => b.score - a.score);

  // Separate by vibe
  const deep = ranked.filter((s) => s.link.vibe !== "light");
  const light = ranked.filter((s) => s.link.vibe === "light");

  const plan: FeedPlanItem[] = [];
  let minutes = 0;
  const taken = new Set<string>();
  const pool = {
    deep: [...deep],
    light: [...light],
    serendipity: [...ranked].sort(() => Math.random() - 0.5),
  };

  let patternIdx = 0;
  while (minutes < minutesTarget && plan.length < 30) {
    const slot = FEED_INTERLEAVE_PATTERN[patternIdx % FEED_INTERLEAVE_PATTERN.length];
    patternIdx++;

    const bucket = pool[slot];
    const pick = bucket.find((s) => !taken.has(s.link.id));
    if (!pick) {
      // fallback: grab any unpicked
      const fallback = ranked.find((s) => !taken.has(s.link.id));
      if (!fallback) break;
      taken.add(fallback.link.id);
      plan.push({ linkId: fallback.link.id, slot });
      minutes += estMinutes(fallback.link);
      continue;
    }
    taken.add(pick.link.id);
    plan.push({ linkId: pick.link.id, slot });
    minutes += estMinutes(pick.link);
  }
  return plan;
}

function estMinutes(l: CandidateLink): number {
  if (l.durationSec && l.durationSec > 0) return Math.max(1, Math.round(l.durationSec / 60));
  return l.vibe === "light" ? 2 : 10;
}
