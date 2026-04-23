import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "@/lib/constants";

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  client = new Anthropic({ apiKey });
  return client;
}

export function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function claudeJson<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const resp = await anthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 1200,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Claude: no text block");
  const raw = textBlock.text.trim();
  const jsonText = extractJson(raw);
  return JSON.parse(jsonText) as T;
}

export async function claudeText(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const resp = await anthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 2000,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const textBlock = resp.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Claude: no text block");
  return textBlock.text;
}

function extractJson(raw: string): string {
  // Strip markdown fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  return raw;
}
