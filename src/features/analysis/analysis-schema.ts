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

export const transcriptionMetaSchema = z.object({
  mode: z.enum(["mock", "real"]),
  provider: z.enum(["mock", "baidu"]),
  model: z.string().min(1),
});

export const analysisMetaSchema = z.object({
  mode: z.enum(["mock", "real"]),
  provider: z.enum(["mock", "openrouter"]),
  model: z.string().min(1),
});

export const transcriptionRouteResponseSchema = z.object({
  result: transcriptionResultSchema,
  meta: transcriptionMetaSchema,
});

export const analysisRouteResponseSchema = z.object({
  result: analysisResultSchema,
  meta: analysisMetaSchema,
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type TranscriptionResult = z.infer<typeof transcriptionResultSchema>;
export type TranscriptionMode = z.infer<typeof transcriptionMetaSchema.shape.mode>;
export type AnalysisMode = z.infer<typeof analysisMetaSchema.shape.mode>;
export type TranscriptionRouteResponse = z.infer<
  typeof transcriptionRouteResponseSchema
>;
export type AnalysisRouteResponse = z.infer<typeof analysisRouteResponseSchema>;
