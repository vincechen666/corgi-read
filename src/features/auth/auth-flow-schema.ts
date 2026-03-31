import { z } from "zod";

export const authEmailFlowResponseSchema = z.object({
  flow: z.enum(["signup-link", "login-code"]),
});
