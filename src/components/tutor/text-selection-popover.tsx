"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, MessageCircleQuestion, X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VoiceInputButton } from "@/components/tutor/voice-input-button";

interface TextSelectionPopoverProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAskAbout: (selectedText: string) => void;
  lessonId: string;
}

interface PopoverState {
  visible: boolean;
  selectedText: string;
  x: number;
  y: number;
  above: boolean;
}

export function TextSelectionPopover({
  containerRef,
  onAskAbout,
  lessonId,
}: TextSelectionPopoverProps): React.JSX.Element | null {
  const [popover, setPopover] = useState<PopoverState>({
    visible: false,
    selectedText: "",
    x: 0,
    y: 0,
    above: true,
  });
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);

  const dismiss = useCallback(() => {
    setPopover({ visible: false, selectedText: "", x: 0, y: 0, above: true });
    setExplanation(null);
    setExplaining(false);
    setFollowUp("");
  }, []);

  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (text.length < 3) return;

    const container = containerRef.current;
    if (!container) return;
    const anchorNode = selection.anchorNode;
    if (!anchorNode || !container.contains(anchorNode)) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const popoverWidth = 280;
    let x = rect.left + rect.width / 2 - popoverWidth / 2;
    x = Math.max(8, Math.min(viewportWidth - popoverWidth - 8, x));

    const above = rect.top > 120;
    // When above: position bottom of popover at selection top
    // When below: position top of popover at selection bottom
    const y = above ? rect.top - 8 : rect.bottom + 8;

    scrollYRef.current = window.scrollY;
    setPopover({ visible: true, selectedText: text, x, y, above });
    setExplanation(null);
    setExplaining(false);
    setFollowUp("");
  }, [containerRef]);

  // Listen for selection events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseUp = () => {
      setTimeout(handleSelectionChange, 50);
    };

    const onTouchEnd = () => {
      setTimeout(handleSelectionChange, 150);
    };

    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("touchend", onTouchEnd);

    return () => {
      container.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, [containerRef, handleSelectionChange]);

  // Dismiss on click outside or significant scroll (>80px)
  useEffect(() => {
    if (!popover.visible) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        dismiss();
      }
    };

    const handleScroll = () => {
      if (Math.abs(window.scrollY - scrollYRef.current) > 80) {
        dismiss();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      window.addEventListener("scroll", handleScroll, { passive: true });
    }, 200);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [popover.visible, dismiss]);

  const handleExplain = async () => {
    setExplaining(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Explain the following concept from this EDA lesson briefly (2-3 paragraphs max): "${popover.selectedText}"`,
          lessonId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setExplanation(data.answer);
      } else {
        setExplanation(data.error ?? "Could not explain. Try again.");
      }
    } catch {
      setExplanation("Network error. Try again.");
    } finally {
      setExplaining(false);
    }
  };

  const handleAskAbout = () => {
    onAskAbout(popover.selectedText);
    dismiss();
  };

  const handleFollowUpSubmit = () => {
    if (!followUp.trim()) return;
    onAskAbout(`${popover.selectedText}\n\nFollow-up: ${followUp.trim()}`);
    dismiss();
  };

  if (!popover.visible) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-[60] w-[280px] rounded-2xl bg-[#1a1a1a] border border-white/[0.08] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: popover.x,
        top: popover.above ? undefined : popover.y,
        bottom: popover.above ? `calc(100vh - ${popover.y}px)` : undefined,
      }}
    >
      {/* Selected text preview */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[12px] text-white/50 line-clamp-2 italic">
          &ldquo;{popover.selectedText.slice(0, 120)}{popover.selectedText.length > 120 ? "..." : ""}&rdquo;
        </p>
      </div>

      {/* Action buttons */}
      {!explanation && !explaining && (
        <div className="px-3 pb-3 flex items-center gap-2">
          <button
            onClick={handleExplain}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-[12px] font-medium text-white active:scale-[0.97] transition-transform"
          >
            <Sparkles className="h-3 w-3" />
            Explain this
          </button>
          <button
            onClick={handleAskAbout}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-[12px] font-medium text-white/70 active:scale-[0.97] transition-transform"
          >
            <MessageCircleQuestion className="h-3 w-3" />
            Ask Claude
          </button>
        </div>
      )}

      {/* Loading */}
      {explaining && (
        <div className="px-4 pb-3 flex items-center gap-2 text-white/50 text-[13px]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Explaining...
        </div>
      )}

      {/* Explanation result */}
      {explanation && (
        <div className="border-t border-white/[0.06]">
          <div className="px-4 py-3 max-h-[40vh] overflow-y-auto">
            <div className="prose prose-sm prose-invert max-w-none text-[13px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {explanation}
              </ReactMarkdown>
            </div>
          </div>

          {/* Follow-up input */}
          <div className="border-t border-white/[0.06] px-3 py-2 flex items-center gap-1.5">
            <input
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFollowUpSubmit(); }}
              placeholder="Follow-up..."
              className="flex-1 bg-transparent text-[12px] text-white/70 placeholder:text-white/30 outline-none"
            />
            <VoiceInputButton
              onTranscribed={(text) => setFollowUp((prev) => (prev ? `${prev} ${text}` : text))}
              className="h-7 w-7"
            />
            <button
              onClick={handleFollowUpSubmit}
              disabled={!followUp.trim()}
              className="text-green-400 disabled:text-white/20"
            >
              <MessageCircleQuestion className="h-3.5 w-3.5" />
            </button>
            <button onClick={dismiss} className="text-white/30 hover:text-white/60 ml-1">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
