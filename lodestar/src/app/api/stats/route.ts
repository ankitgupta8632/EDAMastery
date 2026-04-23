import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function GET(): Promise<NextResponse> {
  const [linkCount, readyCount, clusterCount, topicCount, interactions, recentSessions] =
    await Promise.all([
      prisma.link.count({ where: { userId: DEFAULT_USER_ID } }),
      prisma.link.count({ where: { userId: DEFAULT_USER_ID, status: "ready" } }),
      prisma.cluster.count({ where: { userId: DEFAULT_USER_ID } }),
      prisma.topic.count(),
      prisma.interaction.findMany({
        where: { userId: DEFAULT_USER_ID },
        orderBy: { at: "desc" },
        take: 200,
      }),
      prisma.feedSession.findMany({
        where: { userId: DEFAULT_USER_ID },
        orderBy: { date: "desc" },
        take: 30,
      }),
    ]);

  const completed = interactions.filter((i) => i.action === "completed").length;
  const loved = interactions.filter((i) => i.action === "loved").length;
  const msTotal = interactions.reduce((s, i) => s + (i.msWatched ?? 0), 0);

  const topTopicsRaw = await prisma.linkTopic.groupBy({
    by: ["topicId"],
    _count: { topicId: true },
    orderBy: { _count: { topicId: "desc" } },
    take: 8,
  });
  const topics = await prisma.topic.findMany({
    where: { id: { in: topTopicsRaw.map((t) => t.topicId) } },
  });
  const topicMap = new Map(topics.map((t) => [t.id, t.name]));
  const topTopics = topTopicsRaw.map((t) => ({
    name: topicMap.get(t.topicId) ?? "Unknown",
    count: t._count.topicId,
  }));

  return NextResponse.json({
    linkCount,
    readyCount,
    clusterCount,
    topicCount,
    completedCount: completed,
    lovedCount: loved,
    minutesWatched: Math.round(msTotal / 60000),
    sessions: recentSessions,
    topTopics,
  });
}
