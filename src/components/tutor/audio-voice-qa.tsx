"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Loader2, Play, Volume2, Send, X } from "lucide-react";
import { formatTimestamp } from "@/lib/transcript-utils";

interface AudioVoiceQAProps {
  lessonId: string;
  lessonTitle: string;
  audioTimestamp: number;
  recentTranscript: string;
  onResume: () => void;
  onClose: () => void;
}

interface QAMessage {
  role: "user" | "host";
  text: string;
  audioUrl?: string;
}

export function AudioVoiceQA({
  lessonId,
  lessonTitle,
  audioTimestamp,
  recentTranscript,
  onResume,
  onClose,
}: AudioVoiceQAProps): React.JSX.Element {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingText, setPendingText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking, isSpeaking]);

  // Cleanup TTS audio and blob URLs on unmount
  useEffect(() => {
    return () => {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
      // Revoke all blob URLs
      messages.forEach((m) => {
        if (m.audioUrl) URL.revokeObjectURL(m.audioUrl);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanupRecording();

        if (blob.size === 0) return;

        // Transcribe
        setIsTranscribing(true);
        try {
          const ext = blob.type.includes("mp4") ? "m4a" : "webm";
          const formData = new FormData();
          formData.append("audio", blob, `recording.${ext}`);

          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          const data = await res.json();

          if (res.ok && data.text) {
            setPendingText(data.text);
          } else {
            setError(data.error ?? "Could not transcribe. Try again.");
          }
        } catch {
          setError("Network error. Try again.");
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      cleanupRecording();
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Check browser permissions.");
      } else {
        setError("Could not access microphone.");
      }
    }
  }, [cleanupRecording]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
  }, []);

  const sendQuestion = useCallback(async (questionText: string) => {
    if (!questionText.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: questionText }]);
    setPendingText("");
    setIsThinking(true);

    try {
      // Get text answer from podcast host
      const res = await fetch("/api/podcast/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          lessonId,
          audioTimestamp,
          recentTranscriptSegment: recentTranscript,
        }),
      });

      const data = await res.json();
      const answerText = res.ok ? data.answer : (data.error ?? "Sorry, I couldn't answer that.");

      // Generate TTS audio
      setIsThinking(false);
      setIsSpeaking(true);

      let audioUrl: string | undefined;
      try {
        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: answerText, voice: "nova" }),
        });

        if (ttsRes.ok) {
          const audioBlob = await ttsRes.blob();
          audioUrl = URL.createObjectURL(audioBlob);
        }
      } catch {
        // TTS failed — still show text response
      }

      setMessages((prev) => [
        ...prev,
        { role: "host", text: answerText, audioUrl },
      ]);

      // Auto-play the TTS response
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        ttsAudioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        audio.play().catch(() => setIsSpeaking(false));
      } else {
        setIsSpeaking(false);
      }
    } catch {
      setIsThinking(false);
      setIsSpeaking(false);
      setMessages((prev) => [
        ...prev,
        { role: "host", text: "Network error. Try again." },
      ]);
    }
  }, [lessonId, audioTimestamp, recentTranscript]);

  const handleClose = () => {
    // Stop any playing TTS
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    cleanupRecording();
    onClose();
  };

  const handleResume = () => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    cleanupRecording();
    onResume();
  };

  const playMessageAudio = (audioUrl: string) => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    ttsAudioRef.current = audio;
    setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);
    audio.play().catch(() => setIsSpeaking(false));
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed inset-x-0 bottom-0 z-[60] flex h-[80vh] flex-col rounded-t-3xl bg-[#121212] border-t border-white/[0.06]"
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-900/30">
                <Mic className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Ask the Hosts
                </p>
                <p className="text-xs text-white/40">
                  Paused at {formatTimestamp(audioTimestamp)} · {lessonTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResume}
                className="gap-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 text-sm flex items-center"
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </button>
              <button
                onClick={handleClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && !isRecording && !pendingText && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-white/40">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.04]">
                <Mic className="h-8 w-8 text-green-500/50" />
              </div>
              <div>
                <p className="text-[15px] font-medium text-white/50">
                  Ask about what you just heard
                </p>
                <p className="text-[13px] mt-1 text-white/30">
                  Tap the mic to speak, or type your question
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
                  {msg.text}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] mt-0.5">
                      <Volume2 className="h-3.5 w-3.5 text-green-500" />
                    </div>
                    <div className="rounded-2xl bg-white/[0.06] px-4 py-3 text-sm text-white/70 leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                  {msg.audioUrl && (
                    <button
                      onClick={() => playMessageAudio(msg.audioUrl!)}
                      className="ml-10 flex items-center gap-1.5 text-[12px] text-green-400/70 hover:text-green-400"
                    >
                      <Play className="h-3 w-3" />
                      Play response
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="mr-4">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06]">
                  <Volume2 className="h-3.5 w-3.5 text-green-500" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm text-white/50">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}

          {isSpeaking && !isThinking && (
            <div className="flex items-center gap-2 px-4 py-2 text-green-400/70 text-[13px]">
              <Volume2 className="h-4 w-4 animate-pulse" />
              Speaking...
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-2 text-[12px] text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-white/[0.06] px-5 py-4 space-y-3">
          {/* Pending transcribed text */}
          {pendingText && (
            <div className="flex items-center gap-2">
              <input
                value={pendingText}
                onChange={(e) => setPendingText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendQuestion(pendingText); }}
                className="flex-1 bg-white/[0.04] rounded-full px-4 py-2.5 text-[13px] text-white/70 placeholder:text-white/30 outline-none border border-white/[0.06] focus:border-green-800/50"
                autoFocus
              />
              <button
                onClick={() => sendQuestion(pendingText)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white active:scale-[0.95]"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Transcribing indicator */}
          {isTranscribing && (
            <div className="flex items-center justify-center gap-2 py-2 text-white/50 text-[13px]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Converting speech to text...
            </div>
          )}

          {/* Main mic button */}
          {!pendingText && !isTranscribing && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isThinking || isSpeaking}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition-all active:scale-[0.92] disabled:opacity-40 ${
                  isRecording
                    ? "bg-red-600 text-white animate-pulse"
                    : "bg-green-600 text-white hover:bg-green-500"
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </button>
              {isRecording && (
                <p className="text-[13px] text-red-400 animate-pulse">
                  Listening... tap to stop
                </p>
              )}
            </div>
          )}

          {/* Or type */}
          {!isRecording && !pendingText && !isTranscribing && (
            <TypeInput
              onSend={sendQuestion}
              disabled={isThinking || isSpeaking}
            />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* --- Inline text input ---------------------------------------------------- */

function TypeInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");

  return (
    <div className="flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim()) {
            onSend(text.trim());
            setText("");
          }
        }}
        placeholder="Or type your question..."
        disabled={disabled}
        className="flex-1 bg-white/[0.04] rounded-full px-4 py-2.5 text-[13px] text-white/70 placeholder:text-white/30 outline-none border border-white/[0.06] focus:border-green-800/50 disabled:opacity-40"
      />
      <button
        onClick={() => { if (text.trim()) { onSend(text.trim()); setText(""); } }}
        disabled={!text.trim() || disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white disabled:opacity-40 active:scale-[0.95]"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
