// Re-export all types
export type { LearningMode } from "@/lib/constants";

// ─── Curriculum Types ───

export interface Phase {
  id: string;
  name: string;
  description: string;
  order: number;
  colorHex: string;
  modules: Module[];
}

export interface Module {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedHours: number;
  phaseId: string;
  notebookId: string | null;
  notebookUrl: string | null;
  phase?: Phase;
  lessons: Lesson[];
  prerequisites: { prerequisiteId: string }[];
  prerequisiteOf: { moduleId: string }[];
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  estimatedMinutes: number;
  contentType: string;
  difficulty: string;
  moduleId: string;
  contentMarkdown: string | null;
  contentJson: string | null;
  audioUrl: string | null;
  audioTranscript: string | null;
  protiumNote: string | null;
  labUrl: string | null;
  labInstructions: string | null;
  contentStatus: string;
  generatedAt: Date | null;
  reviewedAt: Date | null;
  sourceQuery: string | null;
}

// ─── Progress Types ───

export interface LessonProgressData {
  id: string;
  userId: string;
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  completedAt: Date | null;
  timeSpentSec: number;
  confidenceScore: number | null;
  quizBestScore: number | null;
}

export interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  totalLessons: number;
  completedLessons: number;
  completionPercent: number;
  isLocked: boolean;
  averageConfidence: number | null;
}

export interface PhaseProgress {
  phaseId: string;
  phaseName: string;
  totalLessons: number;
  completedLessons: number;
  completionPercent: number;
  modules: ModuleProgress[];
}

// ─── Quiz Types ───

export interface Quiz {
  id: string;
  lessonId: string;
  questions: Question[];
}

export interface Question {
  id: string;
  questionText: string;
  questionType: "multiple_choice" | "true_false" | "fill_blank";
  options: string[];
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
  order: number;
}

export interface QuizAttemptResult {
  score: number;
  xpEarned: number;
  answers: Record<string, string>;
  correctCount: number;
  totalQuestions: number;
}

// ─── Gamification Types ───

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  graceDaysUsed: number;
  graceDaysMax: number;
  totalXp: number;
  level: number;
}

export interface AchievementData {
  id: string;
  achievementId: string;
  earnedAt: Date;
  notified: boolean;
}

// ─── Settings Types ───

export interface UserSettingsData {
  dailyGoalMinutes: number;
  weekendLearning: boolean;
  reminderTime: string | null;
  reminderEnabled: boolean;
  preferredMode: string;
  commuteStartTime: string;
  commuteEndTime: string;
  eveningStartTime: string;
  eveningEndTime: string;
  autoPlayAudio: boolean;
  playbackSpeed: number;
  overwhelmedMode: boolean;
  overwhelmedUntil: Date | null;
  reducedGoalMinutes: number;
  notebookLmConfigured: boolean;
}

// ─── Adaptive Engine Types ───

export interface AdaptiveRecommendation {
  mode: string;
  sessionLengthMinutes: number;
  reason: string;
  greeting: string;
}
