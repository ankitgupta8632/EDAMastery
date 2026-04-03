/**
 * SM-2 Spaced Repetition Algorithm
 * Based on the SuperMemo SM-2 algorithm by Piotr Wozniak
 *
 * Quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect, but recognized the answer
 * 2 - Incorrect, but the answer seemed easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct after hesitation
 * 5 - Perfect response
 */

interface ReviewState {
  easeFactor: number;
  interval: number; // days
  repetitions: number;
}

interface ReviewResult extends ReviewState {
  nextReview: Date;
}

export function calculateNextReview(
  state: ReviewState,
  quality: number
): ReviewResult {
  // Clamp quality to 0-5
  const q = Math.max(0, Math.min(5, quality));

  let { easeFactor, interval, repetitions } = state;

  if (q >= 3) {
    // Successful recall
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    // Failed recall — reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor (never below 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  );

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview,
  };
}

/**
 * Determine review quality from quiz score
 * Maps percentage score to SM-2 quality rating
 */
export function scoreToQuality(scorePercent: number): number {
  if (scorePercent >= 95) return 5;
  if (scorePercent >= 80) return 4;
  if (scorePercent >= 60) return 3;
  if (scorePercent >= 40) return 2;
  if (scorePercent >= 20) return 1;
  return 0;
}

/**
 * Get items due for review
 * Items are due when nextReview <= now
 */
export function isDueForReview(nextReview: Date): boolean {
  return new Date() >= nextReview;
}
