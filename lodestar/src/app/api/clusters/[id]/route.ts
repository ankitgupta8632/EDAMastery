import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const cluster = await prisma.cluster.findUnique({
    where: { id },
    include: {
      links: {
        include: {
          link: { include: { topics: { include: { topic: true } } } },
        },
        orderBy: { centrality: "desc" },
      },
      deepDive: true,
    },
  });
  if (!cluster) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ cluster });
}
