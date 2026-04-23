"use client";

import { motion } from "framer-motion";
import { Heart, Check, X, ExternalLink, Youtube, Instagram, Globe } from "lucide-react";
import { useState } from "react";
import { cn, formatDuration, hostnameFromUrl } from "@/lib/utils";
import { toast } from "sonner";

export interface FeedCardLink {
  id: string;
  url: string;
  source: string;
  title: string | null;
  author: string | null;
  summary: string | null;
  thumbnail: string | null;
  durationSec: number | null;
  vibe: string | null;
  difficulty: string | null;
  takeaways?: string | null;
  topics: { topic: { id: string; name: string; slug: string } }[];
  interactions?: { action: string }[];
}

export interface FeedCardProps {
  item: { linkId: string; slot: string; status: string; position: number };
  link: FeedCardLink;
  onInteract?: (action: string) => void;
}

function SourceIcon({ source }: { source: string }): React.ReactElement {
  if (source === "youtube") return <Youtube className="h-3.5 w-3.5" />;
  if (source === "instagram") return <Instagram className="h-3.5 w-3.5" />;
  return <Globe className="h-3.5 w-3.5" />;
}

export function FeedCard({ item, link, onInteract }: FeedCardProps): React.ReactElement {
  const [busy, setBusy] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loved, setLoved] = useState(Boolean(link.interactions?.some((i) => i.action === "loved")));
  const [completed, setCompleted] = useState(
    Boolean(link.interactions?.some((i) => i.action === "completed"))
  );
  const takeaways: string[] = safeParse(link.takeaways) as string[];

  async function react(action: string): Promise<void> {
    setBusy(action);
    try {
      const res = await fetch(`/api/feed/${link.id}/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as {
        streak?: { current: number; graceUsed: boolean } | null;
      };
      if (action === "completed") {
        setCompleted(true);
        toast.success(
          data.streak
            ? `Nice. Streak: ${data.streak.current}${data.streak.graceUsed ? " (grace)" : ""}`
            : "Marked complete"
        );
      } else if (action === "loved") {
        setLoved(true);
        toast.success("Loved");
      } else if (action === "dismissed" || action === "not_for_me") {
        setDismissed(true);
        toast("Hidden from feed");
      }
      onInteract?.(action);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save that");
    } finally {
      setBusy(null);
    }
  }

  if (dismissed) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="card h-0 overflow-hidden"
        aria-hidden="true"
      />
    );
  }

  const slotBadge = item.slot === "light" ? "Light" : item.slot === "serendipity" ? "Serendipity" : "Deep";
  const slotColor =
    item.slot === "light"
      ? "bg-[#A78BFA]/15 text-[#C4B5FD]"
      : item.slot === "serendipity"
      ? "bg-[#FF7A7A]/15 text-[#FCA5A5]"
      : "bg-[#F5B754]/15 text-[#FCD34D]";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "card overflow-hidden",
        completed && "ring-1 ring-emerald-400/30"
      )}
    >
      {link.thumbnail && (
        <a href={link.url} target="_blank" rel="noreferrer" className="block">
          <div
            className="relative h-44 w-full bg-white/[0.04] bg-cover bg-center"
            style={{ backgroundImage: `url(${link.thumbnail})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/80 to-transparent" />
            <div className="absolute left-3 top-3 flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", slotColor)}>
                {slotBadge}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white/80">
                <SourceIcon source={link.source} />
                {hostnameFromUrl(link.url)}
              </span>
            </div>
            {link.durationSec && link.durationSec > 0 && (
              <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium">
                {formatDuration(link.durationSec)}
              </span>
            )}
          </div>
        </a>
      )}

      <div className="flex flex-col gap-3 p-4">
        {!link.thumbnail && (
          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold", slotColor)}>
              {slotBadge}
            </span>
            <span className="inline-flex items-center gap-1">
              <SourceIcon source={link.source} />
              {hostnameFromUrl(link.url)}
            </span>
            {link.durationSec && link.durationSec > 0 && <span>{formatDuration(link.durationSec)}</span>}
          </div>
        )}

        <a href={link.url} target="_blank" rel="noreferrer" className="group">
          <h2 className="text-lg font-semibold leading-snug tracking-tight text-white group-hover:opacity-90">
            {link.title ?? link.url}
          </h2>
          {link.author && (
            <p className="mt-1 text-sm text-white/55">{link.author}</p>
          )}
        </a>

        {link.summary && <p className="text-sm leading-relaxed text-white/75">{link.summary}</p>}

        {takeaways.length > 0 && (
          <ul className="mt-1 space-y-1.5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 text-sm text-white/80">
            {takeaways.slice(0, 3).map((t, i) => (
              <li key={i} className="flex gap-2 leading-relaxed">
                <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-[#F5B754]" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}

        {link.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {link.topics.slice(0, 4).map((lt) => (
              <span
                key={lt.topic.id}
                className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/65"
              >
                {lt.topic.name}
              </span>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => react("loved")}
              disabled={busy !== null}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors",
                loved
                  ? "border-transparent bg-[#FF7A7A]/20 text-[#FCA5A5]"
                  : "border-white/[0.08] bg-white/[0.02] text-white/70 hover:bg-white/[0.05]"
              )}
              aria-label="Love"
            >
              <Heart className="h-4 w-4" strokeWidth={2.4} fill={loved ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => react("dismissed")}
              disabled={busy !== null}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.02] text-white/70 transition-colors hover:bg-white/[0.05]"
              aria-label="Hide"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost h-9 px-4 text-sm"
              onClick={() => {
                if (!completed) {
                  void fetch(`/api/feed/${link.id}/interact`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "opened" }),
                  });
                }
              }}
            >
              Open
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              onClick={() => react("completed")}
              disabled={busy !== null || completed}
              className={cn(
                "btn h-9 px-4 text-sm",
                completed ? "btn-ghost opacity-60" : "btn-accent"
              )}
            >
              <Check className="h-4 w-4" />
              {completed ? "Done" : "Mark done"}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function safeParse(s: string | null | undefined): unknown {
  if (!s) return [];
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}
