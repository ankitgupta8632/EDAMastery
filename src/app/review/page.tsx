"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, Brain, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ReviewItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  moduleName: string;
}

interface SessionSummary {
  reviewed: number;
  xpEarned: number;
}

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    fetch("/api/review?userId=default-user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.items) setItems(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentItem = items[currentIdx];

  const handleRate = async (quality: number) => {
    if (!currentItem || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "default-user",
          reviewItemId: currentItem.id,
          quality,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTotalXp((prev) => prev + (data.xpEarned ?? 0));

        if (currentIdx < items.length - 1) {
          setCurrentIdx((prev) => prev + 1);
        } else {
          setSummary({
            reviewed: items.length,
            xpEarned: totalXp + (data.xpEarned ?? 0),
          });
        }
      } else {
        toast.error("Failed to save review.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-5 pt-6 pb-8">
        <div className="h-7 w-36 animate-pulse rounded-lg bg-slate-100 mb-5" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  // All caught up
  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-5 pt-20 pb-8 text-center">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-teal-50"
        >
          <PartyPopper className="h-8 w-8 text-emerald-500" />
        </motion.div>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">All caught up!</h1>
        <p className="text-[14px] leading-relaxed text-slate-400 max-w-[260px]">
          No reviews due right now. Check back later or keep learning!
        </p>
      </div>
    );
  }

  // Session complete
  if (summary) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-5 pt-20 pb-8 text-center">
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-violet-50"
        >
          <Brain className="h-8 w-8 text-indigo-500" />
        </motion.div>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Session Complete!</h1>
        <div className="flex gap-2.5">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3.5 py-1.5 text-[13px] font-semibold text-slate-700">
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
            {summary.reviewed} reviewed
          </span>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3.5 py-1.5 text-[13px] font-semibold text-indigo-600">
            +{summary.xpEarned} XP
          </span>
        </div>
        <p className="text-[13px] text-slate-400">
          Great job keeping your knowledge fresh!
        </p>
      </div>
    );
  }

  // Active review
  const progress = ((currentIdx + 1) / items.length) * 100;

  return (
    <div className="mx-auto max-w-lg space-y-5 px-5 pt-6 pb-8">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold tracking-tight text-slate-900">Review</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-500 tabular-nums">
          {currentIdx + 1} / {items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Review card with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentItem.id}
          initial={{ opacity: 0, x: 30, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.98 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
            <div className="space-y-8 text-center py-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">
                  {currentItem.moduleName}
                </p>
                <h2 className="mt-3 text-[20px] font-bold tracking-tight text-slate-900 leading-snug">
                  {currentItem.lessonTitle}
                </h2>
              </div>

              <p className="text-[14px] text-slate-400">
                How well do you remember this?
              </p>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <button
                  onClick={() => handleRate(1)}
                  disabled={submitting}
                  className="rounded-xl border border-red-200 bg-red-50/50 px-6 py-3 text-[14px] font-semibold text-red-600 transition-all duration-150 hover:bg-red-50 hover:border-red-300 active:scale-[0.98] disabled:opacity-50"
                >
                  Forgot
                </button>
                <button
                  onClick={() => handleRate(3)}
                  disabled={submitting}
                  className="rounded-xl border border-amber-200 bg-amber-50/50 px-6 py-3 text-[14px] font-semibold text-amber-600 transition-all duration-150 hover:bg-amber-50 hover:border-amber-300 active:scale-[0.98] disabled:opacity-50"
                >
                  Hard
                </button>
                <button
                  onClick={() => handleRate(5)}
                  disabled={submitting}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-6 py-3 text-[14px] font-semibold text-emerald-600 transition-all duration-150 hover:bg-emerald-50 hover:border-emerald-300 active:scale-[0.98] disabled:opacity-50"
                >
                  Easy
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
