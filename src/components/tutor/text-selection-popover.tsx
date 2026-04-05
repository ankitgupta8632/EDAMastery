"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MessageCircleQuestion, X, Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VoiceInputButton } from "@/components/tutor/voice-input-button";

interface TextSelectionPopoverProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAskAbout: (selectedText: string) => void;
  lessonId: string;
}

export function TextSelectionPopover({
  containerRef,
  onAskAbout,
  lessonId,
}: TextSelectionPopoverProps): React.JSX.Element {
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen for text selection via document selectionchange (most reliable cross-browser)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleSelectionChange = () => {
      // Debounce — selectionchange fires on every cursor move during drag
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;

        const text = selection.toString().trim();
        if (text.length < 3) return;

        const anchorNode = selection.anchorNode;
        if (!anchorNode || !container.contains(anchorNode)) return;

        setSelectedText(text);
        setExplanation(null);
        setExplaining(false);
        setFollowUp("");
      }, 300);
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [containerRef]);

  // Auto-scroll to bottom when explanation arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [explanation]);

  const dismiss = useCallback(() => {
    setSelectedText(null);
    setExplanation(null);
    setExplaining(false);
    setFollowUp("");
    // Clear the browser selection
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleExplain = async () => {
    if (!selectedText) return;
    setExplaining(true);
    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Explain the following concept from this EDA lesson briefly (2-3 paragraphs max): "${selectedText}"`,
          lessonId,
        }),
      });
      const data = await res.json();
      setExplanation(res.ok ? data.answer : (data.error ?? "Could not explain. Try again."));
    } catch {
      setExplanation("Network error. Try again.");
    } finally {
      setExplaining(false);
    }
  };

  const handleAskClaude = () => {
    if (!selectedText) return;
    onAskAbout(selectedText);
    dismiss();
  };

  const handleFollowUp = () => {
    if (!followUp.trim() || !selectedText) return;
    onAskAbout(`${selectedText}\n\nFollow-up: ${followUp.trim()}`);
    dismiss();
  };

  return (
    <AnimatePresence>
      {selectedText && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={dismiss}
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[70vh] flex-col rounded-t-2xl bg-[#121212] border-t border-white/[0.06]"
          >
            {/* Header with selected text */}
            <div className="flex-shrink-0 border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-500" />
                  <span className="text-[13px] font-semibold text-white">Selected Text</span>
                </div>
                <button
                  onClick={dismiss}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-white/40 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[13px] text-white/50 italic line-clamp-3">
                &ldquo;{selectedText.slice(0, 200)}{selectedText.length > 200 ? "..." : ""}&rdquo;
              </p>

              {/* Action buttons — always visible */}
              {!explanation && !explaining && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleExplain}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 py-2.5 text-[13px] font-medium text-white active:scale-[0.98] transition-transform"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Explain this
                  </button>
                  <button
                    onClick={handleAskClaude}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] py-2.5 text-[13px] font-medium text-white/70 active:scale-[0.98] transition-transform"
                  >
                    <MessageCircleQuestion className="h-3.5 w-3.5" />
                    Ask Claude
                  </button>
                </div>
              )}
            </div>

            {/* Loading */}
            {explaining && (
              <div className="flex items-center gap-2 px-5 py-6 text-white/50 text-[14px]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Explaining...
              </div>
            )}

            {/* Explanation content */}
            {explanation && (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
                  <div className="prose prose-sm prose-invert max-w-none
                    prose-p:text-[14px] prose-p:leading-[1.8] prose-p:text-white/70
                    prose-strong:text-white prose-strong:font-semibold
                    prose-code:bg-white/[0.06] prose-code:text-green-400 prose-code:px-1 prose-code:rounded">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {explanation}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Follow-up input */}
                <div className="flex-shrink-0 border-t border-white/[0.06] px-5 py-3 flex items-center gap-2">
                  <input
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleFollowUp(); }}
                    placeholder="Ask a follow-up..."
                    className="flex-1 bg-white/[0.04] rounded-full px-4 py-2.5 text-[13px] text-white/70 placeholder:text-white/30 outline-none border border-white/[0.06] focus:border-green-800/50"
                  />
                  <VoiceInputButton
                    onTranscribed={(text) => setFollowUp((prev) => (prev ? `${prev} ${text}` : text))}
                  />
                  <button
                    onClick={handleFollowUp}
                    disabled={!followUp.trim()}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
