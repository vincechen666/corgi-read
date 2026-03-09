import { z } from "zod";

export const translationResultSchema = z.object({
  sourceText: z.string().min(1),
  translatedText: z.string().min(1),
  note: z.string().min(1),
});

export type TranslationResult = z.infer<typeof translationResultSchema>;
