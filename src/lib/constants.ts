// XP rewards for different activities
export const XP_TABLE = {
  LESSON_COMPLETE: 50,
  AUDIO_LESSON: 40,
  QUIZ_PER_10_PERCENT: 5, // 5 XP per 10% score = max 50
  PERFECT_QUIZ_BONUS: 25,
  REVIEW_ITEM: 20,
  DAILY_STREAK: 10,
  QUICK_WIN: 15,
} as const;

// Level thresholds (XP required to reach each level)
export const LEVELS = [
  { level: 1, name: "Novice", xpRequired: 0, icon: "🌱" },
  { level: 2, name: "Apprentice", xpRequired: 500, icon: "📘" },
  { level: 3, name: "Practitioner", xpRequired: 1500, icon: "⚡" },
  { level: 4, name: "Expert", xpRequired: 4000, icon: "🎯" },
  { level: 5, name: "Master", xpRequired: 8000, icon: "👑" },
] as const;

// Achievement definitions
export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "effort" | "mastery" | "time" | "empathy";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Effort achievements
  { id: "first_lesson", name: "First Step", description: "Complete your first lesson", icon: "🎉", category: "effort" },
  { id: "streak_3", name: "Getting Started", description: "Maintain a 3-day streak", icon: "🔥", category: "effort" },
  { id: "streak_7", name: "Week Warrior", description: "Maintain a 7-day streak", icon: "💪", category: "effort" },
  { id: "streak_14", name: "Fortnight Force", description: "Maintain a 14-day streak", icon: "⚡", category: "effort" },
  { id: "streak_30", name: "Monthly Master", description: "Maintain a 30-day streak", icon: "🏆", category: "effort" },
  // Mastery achievements
  { id: "first_quiz", name: "Quiz Taker", description: "Complete your first quiz", icon: "📝", category: "mastery" },
  { id: "perfect_quiz", name: "Perfect Score", description: "Score 100% on any quiz", icon: "💯", category: "mastery" },
  { id: "module_complete", name: "Module Master", description: "Complete an entire module", icon: "📦", category: "mastery" },
  { id: "phase_complete", name: "Phase Champion", description: "Complete an entire phase", icon: "🏅", category: "mastery" },
  { id: "all_foundations", name: "Solid Foundation", description: "Complete all Phase 1 modules", icon: "🧱", category: "mastery" },
  { id: "protium_expert", name: "Protium Pro", description: "Complete all Phase 4 modules", icon: "🚀", category: "mastery" },
  // Time achievements
  { id: "early_bird", name: "Early Bird", description: "Complete a lesson before 7 AM", icon: "🌅", category: "time" },
  { id: "night_owl", name: "Night Owl", description: "Complete a lesson after 10 PM", icon: "🦉", category: "time" },
  { id: "speed_demon", name: "Speed Demon", description: "Complete a lesson in under 5 minutes", icon: "⚡", category: "time" },
  // Empathy achievements
  { id: "parent_hero", name: "Parent Hero", description: "Complete 10 Quick Win sessions", icon: "🦸", category: "empathy" },
  { id: "comeback_kid", name: "Comeback Kid", description: "Resume learning after using a grace day", icon: "💖", category: "empathy" },
  { id: "review_master", name: "Review Master", description: "Complete 50 review items", icon: "🧠", category: "empathy" },
];

// Learning modes
export const LEARNING_MODES = {
  commute: { label: "Commute Mode", description: "Audio-first learning for your commute", icon: "🎧", defaultMinutes: 15 },
  focus: { label: "Focus Mode", description: "Visual deep-dive with full attention", icon: "🎯", defaultMinutes: 20 },
  quick_win: { label: "Quick Win", description: "2-minute micro-review — every bit counts", icon: "⚡", defaultMinutes: 2 },
  baby_napping: { label: "Baby Napping", description: "Focused session while baby sleeps", icon: "😴", defaultMinutes: 15 },
  review: { label: "Review Mode", description: "Spaced repetition review session", icon: "🔄", defaultMinutes: 10 },
} as const;

export type LearningMode = keyof typeof LEARNING_MODES;

// Phase colors for UI
export const PHASE_COLORS = {
  "phase-1": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", accent: "bg-indigo-500" },
  "phase-2": { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", accent: "bg-violet-500" },
  "phase-3": { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200", accent: "bg-pink-500" },
  "phase-4": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", accent: "bg-amber-500" },
} as const;

// Content status workflow
export const CONTENT_STATUSES = ["draft", "generated", "reviewed", "published"] as const;
export type ContentStatus = typeof CONTENT_STATUSES[number];

// Gentle messages (never guilt-tripping)
export const GENTLE_MESSAGES = {
  welcome_back: [
    "Welcome back! Every minute counts. 💛",
    "Great to see you! Ready for a quick lesson?",
    "You're here — that's what matters. Let's learn something!",
  ],
  streak_preserved: [
    "Life happens! Your streak is safe with a grace day. 🛡️",
    "Grace day used — your streak lives on! No stress.",
  ],
  streak_broken: [
    "Welcome back! Let's start a fresh streak together. 🌱",
    "New streak, new beginning. You've got this!",
  ],
  overwhelmed: [
    "Taking it easy is smart, not weak. Reduced goals for 3 days. 💛",
    "Rest and recovery are part of learning. See you when you're ready.",
  ],
  quick_win: [
    "Even 2 minutes makes you better than yesterday!",
    "A tiny step forward is still a step. Let's go!",
  ],
  celebration: [
    "You did it! 🎉",
    "Amazing work! Keep it up! ✨",
    "Another step closer to EDA mastery! 🚀",
  ],
} as const;
