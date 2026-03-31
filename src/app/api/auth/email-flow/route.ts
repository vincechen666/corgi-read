import { z } from "zod";

import { authEmailFlowResponseSchema } from "@/features/auth/auth-flow-schema";
import { getEmailFlow } from "@/features/auth/server/email-flow-service";

const authEmailFlowRequestSchema = z.object({
  email: z.string().trim().email(),
});

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.cause instanceof Error
        ? {
            cause: {
              name: error.cause.name,
              message: error.cause.message,
            },
          }
        : {}),
    };
  }

  return {
    message: String(error),
  };
}

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

  try {
    const flow = await getEmailFlow(parsed.data.email);

    return Response.json(authEmailFlowResponseSchema.parse({ flow }));
  } catch (error) {
    console.error("[auth/email-flow] request failed", serializeError(error));

    return Response.json(
      { error: "Auth email flow lookup failed." },
      { status: 502 },
    );
  }
}
