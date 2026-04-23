import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createLinkFromUrl, processLink } from "@/lib/pipeline";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json().catch(() => null)) as { url?: string } | null;
  const url = body?.url?.trim();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }

  const linkId = await createLinkFromUrl(url);

  // Fire-and-forget processing so the client can return immediately.
  void processLink(linkId).catch((err) => console.error("bg processLink", err));

  return NextResponse.json({ id: linkId, status: "processing" });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
  const status = searchParams.get("status");
  const topic = searchParams.get("topic");

  const where: {
    userId: string;
    status?: string;
    topics?: { some: { topic: { slug: string } } };
  } = { userId: DEFAULT_USER_ID };
  if (status) where.status = status;
  if (topic) where.topics = { some: { topic: { slug: topic } } };

  const links = await prisma.link.findMany({
    where,
    include: { topics: { include: { topic: true } } },
    orderBy: { addedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ links });
}
