import { claudeJson, hasAnthropic } from "./anthropic";

export interface ExtractedMeta {
  title: string;
  summary: string;
  takeaways: string[];
  topics: { name: string; confidence: number }[];
  vibe: "deep" | "light";
  difficulty: "intro" | "intermediate" | "advanced";
  estMinutes: number;
  language: string;
}

const SYSTEM = `You are a curation analyst for a personal learning app. Given content from a YouTube/Instagram/web link, return a compact JSON describing it. Output ONLY JSON, no prose, no markdown fences.

Schema:
{
  "title": "concise title",
  "summary": "1-2 sentences, neutral tone, specific not generic",
  "takeaways": ["bullet 1", "bullet 2", "bullet 3"],
  "topics": [{"name": "Topic Name", "confidence": 0.0-1.0}],
  "vibe": "deep" | "light",
  "difficulty": "intro" | "intermediate" | "advanced",
  "estMinutes": integer,
  "language": "en"
}

Rules:
- 2-6 topics, Title Case, prefer established names ("Machine Learning" not "ML stuff").
- vibe="deep" if it teaches/builds a skill; "light" if it's entertainment, news, or a short tip.
- Be honest about difficulty. Intro = no prereqs. Intermediate = one domain fluency. Advanced = expert-level.`;

export async function extractMeta(input: {
  url: string;
  source: string;
  rawTitle?: string | null;
  rawDescription?: string | null;
  transcript?: string | null;
  articleText?: string | null;
  durationSec?: number | null;
}): Promise<ExtractedMeta> {
  if (!hasAnthropic()) {
    return fallback(input);
  }

  const body = [
    `URL: ${input.url}`,
    `Source: ${input.source}`,
    input.rawTitle ? `Title: ${input.rawTitle}` : "",
    input.rawDescription ? `Description: ${input.rawDescription.slice(0, 800)}` : "",
    input.durationSec ? `Duration: ${Math.round(input.durationSec / 60)} min` : "",
    input.transcript
      ? `Transcript (first 6k chars):\n${input.transcript.slice(0, 6000)}`
      : input.articleText
      ? `Article (first 6k chars):\n${input.articleText.slice(0, 6000)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    return await claudeJson<ExtractedMeta>({
      system: SYSTEM,
      user: body,
      maxTokens: 900,
    });
  } catch (err) {
    console.error("extractMeta: Claude failed, falling back", err);
    return fallback(input);
  }
}

function fallback(input: {
  url: string;
  rawTitle?: string | null;
  rawDescription?: string | null;
  durationSec?: number | null;
}): ExtractedMeta {
  const title = input.rawTitle ?? new URL(input.url).hostname;
  return {
    title,
    summary: input.rawDescription?.slice(0, 200) ?? "",
    takeaways: [],
    topics: [{ name: "Uncategorised", confidence: 0.1 }],
    vibe: "light",
    difficulty: "intro",
    estMinutes: input.durationSec ? Math.max(1, Math.round(input.durationSec / 60)) : 5,
    language: "en",
  };
}
