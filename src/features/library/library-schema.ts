import { z } from "zod";

export {
  cloudExpressionEntrySchema,
  cloudFavoriteEntrySchema,
  cloudRecordingEntrySchema,
} from "@/features/sidebar/sidebar-cloud-schema";

export const pdfDocumentSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  fileName: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative(),
  storagePath: z.string().min(1),
  createdAt: z.string().min(1),
});

export type PdfDocument = z.infer<typeof pdfDocumentSchema>;
