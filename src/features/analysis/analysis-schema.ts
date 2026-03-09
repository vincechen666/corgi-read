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

export const analysisMetaSchema = z.object({
  mode: z.enum(["mock", "real"]),
  provider: z.enum(["mock", "openrouter"]),
  model: z.string().min(1),
});

export const analysisRouteResponseSchema = z.object({
  result: analysisResultSchema,
  meta: analysisMetaSchema,
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type TranscriptionResult = z.infer<typeof transcriptionResultSchema>;
export type AnalysisMode = z.infer<typeof analysisMetaSchema.shape.mode>;
export type AnalysisRouteResponse = z.infer<typeof analysisRouteResponseSchema>;
