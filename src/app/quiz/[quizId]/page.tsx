"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Quiz, Question, QuizAttemptResult } from "@/types";

export default function QuizPage(): React.JSX.Element {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = params.quizId as string;
  const lessonId = searchParams.get("lessonId") ?? quizId;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/quiz?lessonId=${lessonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setQuiz(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lessonId]);

  const questions = quiz?.questions?.sort((a, b) => a.order - b.order) ?? [];
  const currentQ = questions[currentIdx];
  const isCorrect = selectedAnswer === currentQ?.correctAnswer;
  const isLastQuestion = currentIdx === questions.length - 1;

  const handleSelect = (answer: string) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    setAnswers((prev) => ({ ...prev, [currentQ.id]: answer }));
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      setSubmitting(true);
      try {
        const finalAnswers = { ...answers };
        const res = await fetch("/api/quiz/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "default-user",
            quizId: quiz!.id,
            answers: finalAnswers,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        } else {
          toast.error("Failed to submit quiz.");
        }
      } catch {
        toast.error("Network error.");
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="h-64 animate-pulse rounded-2xl bg-white/[0.06]" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-white/50">No quiz found for this lesson.</p>
      </div>
    );
  }

  // ── Results screen ──────────────────────────────────────────
  if (result) {
    const percentage = Math.round(
      (result.correctCount / result.totalQuestions) * 100
    );
    const isPerfect = percentage === 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl px-4 py-8 pb-24 space-y-8"
      >
        {/* Score header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className={cn(
              "mx-auto flex h-20 w-20 items-center justify-center rounded-full",
              isPerfect ? "bg-green-900/30" : percentage >= 70 ? "bg-amber-900/30" : "bg-red-900/30"
            )}
          >
            <Trophy className={cn(
              "h-10 w-10",
              isPerfect ? "text-green-400" : percentage >= 70 ? "text-amber-400" : "text-red-400"
            )} />
          </motion.div>

          <h1 className="text-[22px] font-bold text-white">Quiz Complete!</h1>

          <div className={cn(
            "text-[48px] font-bold",
            isPerfect ? "text-green-400" : percentage >= 70 ? "text-amber-400" : "text-red-400"
          )}>
            {percentage}%
          </div>

          <div className="flex items-center justify-center gap-3">
            <span className="rounded-full bg-white/[0.06] px-4 py-1.5 text-[13px] font-medium text-white/60">
              {result.correctCount}/{result.totalQuestions} correct
            </span>
            <span className="rounded-full bg-green-900/20 border border-green-800/30 px-4 py-1.5 text-[13px] font-medium text-green-400">
              +{result.xpEarned} XP
            </span>
          </div>
        </div>

        {/* All questions review */}
        <div className="space-y-4">
          <h2 className="text-[15px] font-semibold text-white/70">
            Answer Review
          </h2>

          {questions.map((q, idx) => {
            const userAnswer = answers[q.id];
            const wasCorrect = userAnswer === q.correctAnswer;

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                className={cn(
                  "rounded-2xl border p-4 space-y-3",
                  wasCorrect
                    ? "border-green-800/30 bg-green-900/10"
                    : "border-red-800/30 bg-red-900/10"
                )}
              >
                {/* Question header */}
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full mt-0.5",
                    wasCorrect ? "bg-green-900/40" : "bg-red-900/40"
                  )}>
                    {wasCorrect ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-white/80">
                      <span className="text-white/40 mr-1.5">Q{idx + 1}.</span>
                      {q.questionText}
                    </p>
                  </div>
                </div>

                {/* Answer details */}
                <div className="ml-9 space-y-1.5">
                  {!wasCorrect && (
                    <p className="text-[12px] text-red-400/80">
                      Your answer: <span className="font-medium">{userAnswer}</span>
                    </p>
                  )}
                  <p className="text-[12px] text-green-400/80">
                    {wasCorrect ? "Your answer" : "Correct answer"}:{" "}
                    <span className="font-medium">{q.correctAnswer}</span>
                  </p>
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="ml-9 rounded-xl bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[12px] leading-relaxed text-white/50">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex-1 rounded-2xl bg-white/[0.06] py-3.5 text-[14px] font-medium text-white/60 active:scale-[0.98] transition-transform"
          >
            <ChevronLeft className="inline h-4 w-4 mr-1" />
            Back to Lesson
          </button>
          <button
            onClick={() => {
              setResult(null);
              setCurrentIdx(0);
              setSelectedAnswer(null);
              setShowResult(false);
              setAnswers({});
            }}
            className="flex-1 rounded-2xl bg-green-600 py-3.5 text-[14px] font-semibold text-white active:scale-[0.98] transition-transform hover:bg-green-500"
          >
            Retake Quiz
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Question view ───────────────────────────────────────────
  const options =
    currentQ.questionType === "true_false"
      ? ["True", "False"]
      : currentQ.options;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-24"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-white">Quiz</h1>
        <span className="rounded-full bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-white/50">
          {currentIdx + 1} / {questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/[0.06]">
        <div
          className="h-1.5 rounded-full bg-green-500 transition-all"
          style={{
            width: `${((currentIdx + (showResult ? 1 : 0)) / questions.length) * 100}%`,
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <p className="text-[16px] font-medium leading-relaxed text-white/90">
            {currentQ.questionText}
          </p>

          <div className="space-y-2.5">
            {options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isCorrectOption = option === currentQ.correctAnswer;

              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  disabled={showResult}
                  className={cn(
                    "w-full rounded-xl border px-4 py-3.5 text-left text-[14px] font-medium transition-all active:scale-[0.98]",
                    !showResult &&
                      "border-white/[0.06] bg-white/[0.03] text-white/70 hover:border-green-800/50 hover:bg-green-900/10",
                    showResult && isCorrectOption &&
                      "border-green-700/50 bg-green-900/20 text-green-400",
                    showResult && isSelected && !isCorrectOption &&
                      "border-red-700/50 bg-red-900/20 text-red-400",
                    showResult && !isSelected && !isCorrectOption &&
                      "border-white/[0.03] text-white/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && isCorrectOption && (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    )}
                    {showResult && isSelected && !isCorrectOption && (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showResult && currentQ.explanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4"
            >
              <p className="text-[13px] leading-relaxed text-white/50">
                {currentQ.explanation}
              </p>
            </motion.div>
          )}

          {/* Next button */}
          {showResult && (
            <button
              onClick={handleNext}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 py-3.5 text-[15px] font-semibold text-white active:scale-[0.98] transition-transform hover:bg-green-500 disabled:opacity-60"
            >
              {submitting
                ? "Submitting..."
                : isLastQuestion
                ? "See Results"
                : "Next Question"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
