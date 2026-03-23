import { NextResponse } from "next/server";

import { translationResultSchema } from "@/features/translation/translation-schema";
import { translateText } from "@/features/translation/server/translation-service";

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
  let body: { sourceText?: string } = {};

  try {
    body = (await request.json()) as { sourceText?: string };
  } catch {
    body = {};
  }

  const sourceText = body.sourceText?.trim();

  if (!sourceText) {
    return NextResponse.json(
      { error: "sourceText is required." },
      { status: 400 },
    );
  }

  try {
    const result = await translateText(sourceText);
    return NextResponse.json(translationResultSchema.parse(result));
  } catch (error) {
    console.error("[translate] request failed", serializeError(error));

    return NextResponse.json(
      { error: "Translation failed, please retry." },
      { status: 502 },
    );
  }
}
