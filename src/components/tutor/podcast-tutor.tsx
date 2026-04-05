"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mic,
  Send,
  Loader2,
  Play,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatTimestamp } from "@/lib/transcript-utils";
import { VoiceInputButton } from "@/components/tutor/voice-input-button";

interface PodcastMessage {
  role: "user" | "host";
  content: string;
}

interface PodcastTutorProps {
  lessonId: string;
  lessonTitle: string;
  audioTimestamp: number;
  recentTranscript: string;
  onResume: () => void;
  onClose: () => void;
}

export function PodcastTutor({
  lessonId,
  lessonTitle,
  audioTimestamp,
  recentTranscript,
  onResume,
  onClose,
}: PodcastTutorProps) {
  const [messages, setMessages] = useState<PodcastMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleVoiceTranscribed = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/podcast/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          lessonId,
          audioTimestamp,
          recentTranscriptSegment: recentTranscript,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "host", content: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "host", content: data.error ?? "Sorry, I couldn't answer that. Try again?" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "host", content: "Network error -- check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-[60] flex h-[75vh] flex-col rounded-t-3xl bg-[#121212] border-t border-white/[0.06]"
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06]">
                <Mic className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Paused at {formatTimestamp(audioTimestamp)}
                </p>
                <p className="text-xs text-white/40">{lessonTitle}</p>
              </div>
            </div>
            <Button
              onClick={onResume}
              size="sm"
              className="gap-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white font-medium px-4"
            >
              <Play className="h-3.5 w-3.5" />
              Resume
            </Button>
          </div>

          {/* Collapsible transcript context */}
          {recentTranscript && (
            <div className="mt-3">
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {showTranscript ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                What was being discussed
              </button>
              <AnimatePresence>
                {showTranscript && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-2 text-xs text-white/50 italic bg-white/[0.06] rounded-lg p-3 line-clamp-4">
                      &ldquo;{recentTranscript.slice(0, 500)}&rdquo;
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-white/40">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06]">
                <MessageCircle className="h-7 w-7 text-green-500/70" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/50">
                  Ask about what you just heard
                </p>
                <p className="text-xs mt-1 text-white/40 italic max-w-xs">
                  &ldquo;Can you explain that timing concept again?&rdquo;
                </p>
                <p className="text-xs text-white/40 italic max-w-xs">
                  &ldquo;How does this relate to Protium compilation?&rdquo;
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={msg.role === "user" ? "ml-8 text-right" : "mr-4"}
            >
              {msg.role === "user" ? (
                <div className="inline-block rounded-2xl bg-green-600 px-4 py-2.5 text-sm text-white text-left">
                  {msg.content}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] mt-0.5">
                      <Mic className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <div className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="mr-4">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06]">
                  <Mic className="h-3.5 w-3.5 text-green-500" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm text-white/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          className="flex-shrink-0 border-t border-white/[0.06] px-5 py-4 flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the podcast hosts..."
            className="flex-1 rounded-full"
            disabled={loading}
            autoFocus
          />
          <VoiceInputButton
            onTranscribed={handleVoiceTranscribed}
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || loading}
            className="rounded-full bg-green-600 hover:bg-green-700 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
