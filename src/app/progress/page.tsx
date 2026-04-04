"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Clock, Star, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApp } from "@/contexts/app-context";
import { PHASE_COLORS, LEVELS } from "@/lib/constants";
import type { PhaseProgress } from "@/types";

interface ProgressData {
  phases: PhaseProgress[];
  totalLessons: number;
  completedLessons: number;
  totalXp: number;
  level: number;
  estimatedHoursRemaining: number;
}

export default function ProgressPage() {
  const { streak } = useApp();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress?userId=default-user")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setData(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-5 pt-6 pb-8">
        <div className="h-7 w-28 animate-pulse rounded-lg bg-white/[0.06] mb-5" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.06]" />
          ))}
        </div>
      </div>
    );
  }

  const totalLessons = data?.totalLessons ?? 0;
  const completedLessons = data?.completedLessons ?? 0;
  const overallPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const phases = data?.phases ?? [];
  const totalXp = data?.totalXp ?? streak?.totalXp ?? 0;
  const currentLevel = LEVELS.findLast((l) => totalXp >= l.xpRequired) ?? LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.xpRequired > totalXp) ?? currentLevel;

  // Chart data: lessons completed per module
  const chartData = phases.flatMap((phase) =>
    phase.modules.map((mod) => ({
      name: mod.moduleName.length > 12 ? mod.moduleName.slice(0, 12) + "..." : mod.moduleName,
      completed: mod.completedLessons,
      total: mod.totalLessons,
    }))
  );

  return (
    <div className="mx-auto max-w-lg space-y-5 px-5 pt-6 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-white">Progress</h1>
        <p className="mt-0.5 text-[14px] text-white/40">Your learning journey so far</p>
      </div>

      {/* Overall completion hero */}
      <div className="rounded-2xl bg-green-900/30 border border-green-500/20 p-5 text-white">
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center">
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="text-[42px] font-extrabold leading-none tracking-tight"
            >
              {overallPercent}%
            </motion.p>
            <p className="mt-1 text-[12px] font-medium text-white/40 uppercase tracking-wider">complete</p>
          </div>
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-white/70">
                {completedLessons} of {totalLessons} lessons
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-2 rounded-full bg-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* XP and Level stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-4 active:scale-[0.98] transition-transform duration-150">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
              <Star className="h-[18px] w-[18px] text-amber-400" />
            </div>
            <div>
              <p className="text-[22px] font-bold leading-none text-white">{totalXp}</p>
              <p className="mt-0.5 text-[12px] text-white/40">total XP</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-4 active:scale-[0.98] transition-transform duration-150">
          <div className="flex items-center gap-3">
            <span className="text-[28px] leading-none">{currentLevel.icon}</span>
            <div>
              <p className="text-[15px] font-bold leading-none text-white">{currentLevel.name}</p>
              <p className="mt-0.5 text-[12px] text-white/40">Level {currentLevel.level}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Phase progress */}
      <div>
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-white/30">
          Phase Progress
        </p>
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-4">
          <div className="space-y-4">
            {phases.map((phase, idx) => {
              const phaseKey = `phase-${idx + 1}` as keyof typeof PHASE_COLORS;
              const colors = PHASE_COLORS[phaseKey] ?? PHASE_COLORS["phase-1"];
              return (
                <div key={phase.phaseId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[14px] font-semibold ${colors.text}`}>
                      {phase.phaseName}
                    </span>
                    <span className="text-[12px] font-semibold text-white/40 tabular-nums">
                      {Math.round(phase.completionPercent)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${phase.completionPercent}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                      className={`h-2 rounded-full ${colors.accent}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lessons per module chart */}
      {chartData.length > 0 && (
        <div>
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-white/30 flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Lessons by Module
          </p>
          <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#666" }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#666" }}
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: "#1a1a1a",
                    color: "#fff",
                    fontSize: "12px",
                    padding: "8px 12px",
                  }}
                />
                <Bar dataKey="completed" fill="#1A8917" radius={[6, 6, 0, 0]} name="Completed" />
                <Bar dataKey="total" fill="#333" radius={[6, 6, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Estimated time remaining */}
      {data?.estimatedHoursRemaining != null && data.estimatedHoursRemaining > 0 && (
        <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
              <Clock className="h-[18px] w-[18px] text-white/40" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white">
                ~{Math.round(data.estimatedHoursRemaining)} hours remaining
              </p>
              <p className="text-[12px] text-white/40">
                Based on your current pace
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
