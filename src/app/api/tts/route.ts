import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "TTS is not configured. Set OPENAI_API_KEY." },
        { status: 503 }
      );
    }

    const { text, voice } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    // Trim to 4096 chars (OpenAI TTS limit)
    const trimmedText = text.slice(0, 4096);

    const openai = new OpenAI({ apiKey });
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice ?? "nova", // nova sounds like a friendly host
      input: trimmedText,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("POST /api/tts error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
