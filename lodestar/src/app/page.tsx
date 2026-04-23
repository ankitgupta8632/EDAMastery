import Link from "next/link";
import { buildOrGetTodaySession } from "@/lib/feed/engine";
import { prisma } from "@/lib/db";
import { readStreak } from "@/lib/streak";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { FeedClient } from "./feed-client";

export const dynamic = "force-dynamic";

export default async function FeedPage(): Promise<React.ReactElement> {
  const readyCount = await prisma.link.count({
    where: { userId: DEFAULT_USER_ID, status: "ready" },
  });

  if (readyCount === 0) {
    return <EmptyFeed />;
  }

  const { sessionId } = await buildOrGetTodaySession(DEFAULT_USER_ID, 60);
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
  const profile = await prisma.profile.findUnique({ where: { userId: DEFAULT_USER_ID } });
  const goals = await prisma.goal.findMany({
    where: { userId: DEFAULT_USER_ID, archivedAt: null },
    orderBy: { priority: "desc" },
    take: 3,
  });

  return (
    <FeedClient
      session={session}
      streak={streak}
      hasProfile={Boolean(profile)}
      topGoals={goals.map((g) => ({ id: g.id, name: g.name, category: g.category, priority: g.priority }))}
    />
  );
}

function EmptyFeed(): React.ReactElement {
  return (
    <main className="aurora min-h-[80vh] px-5 pt-12 safe-top">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-[#F5B754] to-[#FF7A7A]" />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Your time, curated.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-white/70">
          Paste a YouTube, Instagram, or web link. Lodestar tags it, clusters it with related things
          you&rsquo;ve saved, and builds a bounded daily feed that moves you toward the goals you chose.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/add" className="btn btn-accent h-12 px-6">
            Paste your first link
          </Link>
          <Link href="/you" className="text-sm text-white/50 hover:text-white/80">
            Or set up your goals first →
          </Link>
        </div>
        <div className="mx-auto mt-14 grid max-w-lg gap-3 text-left text-sm text-white/55">
          <Row>1. Paste links all day. Lodestar extracts topics &amp; summaries.</Row>
          <Row>2. It clusters things you already know &amp; things you meant to learn.</Row>
          <Row>3. It serves a daily feed — deep + light, mixed like a great playlist.</Row>
          <Row>4. Open the cluster deep-dives when you want the full story.</Row>
        </div>
      </div>
    </main>
  );
}

function Row({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      {children}
    </div>
  );
}
