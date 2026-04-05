"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

export function SeekBar({ currentTime, duration, onSeek, className }: SeekBarProps): React.JSX.Element {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState<number | null>(null);

  const getPercentFromEvent = useCallback(
    (clientX: number): number => {
      const bar = barRef.current;
      if (!bar) return 0;
      const rect = bar.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (duration <= 0) return;
      e.preventDefault();
      const percent = getPercentFromEvent(e.clientX);
      setIsDragging(true);
      setDragPercent(percent);
      onSeek(percent * duration);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [duration, getPercentFromEvent, onSeek]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || duration <= 0) return;
      e.preventDefault();
      const percent = getPercentFromEvent(e.clientX);
      setDragPercent(percent);
      onSeek(percent * duration);
    },
    [isDragging, duration, getPercentFromEvent, onSeek]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const percent = getPercentFromEvent(e.clientX);
      onSeek(percent * duration);
      setIsDragging(false);
      setDragPercent(null);
    },
    [isDragging, duration, getPercentFromEvent, onSeek]
  );

  // Clean up drag state if component unmounts during drag
  useEffect(() => {
    return () => {
      setIsDragging(false);
      setDragPercent(null);
    };
  }, []);

  const displayPercent = isDragging && dragPercent !== null
    ? dragPercent * 100
    : duration > 0
      ? (currentTime / duration) * 100
      : 0;

  const formatTime = (s: number): string => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={className}>
      {/* Touch target area — taller than visible bar for easy mobile interaction */}
      <div
        ref={barRef}
        className="relative h-8 flex items-center cursor-pointer touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Visible track */}
        <div className="relative h-1.5 w-full rounded-full bg-white/[0.06]">
          {/* Filled portion */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-green-500 transition-[width] duration-75"
            style={{ width: `${displayPercent}%` }}
          />
          {/* Thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-md transition-[width,height] duration-150 ${
              isDragging ? "h-4 w-4" : "h-3 w-3"
            }`}
            style={{ left: `calc(${displayPercent}% - ${isDragging ? 8 : 6}px)` }}
          />
        </div>
      </div>

      {/* Time display */}
      <div className="flex justify-between text-[11px] text-white/30 tabular-nums -mt-1">
        <span>{formatTime(isDragging && dragPercent !== null ? dragPercent * duration : currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
