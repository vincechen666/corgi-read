import { z } from "zod";

export const authSessionSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("guest"),
    email: z.null(),
  }),
  z.object({
    status: z.literal("authenticated"),
    email: z.email(),
  }),
]);

export type AuthSession = z.infer<typeof authSessionSchema>;
