"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Quiz, Question, QuizAttemptResult } from "@/types";

export default function QuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
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
      // Submit quiz
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
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-slate-500">No quiz found for this lesson.</p>
      </div>
    );
  }

  // Results screen
  if (result) {
    const percentage = Math.round(
      (result.correctCount / result.totalQuestions) * 100
    );
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-12 text-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
          <Trophy className="h-10 w-10 text-indigo-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Quiz Complete!</h1>

        <div className="text-5xl font-bold text-indigo-600">{percentage}%</div>

        <div className="flex gap-4">
          <Badge variant="outline" className="px-4 py-1">
            {result.correctCount}/{result.totalQuestions} correct
          </Badge>
          <Badge variant="outline" className="px-4 py-1 text-indigo-600">
            +{result.xpEarned} XP
          </Badge>
        </div>

        {/* Review wrong answers */}
        {result.correctCount < result.totalQuestions && (
          <div className="w-full space-y-3 text-left">
            <h3 className="text-sm font-semibold text-slate-600">
              Review incorrect answers:
            </h3>
            {questions
              .filter((q) => answers[q.id] !== q.correctAnswer)
              .map((q) => (
                <Card key={q.id} className="border-red-100">
                  <CardContent className="py-3 space-y-1">
                    <p className="text-sm font-medium text-slate-700">
                      {q.questionText}
                    </p>
                    <p className="text-xs text-red-500">
                      Your answer: {answers[q.id]}
                    </p>
                    <p className="text-xs text-green-600">
                      Correct: {q.correctAnswer}
                    </p>
                    {q.explanation && (
                      <p className="text-xs text-slate-500 mt-1">
                        {q.explanation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </motion.div>
    );
  }

  // Question view
  const options =
    currentQ.questionType === "true_false"
      ? ["True", "False"]
      : currentQ.options;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6 px-4 py-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Quiz</h1>
        <Badge variant="outline">
          {currentIdx + 1} / {questions.length}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-slate-100">
        <div
          className="h-1.5 rounded-full bg-indigo-500 transition-all"
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
        >
          <Card>
            <CardContent className="space-y-6 py-6">
              <p className="text-base font-medium text-slate-800">
                {currentQ.questionText}
              </p>

              <div className="space-y-2">
                {options.map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectOption = option === currentQ.correctAnswer;

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      disabled={showResult}
                      className={cn(
                        "w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all",
                        !showResult &&
                          "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50",
                        showResult && isCorrectOption &&
                          "border-green-300 bg-green-50 text-green-700",
                        showResult && isSelected && !isCorrectOption &&
                          "border-red-300 bg-red-50 text-red-700",
                        showResult && !isSelected && !isCorrectOption &&
                          "border-slate-100 text-slate-400"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {showResult && isCorrectOption && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {showResult && isSelected && !isCorrectOption && (
                          <XCircle className="h-4 w-4 text-red-500" />
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
                  className="rounded-lg bg-slate-50 p-3"
                >
                  <p className="text-xs text-slate-600">
                    {currentQ.explanation}
                  </p>
                </motion.div>
              )}

              {/* Next button */}
              {showResult && (
                <Button
                  onClick={handleNext}
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitting
                    ? "Submitting..."
                    : isLastQuestion
                    ? "See Results"
                    : "Next Question"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
