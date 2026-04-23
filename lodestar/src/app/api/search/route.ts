import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { semanticSearch } from "@/lib/search";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const q = (searchParams.get("q") ?? "").trim();
  if (!q) return NextResponse.json({ hits: [], links: [] });

  const hits = await semanticSearch(q, DEFAULT_USER_ID, 30);
  const ids = hits.map((h) => h.linkId);
  const links = await prisma.link.findMany({
    where: { id: { in: ids } },
    include: { topics: { include: { topic: true } } },
  });
  const linkMap = new Map(links.map((l) => [l.id, l]));
  const sorted = hits
    .map((h) => {
      const l = linkMap.get(h.linkId);
      if (!l) return null;
      return { ...l, score: h.score };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  return NextResponse.json({ links: sorted });
}
