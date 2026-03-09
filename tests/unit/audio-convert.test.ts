import { expect, test, vi } from "vitest";

import { convertWebmToWav } from "@/features/transcription/server/audio-convert";

test("calls ffmpeg with 16k mono wav arguments", async () => {
  const execFileMock = vi.fn((_cmd, _args, callback) => callback(null));

  await convertWebmToWav({
    inputPath: "/tmp/in.webm",
    outputPath: "/tmp/out.wav",
    execFileImpl: execFileMock,
  });

  expect(execFileMock).toHaveBeenCalledWith(
    "ffmpeg",
    expect.arrayContaining(["-ar", "16000", "-ac", "1", "/tmp/out.wav"]),
    expect.any(Function),
  );
});
