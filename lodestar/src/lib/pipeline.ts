import { prisma } from "@/lib/db";
import { ingestUrl } from "@/lib/ingest";
import { extractMeta } from "@/lib/ai/extract";
import { embed, hasOpenAI } from "@/lib/ai/openai";
import { floatsToBlob } from "@/lib/vector";
import { attachToCluster } from "@/lib/ai/cluster";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function ensureUser(userId: string = DEFAULT_USER_ID): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, name: "You" },
    update: {},
  });
  await prisma.streak.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function createLinkFromUrl(url: string, userId: string = DEFAULT_USER_ID): Promise<string> {
  await ensureUser(userId);
  const cleanUrl = url.trim();
  const existing = await prisma.link.findUnique({
    where: { userId_url: { userId, url: cleanUrl } },
  });
  if (existing) return existing.id;

  const link = await prisma.link.create({
    data: {
      userId,
      url: cleanUrl,
      source: "web",
      status: "pending",
    },
  });
  return link.id;
}

export async function processLink(linkId: string): Promise<void> {
  const link = await prisma.link.findUnique({ where: { id: linkId } });
  if (!link) throw new Error("link not found");

  await prisma.link.update({ where: { id: linkId }, data: { status: "processing" } });

  try {
    const ingest = await ingestUrl(link.url);

    const meta = await extractMeta({
      url: link.url,
      source: ingest.source,
      rawTitle: ingest.title,
      rawDescription: ingest.description,
      transcript: ingest.transcript,
      articleText: ingest.articleText,
      durationSec: ingest.durationSec,
    });

    // Upsert topics
    const topicRows = await Promise.all(
      meta.topics.map(async (t) => {
        const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return prisma.topic.upsert({
          where: { slug },
          create: { slug, name: t.name },
          update: { name: t.name },
        });
      })
    );

    await prisma.link.update({
      where: { id: linkId },
      data: {
        source: ingest.source,
        title: meta.title || ingest.title || link.url,
        author: ingest.author,
        description: ingest.description,
        thumbnail: ingest.thumbnail,
        durationSec: ingest.durationSec ?? meta.estMinutes * 60,
        canonicalUrl: ingest.canonicalUrl ?? link.url,
        transcript: ingest.transcript,
        rawText: ingest.articleText,
        language: meta.language,
        vibe: meta.vibe,
        difficulty: meta.difficulty,
        summary: meta.summary,
        takeaways: JSON.stringify(meta.takeaways),
        processedAt: new Date(),
        status: "ready",
      },
    });

    // Wipe + rewrite LinkTopic
    await prisma.linkTopic.deleteMany({ where: { linkId } });
    await prisma.linkTopic.createMany({
      data: topicRows.map((t, i) => ({
        linkId,
        topicId: t.id,
        confidence: meta.topics[i]?.confidence ?? 0.5,
      })),
    });

    // Embedding
    if (hasOpenAI()) {
      const textForEmbed = [
        meta.title,
        meta.summary,
        meta.takeaways.join(" "),
        meta.topics.map((t) => t.name).join(", "),
        (ingest.transcript ?? ingest.articleText ?? "").slice(0, 4000),
      ]
        .filter(Boolean)
        .join("\n");
      try {
        const vec = await embed(textForEmbed);
        const blob = floatsToBlob(vec);
        await prisma.embedding.upsert({
          where: { linkId },
          create: { linkId, model: "text-embedding-3-small", dims: vec.length, vector: blob },
          update: { model: "text-embedding-3-small", dims: vec.length, vector: blob },
        });
        await attachToCluster(link.userId, linkId, new Float32Array(vec));
      } catch (err) {
        console.error("embed/cluster failed", err);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("processLink failed", msg);
    await prisma.link.update({
      where: { id: linkId },
      data: { status: "failed", failReason: msg },
    });
    throw err;
  }
}
