import { NextRequest, NextResponse } from "next/server";
import { queryNotebook } from "@/lib/notebooklm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, notebookId, notebookUrl } = body as {
      question: string;
      notebookId?: string;
      notebookUrl?: string;
    };

    if (!question) {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 }
      );
    }

    const answer = await queryNotebook(question, notebookId, notebookUrl);

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("POST /api/notebooklm/query error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to query notebook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
