import { NextResponse } from "next/server";

import { translationResultSchema } from "@/features/translation/translation-schema";
import { translateText } from "@/features/translation/server/translation-service";

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
  } catch {
    return NextResponse.json(
      { error: "Translation failed, please retry." },
      { status: 502 },
    );
  }
}
