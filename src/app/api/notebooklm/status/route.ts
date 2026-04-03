import { NextResponse } from "next/server";
import { checkAuthStatus, getQueriesRemaining } from "@/lib/notebooklm";

export async function GET() {
  try {
    const authStatus = await checkAuthStatus();
    const queriesRemaining = getQueriesRemaining();

    return NextResponse.json({
      authenticated: authStatus.authenticated,
      message: authStatus.message,
      queriesRemaining,
    });
  } catch (error) {
    console.error("GET /api/notebooklm/status error:", error);
    return NextResponse.json(
      { error: "Failed to check NotebookLM status" },
      { status: 500 }
    );
  }
}
