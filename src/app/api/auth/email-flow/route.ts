import { z } from "zod";

import { authEmailFlowResponseSchema } from "@/features/auth/auth-flow-schema";
import { getEmailFlow } from "@/features/auth/server/email-flow-service";

const authEmailFlowRequestSchema = z.object({
  email: z.email(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid email payload" }, { status: 400 });
  }

  const parsed = authEmailFlowRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid email payload" }, { status: 400 });
  }

  const flow = await getEmailFlow(parsed.data.email);

  return Response.json(authEmailFlowResponseSchema.parse({ flow }));
}
