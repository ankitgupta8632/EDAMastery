"use client";

import { useState, useRef, useEffect } from "react";
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

interface Message {
  role: "user" | "assistant";
  content: string;
  source?: "claude" | "notebooklm";
}

interface AskClaudeProps {
  lessonId: string;
  lessonTitle: string;
}

export function AskClaude({ lessonId, lessonTitle }: AskClaudeProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, lessonId }),
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
      {/* Floating trigger button */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="sm"
          className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg border-indigo-200 bg-white hover:bg-indigo-50 gap-2"
        >
          <MessageCircleQuestion className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-600">
            Ask Claude
          </span>
        </Button>
      )}

      {/* Slide-up panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 flex h-[70vh] flex-col rounded-t-2xl bg-white shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-slate-800">
                    Ask about: {lessonTitle}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Messages area */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-slate-400">
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
                      <div className="inline-block rounded-2xl bg-indigo-600 px-4 py-2 text-sm text-white text-left">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm prose prose-sm prose-slate max-w-none">
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
                            className="text-[10px] text-slate-400"
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
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Input area */}
              <form
                onSubmit={handleSubmit}
                className="border-t px-4 py-3 flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about this lesson..."
                  className="flex-1"
                  disabled={loading}
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || loading}
                  className="bg-indigo-600 hover:bg-indigo-700"
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
