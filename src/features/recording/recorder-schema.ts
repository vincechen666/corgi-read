export type RecordingStatus = "idle" | "recording" | "processing" | "error";

export type RecordingEvent =
  | "primary-click"
  | "processing-complete"
  | "processing-failed"
  | "reset";
