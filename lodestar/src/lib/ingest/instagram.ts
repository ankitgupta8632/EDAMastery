/**
 * Instagram adapter — Manus-backed.
 *
 * Instagram blocks unauthenticated scraping. The user directed us to use Manus
 * (a browser-agent service) with Manus credentials (NOT the user's personal IG).
 * Until MANUS_API_BASE + MANUS_API_KEY are wired, this adapter:
 *   1. Returns best-effort oEmbed/OG fallback.
 *   2. Flags the link so the feed engine shows a "thumbnail only" state.
 *
 * When you wire Manus, fill `callManus()` below.
 */

export interface InstagramMeta {
  title: string | null;
  author: string | null;
  description: string | null;
  thumbnail: string | null;
  transcript: string | null; // caption/transcript if Manus yields
  canonicalUrl: string | null;
  manusStatus: "ok" | "unavailable" | "pending";
}

export async function ingestInstagram(url: string): Promise<InstagramMeta> {
  const base = process.env.MANUS_API_BASE;
  const key = process.env.MANUS_API_KEY;

  if (base && key) {
    const manus = await callManus(url, base, key);
    if (manus) return manus;
  }

  // Fallback: best-effort Open Graph via direct fetch (often blocked, but try).
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    });
    if (res.ok) {
      const html = await res.text();
      const m = (re: RegExp): string | null => {
        const match = html.match(re);
        return match ? match[1] : null;
      };
      return {
        title: m(/<meta property="og:title" content="([^"]+)"/),
        author: m(/<meta property="og:title" content="([^"]+)"/),
        description: m(/<meta property="og:description" content="([^"]+)"/),
        thumbnail: m(/<meta property="og:image" content="([^"]+)"/),
        transcript: null,
        canonicalUrl: url,
        manusStatus: "unavailable",
      };
    }
  } catch {
    // swallow
  }

  return {
    title: "Instagram post",
    author: null,
    description: null,
    thumbnail: null,
    transcript: null,
    canonicalUrl: url,
    manusStatus: "unavailable",
  };
}

async function callManus(
  url: string,
  base: string,
  key: string
): Promise<InstagramMeta | null> {
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/extract`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ url, mode: "social" }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      title?: string;
      author?: string;
      caption?: string;
      transcript?: string;
      thumbnailUrl?: string;
    };
    return {
      title: j.title ?? null,
      author: j.author ?? null,
      description: j.caption ?? null,
      thumbnail: j.thumbnailUrl ?? null,
      transcript: j.transcript ?? j.caption ?? null,
      canonicalUrl: url,
      manusStatus: "ok",
    };
  } catch (err) {
    console.error("Manus call failed", err);
    return null;
  }
}
