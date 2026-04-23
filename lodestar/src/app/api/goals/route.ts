import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { ensureUser } from "@/lib/pipeline";

export async function GET(): Promise<NextResponse> {
  await ensureUser();
  const goals = await prisma.goal.findMany({
    where: { userId: DEFAULT_USER_ID, archivedAt: null },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  await ensureUser();
  const body = (await req.json().catch(() => null)) as {
    name?: string;
    category?: string;
    priority?: number;
    notes?: string;
  } | null;
  if (!body?.name || !body.category) {
    return NextResponse.json({ error: "name + category required" }, { status: 400 });
  }
  const goal = await prisma.goal.create({
    data: {
      userId: DEFAULT_USER_ID,
      name: body.name,
      category: body.category,
      priority: Math.min(Math.max(body.priority ?? 3, 1), 5),
      notes: body.notes ?? "",
    },
  });
  return NextResponse.json({ goal });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.goal.update({
    where: { id },
    data: { archivedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
