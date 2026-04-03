"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, CheckCircle2, BookOpen, ChevronRight } from "lucide-react";
import { PHASE_COLORS } from "@/lib/constants";
import type { PhaseProgress } from "@/types";

export function LearnPageClient() {
  const [phases, setPhases] = useState<PhaseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress?userId=default-user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.phases) setPhases(data.phases);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-5 pt-6 pb-8">
        <div className="space-y-6">
          <div>
            <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
            <div className="mt-2 h-4 w-56 animate-pulse rounded-lg bg-slate-100" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-36 animate-pulse rounded-lg bg-slate-100" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-[72px] animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-5 pt-6 pb-8">
      {/* Page Header */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900">Learn</h1>
        <p className="mt-1 text-[15px] leading-relaxed text-slate-500">
          4 phases, 12 modules — your path to EDA mastery
        </p>
      </div>

      {/* Overall Progress Summary */}
      {phases.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
            <BookOpen className="h-[18px] w-[18px] text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-slate-800">
              {phases.reduce((a, p) => a + p.completedLessons, 0)} of{" "}
              {phases.reduce((a, p) => a + p.totalLessons, 0)} lessons complete
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                style={{
                  width: `${
                    phases.reduce((a, p) => a + p.totalLessons, 0) > 0
                      ? Math.round(
                          (phases.reduce((a, p) => a + p.completedLessons, 0) /
                            phases.reduce((a, p) => a + p.totalLessons, 0)) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Phase Sections */}
      {phases.map((phase, idx) => {
        const phaseKey = `phase-${idx + 1}` as keyof typeof PHASE_COLORS;
        const colors = PHASE_COLORS[phaseKey] ?? PHASE_COLORS["phase-1"];

        return (
          <section key={phase.phaseId}>
            {/* Phase Header */}
            <div className="mb-3 flex items-center gap-2.5">
              <div className={`h-2.5 w-2.5 rounded-full ${colors.accent}`} />
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">
                {phase.phaseName}
              </h2>
              <span className={`ml-auto rounded-full ${colors.bg} px-2.5 py-0.5 text-[11px] font-semibold ${colors.text}`}>
                {Math.round(phase.completionPercent)}%
              </span>
            </div>

            {/* Module Cards */}
            <div className="space-y-2">
              {phase.modules.map((mod) => (
                <ModuleCard
                  key={mod.moduleId}
                  module={mod}
                  colors={colors}
                />
              ))}
            </div>
          </section>
        );
      })}

      {phases.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
            <BookOpen className="h-6 w-6 text-slate-300" />
          </div>
          <p className="text-[15px] text-slate-500">No modules found. Check back soon!</p>
        </div>
      )}
    </div>
  );
}

function ModuleCard({
  module: mod,
  colors,
}: {
  module: PhaseProgress["modules"][number];
  colors: (typeof PHASE_COLORS)[keyof typeof PHASE_COLORS];
}) {
  if (mod.isLocked) {
    return (
      <div className="flex items-center gap-3.5 rounded-2xl bg-white/60 p-4 opacity-50">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
          <Lock className="h-4 w-4 text-slate-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-slate-400">
            {mod.moduleName}
          </p>
          <p className="text-[12px] text-slate-400/70">
            Complete prerequisites to unlock
          </p>
        </div>
      </div>
    );
  }

  const isComplete = mod.completionPercent >= 100;

  return (
    <Link href={`/learn/${mod.moduleId}`}>
      <div className="group flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-transform duration-150">
        {/* Icon */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isComplete ? "bg-emerald-50" : colors.bg
        }`}>
          {isComplete ? (
            <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
          ) : (
            <BookOpen className={`h-4 w-4 ${colors.text}`} />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[14px] font-medium ${
            isComplete ? "text-emerald-700" : "text-slate-800"
          }`}>
            {mod.moduleName}
          </p>
          <div className="mt-1.5 flex items-center gap-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isComplete
                    ? "bg-emerald-400"
                    : "bg-gradient-to-r from-indigo-400 to-violet-400"
                }`}
                style={{ width: `${mod.completionPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-slate-400 tabular-nums">
              {mod.completedLessons}/{mod.totalLessons}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors" />
      </div>
    </Link>
  );
}
