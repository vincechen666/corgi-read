import { z } from "zod";
import type { Session } from "@supabase/supabase-js";

export const guestAuthSession = {
  status: "guest",
  userId: null,
  email: null,
} as const;

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

export function authSessionFromSupabaseSession(
  session: Session | null,
): AuthSession {
  if (!session?.user?.id || !session.user.email) {
    return guestAuthSession;
  }

  return authSessionSchema.parse({
    status: "authenticated",
    userId: session.user.id,
    email: session.user.email,
  });
}
