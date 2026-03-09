"use client";

import { useMemo } from "react";

import { useRecorder } from "@/features/recording/recorder";

type RecordingButtonProps = {
  onStop?: (audioBlob: Blob | null) => Promise<void> | void;
};

function formatElapsed(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

export function RecordingButton({ onStop }: RecordingButtonProps) {
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
      className="absolute bottom-8 left-1/2 z-10 h-24 w-24 -translate-x-1/2 rounded-full bg-transparent disabled:cursor-wait"
      disabled={state === "processing"}
      onClick={() => {
        void startOrStop();
      }}
    >
      <span
        className={[
          "absolute inset-0 rounded-full transition",
          state === "recording" ? "bg-[#e07b54]/25" : "bg-[#e07b54]/15",
        ].join(" ")}
      />
      <span
        className={[
          "absolute inset-[10px] rounded-full border border-[#f2d1c3] bg-[#fff4ec] shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition",
          state === "processing" ? "scale-95 opacity-85" : "",
        ].join(" ")}
      />
      <span
        className={[
          "absolute inset-[22px] rounded-full transition",
          state === "error" ? "bg-[#c25b34]" : "bg-[#e07b54]",
          state === "recording" ? "scale-105 shadow-[0_0_18px_rgba(224,123,84,0.4)]" : "",
          state === "processing" ? "animate-pulse" : "",
        ].join(" ")}
      />
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
        {state === "recording" ? formatElapsed(elapsedSeconds) : "•"}
      </span>
    </button>
  );
}
