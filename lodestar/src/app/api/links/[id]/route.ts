import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const link = await prisma.link.findUnique({
    where: { id },
    include: {
      topics: { include: { topic: true } },
      clusterLinks: { include: { cluster: true } },
    },
  });
  if (!link) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ link });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await ctx.params;
  await prisma.link.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
