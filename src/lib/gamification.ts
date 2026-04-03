import { XP_TABLE, LEVELS, ACHIEVEMENTS } from "./constants";

// ─── XP Calculation ───

export function calculateQuizXp(scorePercent: number): number {
  const baseXp = Math.floor(scorePercent / 10) * XP_TABLE.QUIZ_PER_10_PERCENT;
  const bonus = scorePercent === 100 ? XP_TABLE.PERFECT_QUIZ_BONUS : 0;
  return baseXp + bonus;
}

export function calculateLessonXp(contentType: string): number {
  return contentType === "audio" ? XP_TABLE.AUDIO_LESSON : XP_TABLE.LESSON_COMPLETE;
}

// ─── Level Calculation ───

export function getLevelFromXp(totalXp: number): (typeof LEVELS)[number] {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xpRequired) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getXpToNextLevel(totalXp: number): { current: number; needed: number; progress: number } {
  const currentLevel = getLevelFromXp(totalXp);
  const currentLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level);
  const nextLevel = LEVELS[currentLevelIndex + 1];

  if (!nextLevel) {
    return { current: totalXp, needed: totalXp, progress: 1 };
  }

  const xpInLevel = totalXp - currentLevel.xpRequired;
  const xpForLevel = nextLevel.xpRequired - currentLevel.xpRequired;

  return {
    current: xpInLevel,
    needed: xpForLevel,
    progress: xpInLevel / xpForLevel,
  };
}

// ─── Streak Management ───

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // ISO date "YYYY-MM-DD"
  graceDaysUsed: number;
  graceDaysMax: number;
  consecutiveDaysAfterGrace: number;
}

interface StreakUpdate extends StreakState {
  streakBroken: boolean;
  graceDayUsed: boolean;
  streakXp: number;
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T00:00:00");
  const d2 = new Date(dateStr2 + "T00:00:00");
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export function updateStreak(state: StreakState): StreakUpdate {
  const today = toDateString(new Date());
  const result: StreakUpdate = {
    ...state,
    streakBroken: false,
    graceDayUsed: false,
    streakXp: 0,
  };

  if (!state.lastActiveDate) {
    // First ever activity
    result.currentStreak = 1;
    result.longestStreak = Math.max(result.longestStreak, 1);
    result.lastActiveDate = today;
    result.streakXp = XP_TABLE.DAILY_STREAK;
    return result;
  }

  if (state.lastActiveDate === today) {
    // Already active today — no streak change
    return result;
  }

  const daysSinceLast = daysBetween(state.lastActiveDate, today);

  if (daysSinceLast === 1) {
    // Consecutive day
    result.currentStreak = state.currentStreak + 1;
    result.lastActiveDate = today;
    result.streakXp = XP_TABLE.DAILY_STREAK;
    // Track consecutive days after grace
    result.consecutiveDaysAfterGrace = state.consecutiveDaysAfterGrace + 1;
    // Reset grace days used after 2 consecutive days
    if (result.consecutiveDaysAfterGrace >= 2) {
      result.graceDaysUsed = 0;
      result.consecutiveDaysAfterGrace = 0;
    }
  } else if (daysSinceLast === 2 && state.graceDaysUsed < state.graceDaysMax) {
    // Missed exactly 1 day — use grace day
    result.currentStreak = state.currentStreak + 1;
    result.lastActiveDate = today;
    result.graceDaysUsed = state.graceDaysUsed + 1;
    result.graceDayUsed = true;
    result.consecutiveDaysAfterGrace = 0;
    result.streakXp = XP_TABLE.DAILY_STREAK;
  } else {
    // Streak broken
    result.currentStreak = 1;
    result.lastActiveDate = today;
    result.streakBroken = true;
    result.graceDaysUsed = 0;
    result.consecutiveDaysAfterGrace = 0;
    result.streakXp = XP_TABLE.DAILY_STREAK;
  }

  // Update longest streak
  result.longestStreak = Math.max(result.longestStreak, result.currentStreak);

  return result;
}

// ─── Achievement Checking ───

interface AchievementContext {
  lessonsCompleted: number;
  quizzesCompleted: number;
  perfectQuizzes: number;
  currentStreak: number;
  quickWinsCompleted: number;
  reviewsCompleted: number;
  modulesCompleted: string[];
  phasesCompleted: string[];
  sessionHour: number;
  sessionDurationMin: number;
  graceDayUsed: boolean;
  existingAchievements: string[];
}

export function checkAchievements(ctx: AchievementContext): string[] {
  const newAchievements: string[] = [];
  const earned = new Set(ctx.existingAchievements);

  function check(id: string, condition: boolean) {
    if (!earned.has(id) && condition) {
      newAchievements.push(id);
    }
  }

  // Effort
  check("first_lesson", ctx.lessonsCompleted >= 1);
  check("streak_3", ctx.currentStreak >= 3);
  check("streak_7", ctx.currentStreak >= 7);
  check("streak_14", ctx.currentStreak >= 14);
  check("streak_30", ctx.currentStreak >= 30);

  // Mastery
  check("first_quiz", ctx.quizzesCompleted >= 1);
  check("perfect_quiz", ctx.perfectQuizzes >= 1);
  check("module_complete", ctx.modulesCompleted.length >= 1);
  check("phase_complete", ctx.phasesCompleted.length >= 1);
  check("all_foundations", ctx.phasesCompleted.includes("phase-1"));
  check("protium_expert", ctx.phasesCompleted.includes("phase-4"));

  // Time
  check("early_bird", ctx.sessionHour < 7);
  check("night_owl", ctx.sessionHour >= 22);
  check("speed_demon", ctx.sessionDurationMin > 0 && ctx.sessionDurationMin < 5);

  // Empathy
  check("parent_hero", ctx.quickWinsCompleted >= 10);
  check("comeback_kid", ctx.graceDayUsed);
  check("review_master", ctx.reviewsCompleted >= 50);

  return newAchievements;
}

export function getAchievementDef(id: string) {
  return ACHIEVEMENTS.find(a => a.id === id);
}
