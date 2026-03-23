"use client";

import Image from "next/image";
import { useMemo } from "react";

import { useRecorder } from "@/features/recording/recorder";

type RecordingButtonProps = {
  onStop?: (audioBlob: Blob | null) => Promise<void> | void;
  disabled?: boolean;
};

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function RecordingButton({
  disabled = false,
  onStop,
}: RecordingButtonProps) {
  const { elapsedSeconds, startOrStop, state } = useRecorder({ onStop });
  const buttonLabel = useMemo(() => {
    if (state === "recording") {
      return "Stop retelling";
    }

    if (state === "processing") {
      return "Processing retelling";
    }

    if (state === "error") {
      return "Reset recorder";
    }

    return "Start retelling";
  }, [state]);

  return (
    <button
      type="button"
      aria-label={buttonLabel}
      className="absolute bottom-3 left-1/2 z-10 h-20 w-20 -translate-x-1/2 rounded-full bg-transparent disabled:cursor-not-allowed"
      disabled={disabled || state === "processing"}
      onClick={() => {
        if (disabled) {
          return;
        }
        void startOrStop();
      }}
    >
      <span
        className={[
          "absolute inset-0 rounded-full transition",
          disabled
            ? "bg-[#d9d0c7]/30"
            : state === "recording"
              ? "bg-[#e07b54]/25"
              : "bg-[#e07b54]/15",
        ].join(" ")}
      />
      <span
        className={[
          "absolute inset-[8px] rounded-full border border-[#e7ded4] bg-[#fff4ec] shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition",
          disabled ? "border-[#e5ddd4] bg-[#f4efe9]" : "",
          state === "processing" ? "scale-95 opacity-85" : "",
        ].join(" ")}
      />
      <span
        className={[
          "absolute inset-[18px] rounded-full transition",
          disabled
            ? "bg-[#d7cec4]"
            : state === "error"
              ? "bg-[#c25b34]"
              : state === "recording"
                ? "bg-[#d86f48]"
                : "bg-[#eeded0]",
          state === "recording" ? "scale-105 shadow-[0_0_18px_rgba(224,123,84,0.4)]" : "",
          state === "processing" ? "animate-pulse" : "",
        ].join(" ")}
      />
      <span
        className={[
          "absolute inset-0 flex items-center justify-center text-sm font-semibold",
          disabled ? "text-[#6f675f]" : state === "recording" ? "text-white" : "text-[#c25b34]",
        ].join(" ")}
      >
        {state === "recording" ? (
          formatElapsed(elapsedSeconds)
        ) : (
          <Image
            alt=""
            aria-hidden="true"
            className={state === "processing" ? "opacity-70" : ""}
            data-testid="recording-button-icon"
            height={22}
            src="/recorder.svg"
            style={{
              filter: disabled
                ? "brightness(0) saturate(100%) invert(57%) sepia(10%) saturate(294%) hue-rotate(342deg) brightness(93%) contrast(85%)"
                : state === "error"
                  ? "brightness(0) saturate(100%) invert(40%) sepia(48%) saturate(1296%) hue-rotate(340deg) brightness(94%) contrast(91%)"
                  : "brightness(0) saturate(100%) invert(48%) sepia(54%) saturate(977%) hue-rotate(331deg) brightness(95%) contrast(92%)",
            }}
            width={22}
          />
        )}
      </span>
    </button>
  );
}
