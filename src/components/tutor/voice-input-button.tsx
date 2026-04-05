"use client";

import { useCallback, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { toast } from "sonner";

interface VoiceInputButtonProps {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputButton({
  onTranscribed,
  disabled,
  className,
}: VoiceInputButtonProps): React.JSX.Element {
  const { isRecording, isTranscribing, error, startRecording, stopRecording } =
    useVoiceInput({
      onTranscribed: useCallback(
        (text: string) => {
          onTranscribed(text);
          toast.success("Voice transcribed");
        },
        [onTranscribed]
      ),
    });

  // Show error as toast (only once per error change)
  const lastErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      toast.error(error);
      lastErrorRef.current = error;
    } else if (!error) {
      lastErrorRef.current = null;
    }
  }, [error]);

  const handleClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      disabled={disabled || isTranscribing}
      onClick={handleClick}
      className={`relative rounded-full flex-shrink-0 ${
        isRecording
          ? "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/50"
          : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
      } ${className ?? ""}`}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <>
          <MicOff className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
