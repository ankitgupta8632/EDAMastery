"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TranscriptSegment } from "@/lib/transcript-utils";

interface SyncedCaptionsProps {
  segments: TranscriptSegment[];
  currentTime: number;
  className?: string;
}

export function SyncedCaptions({ segments, currentTime, className }: SyncedCaptionsProps): React.JSX.Element | null {
  const activeSegment = useMemo(() => {
    // Find segment containing current time
    const current = segments.find(
      (seg) => seg.startTime <= currentTime && seg.endTime >= currentTime
    );
    if (current) return current;

    // Fall back to most recent segment before current time
    const past = segments.filter((seg) => seg.endTime <= currentTime);
    return past.length > 0 ? past[past.length - 1] : null;
  }, [segments, currentTime]);

  if (!activeSegment || segments.length === 0) return null;

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.p
          key={activeSegment.startTime}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl bg-white/[0.03] px-4 py-3 text-[14px] leading-relaxed text-white/70 text-center"
        >
          {activeSegment.text}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
