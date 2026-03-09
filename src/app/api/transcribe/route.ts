import { NextResponse } from "next/server";

import { transcriptionRouteResponseSchema } from "@/features/analysis/analysis-schema";
import { transcribeRetelling } from "@/features/transcription/server/transcription-service";

function isUploadFile(
  value: FormDataEntryValue | null,
): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    typeof value.arrayBuffer === "function" &&
    "type" in value &&
    typeof value.type === "string"
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!isUploadFile(audio)) {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 },
      );
    }

    const response = await transcribeRetelling({
      audioBuffer: new Uint8Array(await audio.arrayBuffer()),
      mimeType: audio.type || "audio/webm",
    });

    return NextResponse.json(transcriptionRouteResponseSchema.parse(response));
  } catch {
    return NextResponse.json(
      { error: "Transcription failed, please retry." },
      { status: 502 },
    );
  }
}
