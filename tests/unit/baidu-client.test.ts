import { expect, test, vi } from "vitest";

import { requestBaiduTranscription } from "@/features/transcription/server/baidu-client";

test("returns the first transcript candidate on success", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      err_no: 0,
      result: ["people knew multivac well"],
    }),
  });

  const transcript = await requestBaiduTranscription(
    {
      token: "token",
      cuid: "corgi-read",
      model: "1737",
      audioBuffer: Buffer.from("audio"),
    },
    fetchMock,
  );

  expect(transcript).toBe("people knew multivac well");
});
