import { NextResponse } from "next/server";

import { analysisResultSchema } from "@/features/analysis/analysis-schema";
import { hasAiConfig } from "@/lib/env";

export async function POST(request: Request) {
  const body = (await request.json()) as { transcript?: string };
  const transcript =
    body.transcript ??
    "People knew Multivac well, but its mysteries still felt beyond them.";

  return NextResponse.json(
    analysisResultSchema.parse({
      transcript,
      corrected:
        "People felt close to Multivac, yet its mysteries still seemed beyond them.",
      grammar:
        hasAiConfig()
          ? "Mock mode still enabled until a real provider is wired in."
          : "Mock mode: use felt close to / seemed beyond them for more natural contrast.",
      nativeExpression: "its mysteries still seemed beyond them",
      coachFeedback:
        "Use stronger contrast markers such as yet, while, or although to sound more natural.",
    }),
  );
}
