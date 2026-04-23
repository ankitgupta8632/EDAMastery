import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { ensureUser } from "@/lib/pipeline";
import { YouClient } from "./you-client";

export const dynamic = "force-dynamic";

export default async function YouPage(): Promise<React.ReactElement> {
  await ensureUser();
  const [profile, goals, stats, streak] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: DEFAULT_USER_ID } }),
    prisma.goal.findMany({
      where: { userId: DEFAULT_USER_ID, archivedAt: null },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    }),
    prisma.link.groupBy({
      by: ["status"],
      where: { userId: DEFAULT_USER_ID },
      _count: { status: true },
    }),
    prisma.streak.findUnique({ where: { userId: DEFAULT_USER_ID } }),
  ]);

  const lifeContext = safeParse(profile?.lifeContext ?? "{}");
  const statusCount = Object.fromEntries(stats.map((s) => [s.status, s._count.status]));

  return (
    <YouClient
      lifeContext={lifeContext as Record<string, string | number>}
      goals={goals.map((g) => ({
        id: g.id,
        name: g.name,
        category: g.category,
        priority: g.priority,
        notes: g.notes,
      }))}
      stats={{
        total: Object.values(statusCount).reduce((a, b) => a + b, 0),
        ready: statusCount["ready"] ?? 0,
        pending: (statusCount["pending"] ?? 0) + (statusCount["processing"] ?? 0),
        failed: statusCount["failed"] ?? 0,
      }}
      streak={{
        current: streak?.current ?? 0,
        longest: streak?.longest ?? 0,
        graceUsed: streak?.graceUsed ?? false,
      }}
    />
  );
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
