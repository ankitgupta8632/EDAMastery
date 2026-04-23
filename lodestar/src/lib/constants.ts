export const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID ?? "default-user";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMS = 1536;

export const CLAUDE_MODEL = "claude-sonnet-4-6";

export const SIM_THRESHOLD_CLUSTER = 0.78;
export const SIM_THRESHOLD_RELATED = 0.70;

export const FEED_DEFAULT_MINUTES = 60;
export const FEED_INTERLEAVE_PATTERN = ["deep", "deep", "light", "deep", "serendipity", "light"] as const;

export const GOAL_CATEGORIES = [
  { id: "career", label: "Career", emoji: "\u{1F9ED}" },
  { id: "health", label: "Health", emoji: "\u{1F331}" },
  { id: "family", label: "Family", emoji: "\u{1F3E1}" },
  { id: "curiosity", label: "Curiosity", emoji: "\u{2728}" },
  { id: "wealth", label: "Wealth", emoji: "\u{1F4C8}" },
  { id: "craft", label: "Craft", emoji: "\u{1F6E0}" },
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number]["id"];

export const VIBE_DEEP = "deep";
export const VIBE_LIGHT = "light";
export type Vibe = typeof VIBE_DEEP | typeof VIBE_LIGHT;

export const FRICTION_BREAK_MINUTES = [30, 60, 90] as const;
