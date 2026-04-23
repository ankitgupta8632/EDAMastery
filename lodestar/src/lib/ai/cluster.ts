import { prisma } from "@/lib/db";
import { blobToFloats, cosineSim } from "@/lib/vector";
import { SIM_THRESHOLD_CLUSTER } from "@/lib/constants";
import { claudeJson, hasAnthropic } from "./anthropic";

export interface ClusterAssignment {
  clusterId: string;
  centrality: number;
  isNew: boolean;
}

export async function attachToCluster(
  userId: string,
  linkId: string,
  newVec: Float32Array
): Promise<ClusterAssignment | null> {
  // Pull all existing clusters' member embeddings for this user.
  const clusters = await prisma.cluster.findMany({
    where: { userId },
    include: { links: { include: { link: { include: { embedding: true } } } } },
  });

  let best: { clusterId: string; score: number } | null = null;
  for (const c of clusters) {
    let sum = 0;
    let count = 0;
    for (const cl of c.links) {
      if (!cl.link.embedding) continue;
      const v = blobToFloats(cl.link.embedding.vector);
      const s = cosineSim(newVec, v);
      sum += s;
      count++;
    }
    const avg = count > 0 ? sum / count : 0;
    if (!best || avg > best.score) best = { clusterId: c.id, score: avg };
  }

  if (best && best.score >= SIM_THRESHOLD_CLUSTER) {
    await prisma.clusterLink.upsert({
      where: { clusterId_linkId: { clusterId: best.clusterId, linkId } },
      create: { clusterId: best.clusterId, linkId, centrality: best.score },
      update: { centrality: best.score },
    });
    return { clusterId: best.clusterId, centrality: best.score, isNew: false };
  }

  // Try to form a new cluster: find other links of same user with high similarity.
  const candidates = await prisma.embedding.findMany({
    where: {
      link: { userId, NOT: { id: linkId } },
    },
    include: { link: true },
  });

  const matches: { linkId: string; score: number }[] = [];
  for (const e of candidates) {
    const v = blobToFloats(e.vector);
    const s = cosineSim(newVec, v);
    if (s >= SIM_THRESHOLD_CLUSTER) matches.push({ linkId: e.linkId, score: s });
  }

  if (matches.length >= 1) {
    const members = [linkId, ...matches.map((m) => m.linkId)];
    const label = await labelCluster(members);
    const cluster = await prisma.cluster.create({
      data: {
        userId,
        label: label.label,
        summary: label.summary,
        topicIds: "[]",
      },
    });
    await prisma.clusterLink.createMany({
      data: members.map((id) => ({
        clusterId: cluster.id,
        linkId: id,
        centrality: id === linkId ? 1 : matches.find((m) => m.linkId === id)?.score ?? 0.5,
      })),
    });
    return { clusterId: cluster.id, centrality: 1, isNew: true };
  }

  return null;
}

async function labelCluster(linkIds: string[]): Promise<{ label: string; summary: string }> {
  const links = await prisma.link.findMany({
    where: { id: { in: linkIds } },
    select: { title: true, summary: true, topics: { include: { topic: true } } },
  });
  const topicNames = Array.from(
    new Set(links.flatMap((l) => l.topics.map((t) => t.topic.name)))
  ).slice(0, 10);
  const titles = links.map((l) => l.title).filter(Boolean) as string[];

  if (!hasAnthropic() || links.length === 0) {
    return { label: topicNames[0] ?? "New cluster", summary: titles.slice(0, 3).join(" • ") };
  }

  try {
    const result = await claudeJson<{ label: string; summary: string }>({
      system:
        "You name a cluster of related saved links. Output ONLY JSON: {\"label\": \"Title Case, 2-5 words\", \"summary\": \"one sentence naming the common thread\"}",
      user: `Topics: ${topicNames.join(", ")}\nTitles:\n- ${titles.join("\n- ")}`,
      maxTokens: 200,
    });
    return result;
  } catch {
    return { label: topicNames[0] ?? "New cluster", summary: titles.slice(0, 3).join(" • ") };
  }
}

export async function rebuildClusterLabels(userId: string): Promise<number> {
  const clusters = await prisma.cluster.findMany({
    where: { userId },
    include: { links: { include: { link: true } } },
  });
  let updated = 0;
  for (const c of clusters) {
    const linkIds = c.links.map((cl) => cl.linkId);
    if (linkIds.length === 0) continue;
    const { label, summary } = await labelCluster(linkIds);
    await prisma.cluster.update({
      where: { id: c.id },
      data: { label, summary },
    });
    updated++;
  }
  return updated;
}
