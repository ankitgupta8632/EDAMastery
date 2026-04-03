"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Headphones,
  Eye,
  Layers,
  Circle,
  CircleDot,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import type { Module, LessonProgressData } from "@/types";

interface ModuleDetail extends Module {
  progress: {
    completionPercent: number;
    lessons: Record<string, LessonProgressData>;
  };
}

const contentTypeIcon: Record<string, typeof Headphones> = {
  audio: Headphones,
  visual: Eye,
  mixed: Layers,
};

export default function ModuleDetailPage() {
  const params = useParams();
  const moduleId = params.moduleId as string;
  const [mod, setMod] = useState<ModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/modules/${moduleId}?userId=default-user`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setMod(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [moduleId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-5 pt-6 pb-8">
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-7 w-48 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-4 w-64 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-2 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="mx-auto max-w-lg px-5 pt-6 pb-8 text-center">
        <p className="text-[15px] text-slate-500">Module not found.</p>
        <Link href="/learn" className="mt-4 inline-block text-[14px] font-medium text-indigo-600 hover:underline">
          Back to modules
        </Link>
      </div>
    );
  }

  const isPhase4 = mod.phaseId?.includes("phase-4") || mod.phase?.order === 4;
  const percent = mod.progress?.completionPercent ?? 0;

  return (
    <div className="mx-auto max-w-lg space-y-5 px-5 pt-6 pb-8">
      {/* Back link */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-slate-600 transition-colors duration-200"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All modules
      </Link>

      {/* Module header */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900">{mod.name}</h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-slate-500">{mod.description}</p>

        {/* Progress bar */}
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              ~{mod.estimatedHours}h total
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              {Math.round(percent)}% complete
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Protium callout for Phase 4 */}
      {isPhase4 && (
        <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <ExternalLink className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-amber-800">
              Protium Connection
            </p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-amber-600/80">
              This module integrates with Protium for hands-on lab exercises.
            </p>
          </div>
        </div>
      )}

      {/* Lesson list */}
      <div>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">
          Lessons
        </h2>
        <div className="space-y-2">
          {mod.lessons
            ?.sort((a, b) => a.order - b.order)
            .map((lesson) => {
              const prog = mod.progress?.lessons?.[lesson.id];
              const status = prog?.status ?? "not_started";
              const Icon = contentTypeIcon[lesson.contentType] ?? Layers;

              return (
                <Link key={lesson.id} href={`/learn/${moduleId}/${lesson.id}`}>
                  <div className="group flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-transform duration-150">
                    {/* Status indicator */}
                    {status === "completed" ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                        <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                      </div>
                    ) : status === "in_progress" ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                        <CircleDot className="h-[18px] w-[18px] text-indigo-500" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50">
                        <Circle className="h-[18px] w-[18px] text-slate-300" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[14px] font-medium text-slate-800">
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[12px] text-slate-400">
                          <Icon className="h-3 w-3" />
                          {lesson.contentType}
                        </span>
                        <span className="flex items-center gap-1 text-[12px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {lesson.estimatedMinutes} min
                        </span>
                        <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          {lesson.difficulty}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}
