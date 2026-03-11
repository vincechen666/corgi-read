"use client";

import { useEffect, useRef, useState } from "react";

import type {
  RecordingEvent,
  RecordingStatus,
} from "@/features/recording/recorder-schema";

export function nextRecordingState(
  currentState: RecordingStatus,
  event: RecordingEvent,
): RecordingStatus {
  if (event === "reset") {
    return "idle";
  }

  if (currentState === "idle" && event === "primary-click") {
    return "recording";
  }

  if (currentState === "recording" && event === "primary-click") {
    return "processing";
  }

  if (currentState === "processing" && event === "processing-complete") {
    return "idle";
  }

  if (currentState === "processing" && event === "processing-failed") {
    return "error";
  }

  return currentState;
}

type UseRecorderOptions = {
  onStop?: (audioBlob: Blob | null) => Promise<void> | void;
};

const preferredRecordingMimeTypes = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

export function resolveRecordingMimeType(
  mediaRecorderCtor: typeof MediaRecorder,
) {
  for (const mimeType of preferredRecordingMimeTypes) {
    if (mediaRecorderCtor.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return "";
}

export function useRecorder(options: UseRecorderOptions = {}) {
  const [state, setState] = useState<RecordingStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (state !== "recording") {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state]);

  async function startRecording() {
    setState(nextRecordingState("idle", "primary-click"));
    setElapsedSeconds(0);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = resolveRecordingMimeType(MediaRecorder);
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch {
      setState("error");
    }
  }

  async function stopRecording() {
    setState(nextRecordingState("recording", "primary-click"));

    const recorder = mediaRecorderRef.current;
    const blob = recorder
      ? await new Promise<Blob | null>((resolve) => {
          recorder.onstop = () => {
            const audioBlob =
              chunksRef.current.length > 0
                ? new Blob(chunksRef.current, {
                    type:
                      recorder.mimeType ||
                      chunksRef.current[0]?.type ||
                      "audio/webm",
                  })
                : null;
            resolve(audioBlob);
          };
          recorder.stop();
        })
      : null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];

    try {
      if (options.onStop) {
        await options.onStop(blob);
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
      }

      setState(nextRecordingState("processing", "processing-complete"));
      setElapsedSeconds(0);
    } catch {
      setState(nextRecordingState("processing", "processing-failed"));
    }
  }

  async function startOrStop() {
    if (state === "idle") {
      await startRecording();
      return;
    }

    if (state === "recording") {
      await stopRecording();
      return;
    }

    if (state === "error") {
      setState("idle");
      setElapsedSeconds(0);
    }
  }

  return {
    state,
    elapsedSeconds,
    startOrStop,
  };
}
