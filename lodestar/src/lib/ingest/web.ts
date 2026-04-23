import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface WebMeta {
  title: string | null;
  author: string | null;
  description: string | null;
  thumbnail: string | null;
  articleText: string | null;
  canonicalUrl: string | null;
  siteName: string | null;
}

export async function ingestWeb(url: string): Promise<WebMeta> {
  let html: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    console.error("ingestWeb fetch failed", err);
    return {
      title: null,
      author: null,
      description: null,
      thumbnail: null,
      articleText: null,
      canonicalUrl: null,
      siteName: null,
    };
  }

  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  const og = (prop: string): string | null =>
    doc.querySelector(`meta[property='${prop}']`)?.getAttribute("content") ?? null;
  const name = (n: string): string | null =>
    doc.querySelector(`meta[name='${n}']`)?.getAttribute("content") ?? null;

  const title = og("og:title") ?? doc.querySelector("title")?.textContent ?? null;
  const description = og("og:description") ?? name("description");
  const thumbnail = og("og:image") ?? name("twitter:image");
  const siteName = og("og:site_name");
  const author =
    name("author") ?? doc.querySelector("meta[property='article:author']")?.getAttribute("content") ?? null;
  const canonical =
    doc.querySelector("link[rel='canonical']")?.getAttribute("href") ?? url;

  let articleText: string | null = null;
  try {
    const reader = new Readability(doc);
    const article = reader.parse();
    if (article?.textContent) {
      articleText = article.textContent.replace(/\s+/g, " ").trim();
    }
  } catch {
    // ignore
  }

  return {
    title: title?.trim() || null,
    author,
    description,
    thumbnail,
    articleText,
    canonicalUrl: canonical,
    siteName,
  };
}
