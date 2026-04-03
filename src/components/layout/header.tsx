"use client";

import { useEffect } from "react";
import { Flame, Settings } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/contexts/app-context";
import { LEVELS } from "@/lib/constants";

export function Header() {
  const { streak, refreshStreak } = useApp();

  useEffect(() => {
    refreshStreak();
  }, [refreshStreak]);

  const currentLevel = streak
    ? LEVELS.findLast((l) => (streak.totalXp ?? 0) >= l.xpRequired) ?? LEVELS[0]
    : LEVELS[0];

  const nextLevel =
    LEVELS.find((l) => l.xpRequired > (streak?.totalXp ?? 0)) ?? currentLevel;

  const xpProgress =
    nextLevel.xpRequired > currentLevel.xpRequired
      ? ((streak?.totalXp ?? 0) - currentLevel.xpRequired) /
        (nextLevel.xpRequired - currentLevel.xpRequired)
      : 1;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-5">
        <Link href="/" className="flex items-center">
          <span className="text-[18px] font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            EDAMastery
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Streak pill */}
          <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-[13px] font-bold text-orange-600">{streak?.currentStreak ?? 0}</span>
          </div>

          {/* Level pill */}
          <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1">
            <span className="text-[12px]">{currentLevel.icon}</span>
            <span className="text-[12px] font-bold text-indigo-600">Lv{currentLevel.level}</span>
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <Settings className="h-[18px] w-[18px] text-slate-400" />
          </Link>
        </div>
      </div>
    </header>
  );
}
