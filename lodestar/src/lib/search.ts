import { prisma } from "@/lib/db";
import { embed, hasOpenAI } from "@/lib/ai/openai";
import { blobToFloats, cosineSim } from "@/lib/vector";
import { DEFAULT_USER_ID } from "@/lib/constants";

export interface SearchHit {
  linkId: string;
  score: number;
}

export async function semanticSearch(
  query: string,
  userId: string = DEFAULT_USER_ID,
  limit = 20
): Promise<SearchHit[]> {
  if (!hasOpenAI() || !query.trim()) {
    // Fallback: naive substring match over titles/summaries
    const links = await prisma.link.findMany({
      where: {
        userId,
        status: "ready",
        OR: [
          { title: { contains: query } },
          { summary: { contains: query } },
          { description: { contains: query } },
        ],
      },
      take: limit,
    });
    return links.map((l) => ({ linkId: l.id, score: 0.5 }));
  }

  const qVec = await embed(query);
  const qF = new Float32Array(qVec);

  const rows = await prisma.embedding.findMany({
    where: { link: { userId, status: "ready" } },
    select: { linkId: true, vector: true },
  });

  const scored = rows.map((r) => ({
    linkId: r.linkId,
    score: cosineSim(qF, blobToFloats(r.vector)),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
