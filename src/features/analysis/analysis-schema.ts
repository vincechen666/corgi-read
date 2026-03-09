import { z } from "zod";

export const analysisResultSchema = z.object({
  transcript: z.string().min(1),
  corrected: z.string().min(1),
  grammar: z.string().min(1),
  nativeExpression: z.string().min(1),
  coachFeedback: z.string().min(1),
});

export const transcriptionResultSchema = z.object({
  transcript: z.string().min(1),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type TranscriptionResult = z.infer<typeof transcriptionResultSchema>;
