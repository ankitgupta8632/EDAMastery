"use client";

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircleQuestion,
  Send,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { VoiceInputButton } from "@/components/tutor/voice-input-button";

interface Message {
  role: "user" | "assistant";
  content: string;
  source?: "claude" | "notebooklm";
}

interface AskClaudeProps {
  lessonId: string;
  lessonTitle: string;
}

export interface AskClaudeHandle {
  openWithContext: (selectedText: string) => void;
}

export const AskClaude = forwardRef<AskClaudeHandle, AskClaudeProps>(
  function AskClaude({ lessonId, lessonTitle }, ref) {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [contextText, setContextText] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      openWithContext: (selectedText: string) => {
        setContextText(selectedText);
        setOpen(true);
      },
    }));

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [messages]);

    const handleVoiceTranscribed = useCallback((text: string) => {
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || loading) return;

      const question = input.trim();
      setInput("");

      // Build the API question with context if present
      const apiQuestion = contextText
        ? `The student highlighted this text: "${contextText}"\n\nTheir question: ${question}`
        : question;

      // Show user's visible question (without context prefix)
      setMessages((prev) => [...prev, { role: "user", content: question }]);
      setContextText(null);
      setLoading(true);

      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: apiQuestion, lessonId }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.answer, source: data.source },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: data.error ?? "Sorry, something went wrong. Try again?",
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Network error. Check your connection and try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    return (
      <>
        {/* Slide-up panel — opened only via openWithContext from inline explain */}
        <AnimatePresence>
          {open && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/50"
                onClick={() => { setOpen(false); setContextText(null); }}
              />

              {/* Panel */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-[60] flex h-[70vh] flex-col rounded-t-2xl bg-[#121212] border-t border-white/[0.06]"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-semibold text-white">
                      Ask about: {lessonTitle}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/40 hover:text-white"
                    onClick={() => { setOpen(false); setContextText(null); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Messages area */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
                >
                  {messages.length === 0 && !contextText && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-white/40">
                      <MessageCircleQuestion className="h-10 w-10" />
                      <div>
                        <p className="text-sm">Ask anything about this lesson.</p>
                        <p className="text-xs mt-1 italic">
                          &quot;What does setup time mean in practice?&quot;
                        </p>
                      </div>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={
                        msg.role === "user" ? "ml-8 text-right" : "mr-8"
                      }
                    >
                      {msg.role === "user" ? (
                        <div className="inline-block rounded-2xl bg-green-600 px-4 py-2 text-sm text-white text-left">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeHighlight]}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                          {msg.source && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-white/40 border-white/[0.06]"
                            >
                              {msg.source === "claude"
                                ? "Answered by Claude"
                                : "From course material"}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="mr-8">
                      <div className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm text-white/50">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>

                {/* Context chip */}
                {contextText && (
                  <div className="border-t border-white/[0.06] px-4 pt-2">
                    <div className="flex items-center gap-2 rounded-xl bg-green-900/20 border border-green-800/30 px-3 py-2">
                      <Sparkles className="h-3 w-3 text-green-400 flex-shrink-0" />
                      <p className="text-[12px] text-green-400/80 line-clamp-2 flex-1">
                        &ldquo;{contextText.slice(0, 150)}{contextText.length > 150 ? "..." : ""}&rdquo;
                      </p>
                      <button
                        onClick={() => setContextText(null)}
                        className="text-green-400/50 hover:text-green-400 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Input area */}
                <form
                  onSubmit={handleSubmit}
                  className="border-t border-white/[0.06] px-4 py-3 flex items-center gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={contextText ? "Ask about this selection..." : "Ask a question about this lesson..."}
                    className="flex-1"
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
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }
);
