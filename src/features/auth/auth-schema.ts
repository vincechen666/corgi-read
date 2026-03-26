import { z } from "zod";

export const authSessionSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("guest"),
    userId: z.null(),
    email: z.null(),
  }),
  z.object({
    status: z.literal("authenticated"),
    userId: z.string().min(1),
    email: z.email(),
    storageQuotaBytes: z.number().int().nonnegative().optional(),
    storageUsedBytes: z.number().int().nonnegative().optional(),
  }),
]);

export type AuthSession = z.infer<typeof authSessionSchema>;
