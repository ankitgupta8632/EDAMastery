"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Clipboard, Loader2, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { detectSource, hostnameFromUrl } from "@/lib/utils";

interface Staged {
  id?: string;
  url: string;
  source: string;
  status: "queued" | "processing" | "ready" | "failed";
  title?: string;
  thumbnail?: string;
  error?: string;
}

export function AddClient(): React.ReactElement {
  const [value, setValue] = useState("");
  const [staged, setStaged] = useState<Staged[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  async function pasteFromClipboard(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      setValue(text);
      areaRef.current?.focus();
    } catch {
      toast.error("Clipboard access denied");
    }
  }

  async function submit(): Promise<void> {
    const urls = extractUrls(value);
    if (urls.length === 0) {
      toast.error("Paste one or more URLs");
      return;
    }
    setSubmitting(true);
    const nextStaged: Staged[] = urls.map((u) => ({
      url: u,
      source: detectSource(u),
      status: "queued",
    }));
    setStaged((prev) => [...nextStaged, ...prev]);

    await Promise.all(
      nextStaged.map(async (s, idx) => {
        try {
          const res = await fetch("/api/links", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: s.url }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as { id: string };
          setStaged((prev) => {
            const copy = [...prev];
            const i = prev.findIndex((x) => x.url === s.url && !x.id);
            if (i >= 0) copy[i] = { ...copy[i], id: data.id, status: "processing" };
            return copy;
          });
          void pollStatus(data.id, s.url);
        } catch (err) {
          console.error(err);
          setStaged((prev) => {
            const copy = [...prev];
            const i = prev.findIndex((x) => x.url === s.url && !x.id);
            if (i >= 0) copy[i] = { ...copy[i], status: "failed", error: (err as Error).message };
            return copy;
          });
        }
        void idx;
      })
    );
    setValue("");
    setSubmitting(false);
  }

  async function pollStatus(id: string, originalUrl: string): Promise<void> {
    for (let i = 0; i < 40; i++) {
      await sleep(1500);
      try {
        const res = await fetch(`/api/links/${id}`);
        if (!res.ok) continue;
        const data = (await res.json()) as {
          link: {
            status: string;
            title: string | null;
            thumbnail: string | null;
            failReason: string | null;
          };
        };
        const l = data.link;
        setStaged((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  title: l.title ?? s.title,
                  thumbnail: l.thumbnail ?? s.thumbnail,
                  status:
                    l.status === "ready"
                      ? "ready"
                      : l.status === "failed"
                      ? "failed"
                      : "processing",
                  error: l.failReason ?? undefined,
                }
              : s
          )
        );
        if (l.status === "ready" || l.status === "failed") break;
      } catch {
        // ignore transient
      }
    }
    void originalUrl;
  }

  return (
    <main className="px-5 pt-6 safe-top">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-white/45">Add</div>
          <h1 className="text-2xl font-semibold tracking-tight">Paste anything</h1>
        </div>
        <button
          type="button"
          onClick={pasteFromClipboard}
          className="btn btn-ghost h-10 px-3 text-sm"
        >
          <Clipboard className="h-4 w-4" /> Paste
        </button>
      </div>

      <p className="mb-4 text-sm text-white/55">
        YouTube, Instagram, articles, newsletters. One per line or separated by spaces.
      </p>

      <textarea
        ref={areaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=…&#10;https://www.instagram.com/p/…&#10;https://newyorker.com/…"
        className="h-40 w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm outline-none focus:border-white/[0.18] focus:ring-2 focus:ring-white/[0.08]"
      />

      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={submit}
          className="btn btn-accent h-11 px-5 text-sm"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & curate"}
        </button>
      </div>

      {staged.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Just saved</div>
          <ul className="space-y-2">
            {staged.map((s, i) => (
              <li key={`${s.url}-${i}`} className="card flex items-center gap-3 p-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/[0.04]">
                  {s.thumbnail && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={s.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.title ?? s.url}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/45">
                    <span className="capitalize">{s.source}</span>
                    <span>·</span>
                    <span>{hostnameFromUrl(s.url)}</span>
                    {s.error && <span className="text-[#F87171]">· {s.error}</span>}
                  </div>
                </div>
                <StatusPill status={s.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 text-center">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-white/55">
          Back to feed <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </main>
  );
}

function StatusPill({ status }: { status: Staged["status"] }): React.ReactElement {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/12 px-2 py-0.5 text-[11px] text-emerald-300">
        <Check className="h-3 w-3" /> Ready
      </span>
    );
  }
  if (status === "failed") {
    return <span className="rounded-full bg-red-400/12 px-2 py-0.5 text-[11px] text-red-300">Failed</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-white/65">
      <Loader2 className="h-3 w-3 animate-spin" />
      {status === "processing" ? "Analysing" : "Queued"}
    </span>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function extractUrls(text: string): string[] {
  const urlLike = text
    .split(/[\s,]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
  const urls: string[] = [];
  for (const t of urlLike) {
    const candidate = t.startsWith("http") ? t : `https://${t}`;
    try {
      const u = new URL(candidate);
      if (u.hostname.includes(".")) urls.push(u.toString());
    } catch {
      // skip
    }
  }
  return urls;
}
