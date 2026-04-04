"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  PartyPopper,
  Trophy,
  Clock,
  Cpu,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import type { Lesson } from "@/types";
import { AskClaude } from "@/components/tutor/ask-claude";
import { PodcastTutor } from "@/components/tutor/podcast-tutor";
import { parseVTT, getTranscriptContext } from "@/lib/transcript-utils";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function LessonViewerPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [confidence, setConfidence] = useState(3);
  const [completing, setCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [nextLessonData, setNextLessonData] = useState<{
    id: string;
    title: string;
    estimatedMinutes?: number;
    moduleId?: string;
    moduleName?: string;
  } | null>(null);
  const [prevLessonData, setPrevLessonData] = useState<{
    id: string;
    title: string;
    moduleId?: string;
    moduleName?: string;
  } | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    fetch(`/api/content/${lessonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setLesson(data);
          if (data.nextLesson) setNextLessonData(data.nextLesson);
          if (data.prevLesson) setPrevLessonData(data.prevLesson);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "default-user",
          lessonId,
          status: "completed",
          confidenceScore: confidence,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const xpEarned = data.xpEarned ?? 10;
        toast.success(`+${xpEarned} XP earned! Great work!`);
        setIsCompleted(true);
      } else {
        toast.error("Failed to save progress. Try again.");
      }
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-5 pt-6 pb-8">
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="h-8 w-64 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="h-4 w-48 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="h-[140px] animate-pulse rounded-2xl bg-white/[0.06]" />
          <div className="h-64 animate-pulse rounded-2xl bg-white/[0.06]" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/[0.06]" />
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="mx-auto max-w-lg px-5 pt-6 pb-8 text-center">
        <p className="text-[15px] text-white/50">Lesson not found.</p>
        <Link href={`/learn/${moduleId}`} className="mt-4 inline-block text-[14px] font-medium text-green-400 hover:underline">
          Back to module
        </Link>
      </div>
    );
  }

  const hasContent = lesson.contentMarkdown || lesson.contentStatus === "published";

  return (
    <>
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-green-500 origin-left"
        style={{ scaleX }}
      />

      <div className="mx-auto max-w-lg space-y-6 px-5 pt-6 pb-8">
        {/* Navigation links */}
        <div className="flex items-center justify-between">
          <Link
            href={`/learn/${moduleId}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/40 hover:text-white/60 transition-colors duration-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to module
          </Link>
          {prevLessonData && (
            <Link
              href={`/learn/${prevLessonData.moduleId ?? moduleId}/${prevLessonData.id}`}
              className="inline-flex items-center gap-1 text-[12px] text-white/40 hover:text-white/60 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              Previous
            </Link>
          )}
        </div>

        {/* Title — Medium-style large heading */}
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-white leading-tight">{lesson.title}</h1>
          <p className="mt-2 text-[16px] leading-relaxed text-white/50">{lesson.description}</p>
        </div>

        {!hasContent ? (
          <div className="flex items-center gap-3.5 rounded-2xl bg-amber-900/20 border border-amber-800/30 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-900/40">
              <AlertTriangle className="h-[18px] w-[18px] text-amber-400" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-amber-300">
                Content coming soon
              </p>
              <p className="mt-0.5 text-[13px] text-amber-400/60">
                This lesson is still being prepared. Check back later!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Video Overview (highest priority) */}
            {lesson.videoUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03]">
                  <Video className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-[12px] font-medium uppercase tracking-wider text-white/40">Video Overview</span>
                </div>
                <div className="aspect-video bg-black">
                  <video
                    src={lesson.videoUrl}
                    controls
                    playsInline
                    className="h-full w-full"
                    preload="metadata"
                  />
                </div>
              </div>
            )}

            {/* 2. Audio Overview */}
            {lesson.audioUrl && (
              <AudioPlayer
                src={lesson.audioUrl}
                transcript={lesson.audioTranscript ?? undefined}
                lessonId={lessonId}
                lessonTitle={lesson.title}
              />
            )}

            {/* 3. Text content — Medium-style reading, no box */}
            {lesson.contentMarkdown && (
              <div className="py-2">
                <div className="prose prose-sm max-w-none
                  prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-[20px] prose-h2:mt-8 prose-h2:mb-3
                  prose-h3:text-[17px] prose-h3:mt-6 prose-h3:mb-2
                  prose-p:text-[16px] prose-p:leading-[1.85] prose-p:text-white/70
                  prose-li:text-[16px] prose-li:text-white/70 prose-li:leading-[1.7]
                  prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-green-400 prose-code:text-[13px] prose-code:font-medium prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-[#0d0d0d] prose-pre:rounded-xl prose-pre:border prose-pre:border-white/[0.06]
                  prose-a:text-green-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-white prose-strong:font-semibold
                  prose-img:rounded-xl
                  prose-blockquote:border-l-green-500 prose-blockquote:bg-green-900/10 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:px-4
                  prose-hr:border-white/[0.06]
                  prose-table:text-[14px]
                  prose-th:text-white/70 prose-th:font-semibold
                  prose-td:text-white/60">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {lesson.contentMarkdown.replace(/^#\s+.+\n+/, '')}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Protium Note */}
            {lesson.protiumNote && (
              <div className="rounded-2xl bg-amber-900/20 border border-amber-800/30 p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-900/40">
                    <Cpu className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <p className="text-[12px] font-bold uppercase tracking-wider text-amber-400">
                    Protium Note
                  </p>
                </div>
                <div className="prose prose-sm max-w-none prose-p:text-[14px] prose-p:leading-[1.7] prose-p:text-amber-300/70">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {lesson.protiumNote}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* Infographic */}
            {lesson.infographicUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03]">
                  <svg className="h-3.5 w-3.5 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /></svg>
                  <span className="text-[12px] font-medium uppercase tracking-wider text-white/40">Visual Reference</span>
                </div>
                <div className="bg-white/[0.02] p-2">
                  <img
                    src={lesson.infographicUrl}
                    alt={`${lesson.title} infographic`}
                    className="w-full rounded-xl"
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Lab link */}
            {lesson.labUrl && (
              <a
                href={lesson.labUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-green-900/20 border border-green-800/30 px-5 py-3.5 text-[14px] font-semibold text-green-400 active:scale-[0.98] transition-transform duration-150"
              >
                <ExternalLink className="h-4 w-4" />
                Open Lab Exercise
              </a>
            )}

            {/* Confidence + Complete / Celebration */}
            {isCompleted ? (
              <CompletionCelebration
                nextLessonData={nextLessonData}
                moduleId={moduleId}
                router={router}
              />
            ) : (
              <div className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-5">
                <div className="space-y-5">
                  <div>
                    <label className="text-[14px] font-semibold text-white">
                      Confidence Level
                    </label>
                    <p className="text-[13px] text-white/40 mt-1 mb-4">
                      How well do you understand this material?
                    </p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() => setConfidence(level)}
                          className={`flex h-11 flex-1 items-center justify-center rounded-xl text-[14px] font-semibold transition-all duration-200 active:scale-[0.95] ${
                            confidence === level
                              ? "bg-green-600 text-white"
                              : "bg-white/[0.06] text-white/50 hover:bg-white/[0.1]"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[11px] text-white/30">
                      <span>Not at all</span>
                      <span>Very well</span>
                    </div>
                  </div>

                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] transition-all duration-150 hover:bg-green-500 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-[18px] w-[18px]" />
                    {completing ? "Saving..." : "Mark Complete"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {hasContent && <AskClaude lessonId={lessonId} lessonTitle={lesson?.title ?? ""} />}
      </div>
    </>
  );
}

/* --- Completion Celebration ------------------------------------------------ */

function CompletionCelebration({
  nextLessonData,
  moduleId,
  router,
}: {
  nextLessonData: {
    id: string;
    title: string;
    estimatedMinutes?: number;
    moduleId?: string;
    moduleName?: string;
  } | null;
  moduleId: string;
  router: ReturnType<typeof useRouter>;
}) {
  if (nextLessonData && nextLessonData.moduleName) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] border border-green-900/30 p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-900/30"
        >
          <PartyPopper className="h-7 w-7 text-green-400" />
        </motion.div>
        <h2 className="mt-4 text-[18px] font-bold text-white">Module Complete!</h2>
        <p className="mt-1 text-[14px] text-white/50">
          Continue to <strong className="text-white/70">{nextLessonData.moduleName}</strong>
        </p>
        <button
          onClick={() =>
            router.push(`/learn/${nextLessonData.moduleId}/${nextLessonData.id}`)
          }
          className="mt-5 w-full rounded-2xl bg-green-600 py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] transition-transform duration-150 hover:bg-green-500"
        >
          <span className="flex items-center justify-center gap-2">
            {nextLessonData.title}
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
        {nextLessonData.estimatedMinutes && (
          <p className="mt-2 flex items-center justify-center gap-1 text-[12px] text-white/30">
            <Clock className="h-3 w-3" />
            {nextLessonData.estimatedMinutes} min
          </p>
        )}
      </div>
    );
  }

  if (nextLessonData) {
    return (
      <div className="rounded-2xl bg-[#1a1a1a] border border-green-900/30 p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-900/30"
        >
          <CheckCircle2 className="h-7 w-7 text-green-400" />
        </motion.div>
        <h2 className="mt-4 text-[18px] font-bold text-white">Lesson Complete!</h2>
        <p className="mt-1 text-[14px] text-white/50">Up next:</p>
        <button
          onClick={() =>
            router.push(`/learn/${moduleId}/${nextLessonData.id}`)
          }
          className="mt-4 w-full rounded-2xl bg-green-600 py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] transition-transform duration-150 hover:bg-green-500"
        >
          <span className="flex items-center justify-center gap-2">
            {nextLessonData.title}
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
        {nextLessonData.estimatedMinutes && (
          <p className="mt-2 flex items-center justify-center gap-1 text-[12px] text-white/30">
            <Clock className="h-3 w-3" />
            {nextLessonData.estimatedMinutes} min
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#1a1a1a] border border-amber-900/30 p-8 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
      >
        <Trophy className="mx-auto h-14 w-14 text-amber-400" />
      </motion.div>
      <h2 className="mt-4 text-[22px] font-bold text-white">
        Course Complete!
      </h2>
      <p className="mt-1 text-[15px] text-white/50">
        You&apos;ve mastered EDA!
      </p>
      <button
        onClick={() => router.push("/learn")}
        className="mt-6 w-full rounded-2xl bg-green-600 py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] transition-transform duration-150 hover:bg-green-500"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

/* --- Audio Player ---------------------------------------------------------- */

function AudioPlayer({
  src,
  transcript,
  lessonId,
  lessonTitle,
}: {
  src: string;
  transcript?: string;
  lessonId: string;
  lessonTitle: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showPodcastTutor, setShowPodcastTutor] = useState(false);
  const [pausedTimestamp, setPausedTimestamp] = useState(0);
  const [pausedTranscript, setPausedTranscript] = useState("");

  const transcriptSegments = transcript ? parseVTT(transcript) : [];
  const hasTranscript = transcriptSegments.length > 0;

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(speed);
    const nextIdx = (idx + 1) % SPEED_OPTIONS.length;
    const newSpeed = SPEED_OPTIONS[nextIdx];
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleAskAboutThis = () => {
    const audio = audioRef.current;
    if (audio && playing) {
      audio.pause();
      setPlaying(false);
    }
    const ts = audioRef.current?.currentTime ?? 0;
    setPausedTimestamp(ts);
    if (hasTranscript) {
      setPausedTranscript(getTranscriptContext(transcriptSegments, ts, 90));
    }
    setShowPodcastTutor(true);
  };

  const handleResume = () => {
    setShowPodcastTutor(false);
    const audio = audioRef.current;
    if (audio) {
      audio.play();
      setPlaying(true);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-[#1a1a1a] border border-white/[0.06] text-white">
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => setPlaying(false)}
        />

        <div className="p-5 space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <button onClick={() => skip(-15)} className="text-white/30 hover:text-white/60 transition-colors duration-200 active:scale-[0.9]">
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={togglePlay}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#121212] active:scale-[0.92] transition-transform duration-150"
            >
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button onClick={() => skip(15)} className="text-white/30 hover:text-white/60 transition-colors duration-200 active:scale-[0.9]">
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div
              className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/[0.06]"
              onClick={(e) => {
                if (audioRef.current && duration > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  audioRef.current.currentTime = percent * duration;
                }
              }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-green-500 transition-all duration-100"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-md transition-all duration-100"
                style={{ left: `calc(${progressPercent}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-white/30 tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Speed control + Ask button */}
          <div className="flex items-center justify-between">
            <div className="w-20" />
            <button
              onClick={cycleSpeed}
              className="rounded-full bg-white/[0.06] px-4 py-1.5 text-[12px] font-semibold text-white/50 hover:bg-white/[0.1] transition-all duration-200 active:scale-[0.95]"
            >
              {speed}x
            </button>
            {(hasTranscript || currentTime > 5) && !playing ? (
              <button
                onClick={handleAskAboutThis}
                className="flex items-center gap-1.5 rounded-full bg-green-900/20 border border-green-800/30 px-3.5 py-1.5 text-[12px] font-medium text-green-400 hover:bg-green-900/30 transition-all duration-200 active:scale-[0.95]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                Ask about this
              </button>
            ) : (
              <div className="w-20" />
            )}
          </div>
        </div>
      </div>

      {/* Podcast Tutor Panel */}
      {showPodcastTutor && (
        <PodcastTutor
          lessonId={lessonId}
          lessonTitle={lessonTitle}
          audioTimestamp={pausedTimestamp}
          recentTranscript={pausedTranscript}
          onResume={handleResume}
          onClose={() => setShowPodcastTutor(false)}
        />
      )}
    </>
  );
}
