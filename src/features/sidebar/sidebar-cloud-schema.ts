import { z } from "zod";

export const cloudRecordingEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  documentId: z.string().min(1).nullable().optional(),
  page: z.number().int().positive(),
  createdAt: z.string().min(1),
  transcript: z.string().min(1),
  corrected: z.string().min(1),
  grammar: z.string().min(1),
  nativeExpression: z.string().min(1),
  coachFeedback: z.string().min(1),
  summary: z.string().min(1),
  feedback: z.string().min(1),
});

export const cloudFavoriteEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  documentId: z.string().min(1).nullable().optional(),
  sourceText: z.string().min(1),
  translatedText: z.string().min(1),
  type: z.enum(["word", "phrase", "sentence"]),
  page: z.number().int().positive(),
  createdAt: z.string().min(1),
});

export const cloudExpressionEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  documentId: z.string().min(1).nullable().optional(),
  sourcePhrase: z.string().min(1),
  naturalPhrase: z.string().min(1),
  note: z.string().min(1),
  sourceRecordingId: z.string().min(1),
  createdAt: z.string().min(1),
});

export type CloudRecordingEntry = z.infer<typeof cloudRecordingEntrySchema>;
export type CloudFavoriteEntry = z.infer<typeof cloudFavoriteEntrySchema>;
export type CloudExpressionEntry = z.infer<typeof cloudExpressionEntrySchema>;
