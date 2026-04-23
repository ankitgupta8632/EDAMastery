import { detectSource } from "@/lib/utils";
import { ingestYouTube } from "./youtube";
import { ingestWeb } from "./web";
import { ingestInstagram } from "./instagram";

export interface IngestResult {
  source: "youtube" | "instagram" | "web";
  title: string | null;
  author: string | null;
  description: string | null;
  thumbnail: string | null;
  durationSec: number | null;
  transcript: string | null;
  articleText: string | null;
  canonicalUrl: string | null;
  note?: string;
}

export async function ingestUrl(url: string): Promise<IngestResult> {
  const source = detectSource(url);
  if (source === "youtube") {
    const y = await ingestYouTube(url);
    return {
      source,
      title: y.title,
      author: y.author,
      description: y.description,
      thumbnail: y.thumbnail,
      durationSec: y.durationSec,
      transcript: y.transcript,
      articleText: null,
      canonicalUrl: y.canonicalUrl,
    };
  }
  if (source === "instagram") {
    const i = await ingestInstagram(url);
    return {
      source,
      title: i.title,
      author: i.author,
      description: i.description,
      thumbnail: i.thumbnail,
      durationSec: null,
      transcript: i.transcript,
      articleText: null,
      canonicalUrl: i.canonicalUrl,
      note: i.manusStatus === "ok" ? undefined : "Manus unavailable; metadata-only",
    };
  }
  const w = await ingestWeb(url);
  return {
    source,
    title: w.title,
    author: w.author,
    description: w.description,
    thumbnail: w.thumbnail,
    durationSec: null,
    transcript: null,
    articleText: w.articleText,
    canonicalUrl: w.canonicalUrl,
  };
}
