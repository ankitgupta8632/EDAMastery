import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { ensureUser } from "@/lib/pipeline";

export async function GET(): Promise<NextResponse> {
  await ensureUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: DEFAULT_USER_ID },
  });
  return NextResponse.json({
    profile: profile ?? null,
    lifeContext: profile ? safeParse(profile.lifeContext) : {},
  });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  await ensureUser();
  const body = (await req.json().catch(() => null)) as {
    lifeContext?: Record<string, unknown>;
  } | null;
  const lifeContext = body?.lifeContext ?? {};
  const profile = await prisma.profile.upsert({
    where: { userId: DEFAULT_USER_ID },
    create: { userId: DEFAULT_USER_ID, lifeContext: JSON.stringify(lifeContext) },
    update: { lifeContext: JSON.stringify(lifeContext) },
  });
  return NextResponse.json({ profile, lifeContext });
}

function safeParse(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
