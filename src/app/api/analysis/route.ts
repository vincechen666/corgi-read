import { NextResponse } from "next/server";

import { analysisRouteResponseSchema } from "@/features/analysis/analysis-schema";
import { analyzeRetelling } from "@/features/analysis/server/analysis-service";

export async function POST(request: Request) {
  const body = (await request.json()) as { transcript?: string };
  const transcript =
    body.transcript ??
    "People knew Multivac well, but its mysteries still felt beyond them.";

  try {
    const response = await analyzeRetelling(transcript);
    return NextResponse.json(analysisRouteResponseSchema.parse(response));
  } catch {
    return NextResponse.json(
      { error: "Analysis failed, please retry." },
      { status: 502 },
    );
  }
}
