"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Lock } from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { LEVELS, ACHIEVEMENTS } from "@/lib/constants";
import { format } from "date-fns";
import type { AchievementData } from "@/types";

export default function AchievementsPage() {
  const { streak } = useApp();
  const [earned, setEarned] = useState<AchievementData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements?userId=default-user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.achievements) setEarned(data.achievements);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalXp = streak?.totalXp ?? 0;
  const currentLevel =
    LEVELS.findLast((l) => totalXp >= l.xpRequired) ?? LEVELS[0];
  const nextLevel =
    LEVELS.find((l) => l.xpRequired > totalXp) ?? currentLevel;
  const xpProgress =
    nextLevel.xpRequired > currentLevel.xpRequired
      ? ((totalXp - currentLevel.xpRequired) /
          (nextLevel.xpRequired - currentLevel.xpRequired)) *
        100
      : 100;

  const earnedIds = new Set(earned.map((e) => e.achievementId));

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-5 pt-6 pb-8">
        <div className="h-7 w-36 animate-pulse rounded-lg bg-white/[0.06] mb-5" />
        <div className="h-44 animate-pulse rounded-2xl bg-white/[0.06] mb-4" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-5 pt-6 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-white">Achievements</h1>
        <p className="mt-0.5 text-[14px] text-white/40">Milestones and badges you have earned</p>
      </div>

      {/* Level hero card */}
      <div className="rounded-2xl bg-green-900/30 border border-green-500/20 p-6 text-white">
        <div className="flex flex-col items-center text-center">
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="text-[48px] leading-none"
          >
            {currentLevel.icon}
          </motion.span>
          <h2 className="mt-3 text-[20px] font-bold tracking-tight">{currentLevel.name}</h2>
          <p className="text-[13px] font-medium text-white/40">Level {currentLevel.level}</p>
          <div className="mt-4 w-full max-w-[240px]">
            <div className="flex justify-between text-[11px] font-medium text-white/30 mb-1.5 tabular-nums">
              <span>{totalXp} XP</span>
              <span>{nextLevel.xpRequired} XP</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="h-2 rounded-full bg-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Streak info */}
      {streak && (
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                <Flame className="h-[18px] w-[18px] text-orange-500" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white">
                  {streak.currentStreak} day streak
                </p>
                <p className="text-[12px] text-white/40">
                  Best: {streak.longestStreak} days
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] font-semibold text-white/50">
              {earned.length} / {ACHIEVEMENTS.length}
            </span>
          </div>
        </div>
      )}

      {/* Achievement grid */}
      <div>
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-white/30">
          Badges
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {ACHIEVEMENTS.map((ach, i) => {
            const isEarned = earnedIds.has(ach.id);
            const earnedData = earned.find((e) => e.achievementId === ach.id);

            return (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <div
                  className={
                    isEarned
                      ? "rounded-2xl bg-green-900/20 border border-green-500/20 p-4 active:scale-[0.98] transition-transform duration-150"
                      : "rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 opacity-40"
                  }
                >
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    {isEarned ? (
                      <span className="text-[24px] leading-none drop-shadow-sm">{ach.icon}</span>
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06]">
                        <Lock className="h-3.5 w-3.5 text-white/20" />
                      </div>
                    )}
                    <p
                      className={`text-[11px] font-semibold leading-tight ${
                        isEarned ? "text-green-400" : "text-white/40"
                      }`}
                    >
                      {ach.name}
                    </p>
                    {isEarned && earnedData ? (
                      <p className="text-[10px] text-green-400/60 font-medium">
                        {format(new Date(earnedData.earnedAt), "MMM d")}
                      </p>
                    ) : (
                      <p className="text-[10px] text-white/30 leading-tight">
                        {ach.description}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
