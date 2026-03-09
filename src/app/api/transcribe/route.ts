import { NextResponse } from "next/server";

import { transcriptionResultSchema } from "@/features/analysis/analysis-schema";

export async function POST() {
  return NextResponse.json(
    transcriptionResultSchema.parse({
      transcript:
        "People knew Multivac well, but its mysteries still felt beyond them.",
    }),
  );
}
