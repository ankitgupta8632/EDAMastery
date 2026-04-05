"use client";

import { useState, useRef, useCallback } from "react";

interface UseVoiceInputOptions {
  onTranscribed: (text: string) => void;
  maxDurationMs?: number;
}

interface UseVoiceInputReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export function useVoiceInput({
  onTranscribed,
  maxDurationMs = 60_000,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const transcribe = useCallback(
    async (blob: Blob) => {
      setIsTranscribing(true);
      setError(null);
      try {
        const ext = blob.type.includes("mp4") ? "m4a" : "webm";
        const formData = new FormData();
        formData.append("audio", blob, `recording.${ext}`);

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.text) {
          onTranscribed(data.text);
        } else {
          setError(data.error ?? "Transcription failed");
        }
      } catch {
        setError("Network error during transcription");
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscribed]
  );

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Detect supported mime type (Safari uses mp4, Chrome uses webm)
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

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        cleanup();
        if (blob.size > 0) {
          transcribe(blob);
        }
      };

      recorder.start(1000); // collect data every second
      setIsRecording(true);

      // Auto-stop after max duration
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, maxDurationMs);
    } catch (err) {
      cleanup();
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Check your browser permissions.");
      } else {
        setError("Could not access microphone.");
      }
    }
  }, [cleanup, maxDurationMs, stopRecording, transcribe]);

  return { isRecording, isTranscribing, error, startRecording, stopRecording };
}
