import { type LearningMode, LEARNING_MODES } from "./constants";

interface UserPreferences {
  preferredMode: string;
  commuteStartTime: string;
  commuteEndTime: string;
  eveningStartTime: string;
  eveningEndTime: string;
  overwhelmedMode: boolean;
  overwhelmedUntil: Date | null;
  dailyGoalMinutes: number;
  reducedGoalMinutes: number;
  weekendLearning: boolean;
}

interface Recommendation {
  mode: LearningMode;
  sessionLengthMinutes: number;
  reason: string;
  greeting: string;
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

function isInTimeWindow(now: Date, startStr: string, endStr: string): boolean {
  const start = parseTime(startStr);
  const end = parseTime(endStr);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function isWeekend(now: Date): boolean {
  const day = now.getDay();
  return day === 0 || day === 6;
}

function getTimeGreeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 6) return "Burning the midnight oil? 🌙";
  if (hour < 9) return "Good morning! ☀️";
  if (hour < 12) return "Mid-morning learning! 📚";
  if (hour < 14) return "Lunch break learning? 🍽️";
  if (hour < 17) return "Afternoon session! 💻";
  if (hour < 20) return "Evening wind-down! 🌆";
  return "Night owl mode! 🦉";
}

export function getRecommendation(prefs: UserPreferences): Recommendation {
  const now = new Date();

  // Check if overwhelmed mode is active
  if (prefs.overwhelmedMode) {
    if (prefs.overwhelmedUntil && now > prefs.overwhelmedUntil) {
      // Overwhelmed period expired, but still recommend gently
    } else {
      return {
        mode: "quick_win",
        sessionLengthMinutes: prefs.reducedGoalMinutes,
        reason: "Taking it easy — reduced goals active",
        greeting: "No pressure today. Even a tiny step counts. 💛",
      };
    }
  }

  // Weekend check
  if (isWeekend(now) && !prefs.weekendLearning) {
    return {
      mode: "quick_win",
      sessionLengthMinutes: 2,
      reason: "It's the weekend — only if you want to!",
      greeting: "Weekend vibes! A quick review if you're in the mood. 🌿",
    };
  }

  // If user has explicit preference (not auto)
  if (prefs.preferredMode !== "auto") {
    const modeMap: Record<string, LearningMode> = {
      audio: "commute",
      visual: "focus",
      mixed: "focus",
    };
    const mode = modeMap[prefs.preferredMode] ?? "focus";
    return {
      mode,
      sessionLengthMinutes: prefs.dailyGoalMinutes,
      reason: `Your preferred mode: ${prefs.preferredMode}`,
      greeting: getTimeGreeting(now),
    };
  }

  // Auto mode: detect based on time of day
  if (isInTimeWindow(now, prefs.commuteStartTime, prefs.commuteEndTime)) {
    return {
      mode: "commute",
      sessionLengthMinutes: LEARNING_MODES.commute.defaultMinutes,
      reason: "Commute window detected — audio mode suggested",
      greeting: "Commute time! Pop in your earbuds. 🎧",
    };
  }

  if (isInTimeWindow(now, prefs.eveningStartTime, prefs.eveningEndTime)) {
    return {
      mode: "focus",
      sessionLengthMinutes: LEARNING_MODES.focus.defaultMinutes,
      reason: "Evening window — visual deep-dive mode",
      greeting: "Evening learning time! Let's dive deep. 🎯",
    };
  }

  // Work hours: suggest quick win
  const hour = now.getHours();
  if (hour >= 9 && hour < 18) {
    return {
      mode: "quick_win",
      sessionLengthMinutes: LEARNING_MODES.quick_win.defaultMinutes,
      reason: "During work hours — quick review only",
      greeting: "Quick break? Review one concept! ⚡",
    };
  }

  // Default: mixed focus mode
  return {
    mode: "focus",
    sessionLengthMinutes: prefs.dailyGoalMinutes,
    reason: "Free time detected — focus mode",
    greeting: getTimeGreeting(now),
  };
}
