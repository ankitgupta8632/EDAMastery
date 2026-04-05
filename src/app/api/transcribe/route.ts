import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Voice input is not configured. Set OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("POST /api/transcribe error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
