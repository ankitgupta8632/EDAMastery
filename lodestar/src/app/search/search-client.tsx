"use client";

import { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { formatDuration, hostnameFromUrl } from "@/lib/utils";

interface Hit {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  thumbnail: string | null;
  durationSec: number | null;
  source: string;
  score: number;
  topics: { topic: { name: string } }[];
}

export function SearchClient(): React.ReactElement {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) {
      setHits([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("search failed");
        const data = (await res.json()) as { links: Hit[] };
        setHits(data.links);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q]);

  return (
    <main className="px-5 pt-6 safe-top">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.14em] text-white/45">Search</div>
        <h1 className="text-2xl font-semibold tracking-tight">Find anything you saved</h1>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 focus-within:border-white/[0.18]">
        <SearchIcon className="h-4 w-4 text-white/50" />
        <input
          ref={ref}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try: dopamine loops, Indian economy, how to negotiate, Rust async"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
      </div>

      <p className="mt-2 text-xs text-white/40">
        Semantic search — it understands meaning, not just keywords.
      </p>

      <div className="mt-5 space-y-3">
        {hits.map((h) => (
          <a
            key={h.id}
            href={h.url}
            target="_blank"
            rel="noreferrer"
            className="card flex gap-3 overflow-hidden p-3 transition-colors hover:bg-white/[0.03]"
          >
            <div
              className="h-16 w-24 shrink-0 rounded-lg bg-white/[0.04] bg-cover bg-center"
              style={{ backgroundImage: h.thumbnail ? `url(${h.thumbnail})` : undefined }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{h.title ?? h.url}</div>
              {h.summary && (
                <div className="mt-0.5 line-clamp-2 text-xs text-white/60">{h.summary}</div>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/45">
                <span>{hostnameFromUrl(h.url)}</span>
                {h.durationSec ? <span>· {formatDuration(h.durationSec)}</span> : null}
                {h.topics.slice(0, 2).map((t, i) => (
                  <span key={i}>· {t.topic.name}</span>
                ))}
                <span className="ml-auto rounded-full bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/40">
                  {Math.round(h.score * 100)}%
                </span>
              </div>
            </div>
          </a>
        ))}
        {!loading && q && hits.length === 0 && (
          <p className="pt-6 text-center text-sm text-white/45">Nothing saved matches that — yet.</p>
        )}
      </div>
    </main>
  );
}
