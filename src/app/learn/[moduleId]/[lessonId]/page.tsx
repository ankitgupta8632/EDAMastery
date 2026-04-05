"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
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
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import type { Lesson } from "@/types";
import { AskClaude } from "@/components/tutor/ask-claude";
import type { AskClaudeHandle } from "@/components/tutor/ask-claude";
import { PodcastTutor } from "@/components/tutor/podcast-tutor";
import { TextSelectionPopover } from "@/components/tutor/text-selection-popover";
import { parseVTT, getTranscriptContext } from "@/lib/transcript-utils";
import { SeekBar } from "@/components/media/seekbar";
import { SyncedCaptions } from "@/components/media/synced-captions";
import { FullscreenAudio } from "@/components/media/fullscreen-audio";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function LessonViewerPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<(Lesson & { quizId?: string | null; hasQuiz?: boolean }) | null>(null);
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

  const contentRef = useRef<HTMLDivElement>(null);
  const askClaudeRef = useRef<AskClaudeHandle>(null);

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
              <VideoPlayer
                src={lesson.videoUrl}
                transcript={lesson.videoTranscript ?? undefined}
              />
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

            {/* 3. Infographic — below audio, no box */}
            {lesson.infographicUrl && (
              <img
                src={lesson.infographicUrl}
                alt={`${lesson.title} infographic`}
                className="w-full rounded-xl"
                loading="lazy"
              />
            )}

            {/* 4. Text content + Protium note — selectable for inline explain */}
            <div ref={contentRef} className="select-text">
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

            {/* Protium Note — no box, flows like content */}
            {lesson.protiumNote && (
              <div className="py-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <Cpu className="h-4 w-4 text-amber-400" />
                  <p className="text-[13px] font-bold uppercase tracking-wider text-amber-400">
                    How This Applies to Protium
                  </p>
                </div>
                <div className="prose prose-sm max-w-none
                  prose-headings:text-amber-300 prose-headings:font-bold
                  prose-p:text-[15px] prose-p:leading-[1.8] prose-p:text-amber-200/60
                  prose-li:text-[15px] prose-li:text-amber-200/60 prose-li:leading-[1.7]
                  prose-strong:text-amber-300 prose-strong:font-semibold
                  prose-code:bg-amber-900/20 prose-code:text-amber-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {lesson.protiumNote}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            </div>{/* end contentRef wrapper */}

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

            {/* Quiz */}
            {lesson.quizId && (
              <Link
                href={`/quiz/${lesson.quizId}?lessonId=${lessonId}`}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#1a1a1a] border border-white/[0.06] py-4 text-[15px] font-semibold text-white active:scale-[0.98] transition-transform hover:bg-white/[0.04]"
              >
                <CheckCircle2 className="h-4.5 w-4.5 text-green-400" />
                Take Quiz
                <ArrowRight className="h-4 w-4 text-white/40" />
              </Link>
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

        {hasContent && (
          <>
            <AskClaude ref={askClaudeRef} lessonId={lessonId} lessonTitle={lesson?.title ?? ""} />
            <TextSelectionPopover
              containerRef={contentRef}
              onAskAbout={(text) => askClaudeRef.current?.openWithContext(text)}
              lessonId={lessonId}
            />
          </>
        )}
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
  const [showFullscreen, setShowFullscreen] = useState(false);
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

          {/* Progress bar with touch drag support */}
          <SeekBar
            currentTime={currentTime}
            duration={duration}
            onSeek={(time) => {
              if (audioRef.current) audioRef.current.currentTime = time;
            }}
          />

          {/* Speed control + Fullscreen + Ask button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (audioRef.current && playing) {
                  audioRef.current.pause();
                  setPlaying(false);
                }
                setShowFullscreen(true);
              }}
              className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/50 hover:bg-white/[0.1] transition-all duration-200 active:scale-[0.95]"
            >
              <Maximize2 className="h-3 w-3" />
              Fullscreen
            </button>
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

          {/* Synced captions */}
          {hasTranscript && (
            <SyncedCaptions segments={transcriptSegments} currentTime={currentTime} />
          )}
        </div>
      </div>

      {/* Fullscreen Audio */}
      <AnimatePresence>
        {showFullscreen && hasTranscript && (
          <FullscreenAudio
            src={src}
            segments={transcriptSegments}
            lessonTitle={lessonTitle}
            onClose={() => setShowFullscreen(false)}
            initialTime={currentTime}
            initialPlaying={playing}
          />
        )}
      </AnimatePresence>

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

/* --- Video Player --------------------------------------------------------- */

function VideoPlayer({
  src,
  transcript,
}: {
  src: string;
  transcript?: string;
}) {
  const [currentTime, setCurrentTime] = useState(0);

  const transcriptSegments = useMemo(() => transcript ? parseVTT(transcript) : [], [transcript]);
  const hasTranscript = transcriptSegments.length > 0;

  // Native track for fullscreen subtitles
  const trackUrl = useMemo(() => {
    if (!transcript) return null;
    const vtt = transcript.trim().startsWith("WEBVTT") ? transcript : `WEBVTT\n\n${transcript}`;
    const blob = new Blob([vtt], { type: "text/vtt" });
    return URL.createObjectURL(blob);
  }, [transcript]);

  useEffect(() => {
    return () => { if (trackUrl) URL.revokeObjectURL(trackUrl); };
  }, [trackUrl]);

  const activeSegment = useMemo(() => {
    if (!hasTranscript) return null;
    const current = transcriptSegments.find(
      (seg) => seg.startTime <= currentTime && seg.endTime >= currentTime
    );
    if (current) return current;
    const past = transcriptSegments.filter((seg) => seg.endTime <= currentTime);
    return past.length > 0 ? past[past.length - 1] : null;
  }, [transcriptSegments, hasTranscript, currentTime]);

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03]">
        <Video className="h-3.5 w-3.5 text-white/40" />
        <span className="text-[12px] font-medium uppercase tracking-wider text-white/40">Video Overview</span>
      </div>
      <div className="aspect-video bg-black">
        <video
          src={src}
          controls
          playsInline
          className="h-full w-full"
          preload="metadata"
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        >
          {trackUrl && (
            <track kind="subtitles" src={trackUrl} srcLang="en" label="English" default />
          )}
        </video>
      </div>
      {/* Dynamic caption below video — doesn't overlap video content */}
      {hasTranscript && (
        <SyncedCaptions segments={transcriptSegments} currentTime={currentTime} className="px-4 py-3" />
      )}
    </div>
  );
}
