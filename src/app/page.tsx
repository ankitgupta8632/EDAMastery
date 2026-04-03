"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Zap,
  Moon,
  Headphones,
  Clock,
  ChevronRight,
  Shield,
  BookOpen,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/contexts/app-context";
import { PHASE_COLORS } from "@/lib/constants";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import type { PhaseProgress } from "@/types";

interface ReviewItem {
  id: string;
  lessonTitle: string;
  moduleName: string;
  dueAt: string;
}

interface NextLessonData {
  completed: boolean;
  message?: string;
  lessonId?: string;
  title?: string;
  description?: string;
  moduleId?: string;
  moduleName?: string;
  phaseName?: string;
  phaseOrder?: number;
  estimatedMinutes?: number;
  difficulty?: string;
  lessonsToday?: number;
  moduleProgress?: { completed: number; total: number };
}

export default function DashboardPage() {
  const { streak, settings, recommendation, refreshStreak, refreshRecommendation, refreshSettings } =
    useApp();
  const [phases, setPhases] = useState<PhaseProgress[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [nextLesson, setNextLesson] = useState<NextLessonData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    refreshStreak();
    refreshRecommendation();
    refreshSettings();

    fetch("/api/settings?userId=default-user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && !data.onboardingCompleted) {
          setShowOnboarding(true);
        }
        setOnboardingChecked(true);
      })
      .catch(() => setOnboardingChecked(true));

    fetch("/api/progress?userId=default-user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.phases) setPhases(data.phases);
      })
      .catch(() => {});

    fetch("/api/review?userId=default-user&limit=5")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.items) setReviews(data.items);
      })
      .catch(() => {});

    fetch("/api/next-lesson?userId=default-user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setNextLesson(data);
      })
      .catch(() => {});
  }, [refreshStreak, refreshRecommendation, refreshSettings]);

  const greeting = recommendation?.greeting ?? getTimeGreeting();

  if (!onboardingChecked) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
    </div>
  );
  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setShowOnboarding(false);
          refreshSettings();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 px-5 pt-6 pb-8">

      {/* Greeting */}
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900">{greeting}</h1>
        {recommendation?.reason && (
          <p className="mt-1 text-[15px] leading-relaxed text-slate-500">{recommendation.reason}</p>
        )}
      </div>

      {/* Continue Learning Hero */}
      {nextLesson && <ContinueLearningCard nextLesson={nextLesson} />}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
              <BookOpen className="h-[18px] w-[18px] text-indigo-600" />
            </div>
            <div>
              <p className="text-[22px] font-bold leading-none text-slate-900">
                {nextLesson?.lessonsToday ?? 0}
              </p>
              <p className="mt-0.5 text-[12px] text-slate-400">
                lessons today
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
              <Flame className="h-[18px] w-[18px] text-orange-500" />
            </div>
            <div>
              <p className="text-[22px] font-bold leading-none text-slate-900">
                {streak?.currentStreak ?? 0}
              </p>
              <p className="mt-0.5 text-[12px] text-slate-400">
                day streak
              </p>
            </div>
          </div>
          {streak && streak.graceDaysUsed > 0 && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-600">
              <Shield className="h-3 w-3" />
              {streak.graceDaysMax - streak.graceDaysUsed} grace days left
            </div>
          )}
        </div>
      </div>

      {/* Phase Progress */}
      <div>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">Your Progress</h2>
        <div className="grid grid-cols-4 gap-2.5">
          {(phases.length > 0 ? phases : [null, null, null, null]).map((phase, idx) => {
            const phaseKey = `phase-${idx + 1}` as keyof typeof PHASE_COLORS;
            const colors = PHASE_COLORS[phaseKey] ?? PHASE_COLORS["phase-1"];
            const percent = phase?.completionPercent ?? 0;
            const name = phase?.phaseName ?? `Phase ${idx + 1}`;
            return (
              <div key={phase?.phaseId ?? idx} className="flex flex-col items-center">
                <ProgressRing
                  percent={percent}
                  accentClass={colors.accent}
                  textClass={colors.text}
                  size={56}
                  delay={idx * 0.12}
                />
                <p className={`mt-1.5 text-[10px] font-semibold leading-tight text-center ${colors.text}`}>
                  {name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      {nextLesson && !nextLesson.completed && (
        <div>
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-slate-400">Quick Start</h2>
          <div className="grid grid-cols-3 gap-2.5">
            <QuickAction
              href="/learn?mode=quick_win"
              icon={<Zap className="h-4 w-4" />}
              label="Quick Win"
              sublabel="2 min"
              bgClass="bg-amber-50"
              iconBgClass="bg-amber-100"
              textClass="text-amber-700"
            />
            <QuickAction
              href="/learn?mode=baby_napping"
              icon={<Moon className="h-4 w-4" />}
              label="Deep Focus"
              sublabel="15 min"
              bgClass="bg-indigo-50"
              iconBgClass="bg-indigo-100"
              textClass="text-indigo-700"
            />
            <QuickAction
              href="/learn?mode=commute"
              icon={<Headphones className="h-4 w-4" />}
              label="Commute"
              sublabel="15 min"
              bgClass="bg-violet-50"
              iconBgClass="bg-violet-100"
              textClass="text-violet-700"
            />
          </div>
        </div>
      )}

      {/* Upcoming Reviews */}
      {reviews.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">Up for Review</h2>
            <Link href="/review" className="text-[12px] font-medium text-indigo-500">
              See all
            </Link>
          </div>
          <div className="space-y-2">
            {reviews.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href="/review"
                className="group flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-transform duration-150"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                  <Clock className="h-4 w-4 text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-slate-800">
                    {item.lessonTitle}
                  </p>
                  <p className="text-[12px] text-slate-400">{item.moduleName}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Continue Learning Hero ─────────────────────────────────────────────── */

function ContinueLearningCard({ nextLesson }: { nextLesson: NextLessonData }) {
  if (nextLesson.completed) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-center shadow-lg shadow-emerald-200/40">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <GraduationCap className="h-7 w-7 text-white" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">
          You&apos;ve mastered EDA!
        </h2>
        <p className="mt-1 text-sm text-white/70">
          All lessons completed. Keep reviewing to stay sharp!
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-6 shadow-lg shadow-indigo-300/30">
      {/* Subtle decorative circles */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
          <span className="text-[12px] font-medium tracking-wide text-indigo-200 uppercase">
            {nextLesson.moduleName}
          </span>
        </div>
        <h2 className="text-[20px] font-bold text-white leading-snug tracking-tight">
          {nextLesson.title}
        </h2>
        {nextLesson.description && (
          <p className="mt-2 text-[14px] leading-relaxed text-white/60 line-clamp-2">
            {nextLesson.description}
          </p>
        )}
        <div className="mt-3 flex items-center gap-4 text-[12px] text-white/50">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {nextLesson.estimatedMinutes} min
          </span>
          {nextLesson.moduleProgress && (
            <span>
              {nextLesson.moduleProgress.completed} of {nextLesson.moduleProgress.total} lessons
            </span>
          )}
        </div>
        <Link href={`/learn/${nextLesson.moduleId}/${nextLesson.lessonId}`} className="block mt-5">
          <button className="w-full rounded-2xl bg-white py-3.5 text-[15px] font-semibold text-indigo-700 shadow-sm active:scale-[0.98] transition-transform duration-150">
            Continue Learning
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Quick Action ────────────────────────────────────────────────────────── */

function QuickAction({
  href,
  icon,
  label,
  sublabel,
  bgClass,
  iconBgClass,
  textClass,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  bgClass: string;
  iconBgClass: string;
  textClass: string;
}) {
  return (
    <Link href={href}>
      <div className={`flex flex-col items-center gap-2 rounded-2xl ${bgClass} py-4 px-2 active:scale-[0.97] transition-transform duration-150`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBgClass} ${textClass}`}>
          {icon}
        </div>
        <div className="text-center">
          <p className={`text-[12px] font-semibold ${textClass}`}>{label}</p>
          <p className="text-[10px] text-slate-400">{sublabel}</p>
        </div>
      </div>
    </Link>
  );
}

/* ─── Progress Ring ───────────────────────────────────────────────────────── */

function ProgressRing({
  percent,
  accentClass,
  textClass,
  size = 56,
  delay = 0,
}: {
  percent: number;
  accentClass: string;
  textClass: string;
  size?: number;
  delay?: number;
}) {
  const radius = size * 0.4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const center = size / 2;

  const colorMap: Record<string, string> = {
    "bg-indigo-500": "#6366f1",
    "bg-violet-500": "#8b5cf6",
    "bg-pink-500": "#ec4899",
    "bg-amber-500": "#f59e0b",
  };
  const strokeColor = colorMap[accentClass] ?? "#6366f1";

  return (
    <div className="relative" style={{ height: size, width: size }}>
      <svg
        className="-rotate-90"
        style={{ height: size, width: size }}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-black/[0.04]"
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay, ease: "easeOut" as const }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${textClass}`}>
        {Math.round(percent)}%
      </span>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
