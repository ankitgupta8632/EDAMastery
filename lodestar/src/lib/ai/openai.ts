import OpenAI from "openai";
import { EMBEDDING_MODEL } from "@/lib/constants";

let client: OpenAI | null = null;

export function openai(): OpenAI {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  client = new OpenAI({ apiKey });
  return client;
}

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function embed(text: string): Promise<number[]> {
  const trimmed = text.slice(0, 8000);
  const res = await openai().embeddings.create({
    model: EMBEDDING_MODEL,
    input: trimmed,
  });
  return res.data[0].embedding;
}
