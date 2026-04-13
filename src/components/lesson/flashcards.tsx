"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardsProps {
  flashcardsJson: string;
}

export function Flashcards({ flashcardsJson }: FlashcardsProps): React.JSX.Element | null {
  let cards: Flashcard[];
  try {
    cards = JSON.parse(flashcardsJson);
  } catch {
    return null;
  }

  if (!cards || cards.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <RotateCcw className="h-3.5 w-3.5 text-white/40" />
        <span className="text-[12px] font-medium uppercase tracking-wider text-white/40">
          Flashcards
        </span>
        <span className="text-[11px] text-white/20">{cards.length} cards · tap to flip</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {cards.map((card, i) => (
          <FlashcardItem key={i} card={card} index={i} />
        ))}
      </div>
    </div>
  );
}

function FlashcardItem({ card, index }: { card: Flashcard; index: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="flex-shrink-0 w-[260px] h-[160px] snap-start cursor-pointer perspective-[800px]"
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-4 flex flex-col justify-between backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-[14px] font-medium text-white/80 leading-snug line-clamp-4">
            {card.front}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/20">{index + 1}</span>
            <span className="text-[10px] text-green-500/50">tap to reveal</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl bg-green-900/20 border border-green-800/30 p-4 flex flex-col justify-between"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="text-[13px] text-green-200/70 leading-snug line-clamp-5">
            {card.back}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-green-500/30">{index + 1}</span>
            <span className="text-[10px] text-green-500/50">tap to flip back</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
