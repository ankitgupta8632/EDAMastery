"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, Coffee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FeedCard, type FeedCardLink } from "@/components/feed/FeedCard";
import { StreakBadge } from "@/components/feed/StreakBadge";
import { ProgressRing } from "@/components/feed/ProgressRing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Item {
  id: string;
  linkId: string;
  slot: string;
  status: string;
  position: number;
  link: FeedCardLink;
}

interface Session {
  id: string;
  date: string;
  minutesTarget: number;
  minutesWatched: number;
  items: Item[];
}

interface Props {
  session: Session | null;
  streak: { current: number; longest: number };
  hasProfile: boolean;
  topGoals: { id: string; name: string; category: string; priority: number }[];
}

export function FeedClient({ session, streak, hasProfile, topGoals }: Props): React.ReactElement {
  const [items, setItems] = useState<Item[]>(session?.items ?? []);
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(
      (session?.items ?? [])
        .filter((i) => i.link.interactions?.some((x) => x.action === "completed"))
        .map((i) => i.linkId)
    )
  );
  const [elapsedMin, setElapsedMin] = useState(0);
  const [showedBreak, setShowedBreak] = useState<Record<number, boolean>>({});
  const [refreshing, setRefreshing] = useState(false);

  const completed = items.filter((i) => completedIds.has(i.linkId)).length;
  const total = items.length;
  const ringPct = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Track a session timer once the user opens the feed.
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      setElapsedMin(Math.floor((Date.now() - start) / 60000));
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // Friction breaks at 30/60/90
  useEffect(() => {
    for (const mark of [30, 60, 90]) {
      if (elapsedMin >= mark && !showedBreak[mark]) {
        setShowedBreak((s) => ({ ...s, [mark]: true }));
        toast(
          <div className="flex items-start gap-2">
            <Coffee className="mt-0.5 h-4 w-4 text-[#F5B754]" />
            <div>
              <div className="font-semibold">You&rsquo;re {mark} minutes in</div>
              <div className="text-xs text-white/60">
                Stretch, water, or check on family. The feed will wait.
              </div>
            </div>
          </div>,
          { duration: 8000 }
        );
      }
    }
  }, [elapsedMin, showedBreak]);

  const handleInteract = (linkId: string, action: string): void => {
    if (action === "completed") {
      setCompletedIds((s) => new Set(s).add(linkId));
    }
    if (action === "dismissed" || action === "not_for_me") {
      setItems((list) => list.filter((i) => i.linkId !== linkId));
    }
  };

  async function rebuild(): Promise<void> {
    setRefreshing(true);
    try {
      const res = await fetch("/api/feed/today?rebuild=1");
      if (!res.ok) throw new Error("rebuild failed");
      const data = (await res.json()) as { session: Session | null };
      if (data.session) {
        setItems(data.session.items);
        setCompletedIds(new Set());
      }
      toast.success("Feed refreshed");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't refresh");
    } finally {
      setRefreshing(false);
    }
  }

  const allDone = total > 0 && completed === total;
  const firstName = useMemo(() => "there", []);

  return (
    <main className="px-4 pt-4 safe-top">
      <header className="mb-5 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <ProgressRing value={completed} max={Math.max(total, 1)} size={42} label={`${ringPct}%`} />
          <div>
            <div className="text-xs uppercase tracking-[0.14em] text-white/45">Today</div>
            <div className="text-lg font-semibold leading-tight">
              {allDone ? "Done for today" : greeting(firstName)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge current={streak.current} />
          <button
            onClick={rebuild}
            disabled={refreshing}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-white/70 transition-colors hover:bg-white/[0.04]"
            aria-label="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </button>
        </div>
      </header>

      {!hasProfile && <SetupBanner />}
      {topGoals.length > 0 && <GoalsStrip goals={topGoals} />}

      <AnimatePresence initial={false}>
        <div className="space-y-4">
          {items.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <FeedCard
                item={{ linkId: it.linkId, slot: it.slot, status: it.status, position: it.position }}
                link={it.link}
                onInteract={(a) => handleInteract(it.linkId, a)}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {allDone && <DoneForToday />}
      {items.length === 0 && <EmptyToday />}
    </main>
  );
}

function greeting(name: string): string {
  const h = new Date().getHours();
  if (h < 5) return `Still up, ${name}?`;
  if (h < 12) return `Morning, ${name}`;
  if (h < 17) return `Afternoon, ${name}`;
  if (h < 21) return `Evening, ${name}`;
  return `Night, ${name}`;
}

function SetupBanner(): React.ReactElement {
  return (
    <Link
      href="/you"
      className="mb-4 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-3.5"
    >
      <Sparkles className="h-4 w-4 text-[#F5B754]" />
      <div className="flex-1">
        <div className="text-sm font-semibold">Tell Lodestar what matters</div>
        <div className="text-xs text-white/55">
          Two minutes on goals makes the feed 10× better.
        </div>
      </div>
      <span className="text-white/40">→</span>
    </Link>
  );
}

function GoalsStrip({
  goals,
}: {
  goals: { id: string; name: string; category: string }[];
}): React.ReactElement {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5 px-1">
      {goals.map((g) => (
        <span
          key={g.id}
          className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65"
        >
          {labelFor(g.category)} {g.name}
        </span>
      ))}
    </div>
  );
}

function labelFor(cat: string): string {
  switch (cat) {
    case "career":
      return "🧭";
    case "health":
      return "🌱";
    case "family":
      return "🏡";
    case "wealth":
      return "📈";
    case "craft":
      return "🛠";
    default:
      return "✨";
  }
}

function DoneForToday(): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mt-8 rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#F5B754]/10 via-transparent to-[#FF7A7A]/10 p-6 text-center"
    >
      <div className="text-xs uppercase tracking-[0.18em] text-white/50">Lodestar</div>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">That&rsquo;s the feed.</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/65">
        You finished today. Come back tomorrow — or paste a few more links to keep compounding.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link href="/add" className="btn btn-ghost h-10 px-4 text-sm">
          Add a link
        </Link>
        <Link href="/topics" className="btn btn-accent h-10 px-4 text-sm">
          Browse clusters
        </Link>
      </div>
    </motion.div>
  );
}

function EmptyToday(): React.ReactElement {
  return (
    <div className="mt-10 rounded-3xl border border-dashed border-white/[0.08] p-8 text-center">
      <p className="text-sm text-white/55">Feed is empty right now.</p>
      <Link href="/add" className="btn btn-accent mt-4 h-10 px-4 text-sm">
        Paste a link
      </Link>
    </div>
  );
}
