import { YoutubeTranscript } from "youtube-transcript";

export interface YouTubeMeta {
  title: string | null;
  author: string | null;
  description: string | null;
  thumbnail: string | null;
  durationSec: number | null;
  transcript: string | null;
  videoId: string | null;
  canonicalUrl: string | null;
}

export function parseYoutubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.replace(/^\//, "") || null;
    if (u.hostname.endsWith("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const shortsMatch = u.pathname.match(/^\/shorts\/([\w-]+)/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = u.pathname.match(/^\/embed\/([\w-]+)/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    return null;
  }
  return null;
}

export async function ingestYouTube(url: string): Promise<YouTubeMeta> {
  const videoId = parseYoutubeId(url);
  const canonicalUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;

  const oembed = await fetchOembed(canonicalUrl);
  const transcript = videoId ? await fetchTranscript(videoId) : null;

  return {
    title: oembed?.title ?? null,
    author: oembed?.author_name ?? null,
    description: null,
    thumbnail: oembed?.thumbnail_url ?? (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null),
    durationSec: null, // oEmbed doesn't give duration; transcript length is our proxy later
    transcript,
    videoId,
    canonicalUrl,
  };
}

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

async function fetchOembed(url: string): Promise<OEmbedResponse | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return (await res.json()) as OEmbedResponse;
  } catch {
    return null;
  }
}

async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (!items || items.length === 0) return null;
    return items.map((t) => t.text).join(" ").replace(/\s+/g, " ").trim() || null;
  } catch {
    return null;
  }
}
