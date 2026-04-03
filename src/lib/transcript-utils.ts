/**
 * WebVTT transcript parsing and querying utilities.
 * Used by the interactive podcast feature to extract context
 * around the current playback position.
 */

export interface TranscriptSegment {
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
}

/**
 * Convert VTT timestamp "HH:MM:SS.mmm" or "MM:SS.mmm" to seconds.
 */
export function vttTimeToSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return parseInt(m) * 60 + parseFloat(s);
  }
  return parseFloat(timeStr) || 0;
}

/**
 * Parse a WebVTT string into transcript segments.
 *
 * Handles:
 * - Standard VTT with "HH:MM:SS.mmm --> HH:MM:SS.mmm" timestamps
 * - SRT format with "HH:MM:SS,mmm --> HH:MM:SS,mmm" timestamps
 * - Plain text (returns single segment covering 0 to Infinity)
 */
export function parseVTT(vttContent: string): TranscriptSegment[] {
  if (!vttContent || !vttContent.trim()) return [];

  const segments: TranscriptSegment[] = [];

  // Check if it's VTT/SRT format (has timestamp arrows)
  if (vttContent.includes("-->")) {
    // Normalize SRT commas to VTT dots
    const normalized = vttContent.replace(/(\d),(\d)/g, "$1.$2");

    // Split into blocks (separated by blank lines)
    const blocks = normalized.split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split("\n");

      // Find the timestamp line
      const timestampIdx = lines.findIndex((l) => l.includes("-->"));
      if (timestampIdx === -1) continue;

      const timestampLine = lines[timestampIdx];
      const [startStr, endStr] = timestampLine.split("-->").map((s) => s.trim());

      if (!startStr || !endStr) continue;

      const startTime = vttTimeToSeconds(startStr);
      const endTime = vttTimeToSeconds(endStr);

      // Text is everything after the timestamp line
      const text = lines
        .slice(timestampIdx + 1)
        .join(" ")
        .replace(/<[^>]*>/g, "") // strip VTT tags like <v Speaker>
        .trim();

      if (text) {
        segments.push({ startTime, endTime, text });
      }
    }
  } else {
    // Plain text — treat as a single segment
    segments.push({
      startTime: 0,
      endTime: Infinity,
      text: vttContent.trim(),
    });
  }

  return segments;
}

/**
 * Get transcript text within a time window around the current position.
 * Returns the concatenated text of all segments that overlap with
 * [currentTime - windowSeconds, currentTime].
 */
export function getTranscriptContext(
  segments: TranscriptSegment[],
  currentTime: number,
  windowSeconds: number = 90
): string {
  const windowStart = Math.max(0, currentTime - windowSeconds);
  const windowEnd = currentTime;

  const relevantSegments = segments.filter(
    (seg) => seg.endTime >= windowStart && seg.startTime <= windowEnd
  );

  return relevantSegments.map((seg) => seg.text).join(" ");
}

/**
 * Format seconds as "MM:SS" for display.
 */
export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Get the current topic being discussed at a given timestamp.
 * Returns the most recent segment's text (useful for short context).
 */
export function getCurrentTopic(
  segments: TranscriptSegment[],
  currentTime: number
): string {
  // Find the segment that contains the current time
  const current = segments.find(
    (seg) => seg.startTime <= currentTime && seg.endTime >= currentTime
  );
  if (current) return current.text;

  // Fall back to the most recent segment before current time
  const past = segments.filter((seg) => seg.endTime <= currentTime);
  return past.length > 0 ? past[past.length - 1].text : "";
}
