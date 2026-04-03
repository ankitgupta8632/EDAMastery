import { NextRequest, NextResponse } from "next/server";
import { listNotebooks, addNotebook } from "@/lib/notebooklm";

export async function GET() {
  try {
    const notebooks = await listNotebooks();
    return NextResponse.json({ notebooks });
  } catch (error) {
    console.error("GET /api/notebooklm/notebooks error:", error);
    return NextResponse.json(
      { error: "Failed to list notebooks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, name, description, topics } = body as {
      url: string;
      name: string;
      description: string;
      topics: string;
    };

    if (!url || !name) {
      return NextResponse.json(
        { error: "url and name are required" },
        { status: 400 }
      );
    }

    const result = await addNotebook(
      url,
      name,
      description ?? "",
      topics ?? ""
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error("POST /api/notebooklm/notebooks error:", error);
    return NextResponse.json(
      { error: "Failed to register notebook" },
      { status: 500 }
    );
  }
}
