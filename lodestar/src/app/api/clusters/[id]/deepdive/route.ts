import { NextRequest, NextResponse } from "next/server";
import { generateClusterDeepDive } from "@/lib/ai/deepdive";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await ctx.params;
  try {
    const md = await generateClusterDeepDive(id);
    return NextResponse.json({ bodyMarkdown: md });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
