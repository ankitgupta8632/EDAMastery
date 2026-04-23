import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";

export async function GET(): Promise<NextResponse> {
  const clusters = await prisma.cluster.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: {
      links: {
        include: {
          link: { select: { id: true, title: true, thumbnail: true, vibe: true, durationSec: true, url: true, source: true } },
        },
      },
      deepDive: { select: { generatedAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ clusters });
}
