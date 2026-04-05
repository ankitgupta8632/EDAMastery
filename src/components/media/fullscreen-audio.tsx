"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Minimize2,
} from "lucide-react";
import { SeekBar } from "@/components/media/seekbar";
import type { TranscriptSegment } from "@/lib/transcript-utils";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

interface FullscreenAudioProps {
  src: string;
  segments: TranscriptSegment[];
  lessonTitle: string;
  onClose: () => void;
  initialTime?: number;
  initialPlaying?: boolean;
}

export function FullscreenAudio({
  src,
  segments,
  lessonTitle,
  onClose,
  initialTime = 0,
  initialPlaying = false,
}: FullscreenAudioProps): React.JSX.Element {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(initialPlaying);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  // Set initial time when audio loads
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && initialTime > 0) {
      audio.currentTime = initialTime;
    }
  }, [initialTime]);

  // Auto-play if was playing
  useEffect(() => {
    if (initialPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [initialPlaying]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const activeSegment = useMemo(() => {
    const current = segments.find(
      (seg) => seg.startTime <= currentTime && seg.endTime >= currentTime
    );
    if (current) return current;
    const past = segments.filter((seg) => seg.endTime <= currentTime);
    return past.length > 0 ? past[past.length - 1] : null;
  }, [segments, currentTime]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(speed);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col bg-[#0a0a0a]"
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setPlaying(false)}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2 flex-shrink-0">
        <div className="flex-1">
          <p className="text-[12px] uppercase tracking-widest text-white/30 font-medium">
            Audio Overview
          </p>
          <p className="text-[14px] text-white/60 mt-0.5 line-clamp-1">
            {lessonTitle}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/50 hover:text-white transition-colors"
        >
          <Minimize2 className="h-5 w-5" />
        </button>
      </div>

      {/* Caption area — centered, takes up most of the screen */}
      <div className="flex-1 flex items-center justify-center px-8 py-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeSegment ? (
            <motion.p
              key={activeSegment.startTime}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center text-[28px] sm:text-[36px] md:text-[42px] leading-[1.4] font-semibold text-white/90 max-w-2xl"
            >
              {activeSegment.text}
            </motion.p>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-[22px] text-white/20 font-medium">
                {playing ? "Listening..." : "Press play to start"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls at bottom */}
      <div className="flex-shrink-0 px-6 pb-8 pt-4 space-y-4">
        {/* Seek bar */}
        <SeekBar
          currentTime={currentTime}
          duration={duration}
          onSeek={(time) => {
            if (audioRef.current) audioRef.current.currentTime = time;
          }}
        />

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={cycleSpeed}
            className="rounded-full bg-white/[0.06] px-4 py-1.5 text-[13px] font-semibold text-white/50 hover:bg-white/[0.1] transition-colors active:scale-[0.95]"
          >
            {speed}x
          </button>

          <button
            onClick={() => skip(-15)}
            className="text-white/40 hover:text-white/70 transition-colors active:scale-[0.9]"
          >
            <SkipBack className="h-6 w-6" />
          </button>

          <button
            onClick={togglePlay}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0a0a0a] active:scale-[0.92] transition-transform"
          >
            {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </button>

          <button
            onClick={() => skip(15)}
            className="text-white/40 hover:text-white/70 transition-colors active:scale-[0.9]"
          >
            <SkipForward className="h-6 w-6" />
          </button>

          <button
            onClick={handleClose}
            className="rounded-full bg-white/[0.06] p-2 text-white/40 hover:text-white/70 transition-colors active:scale-[0.95]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
