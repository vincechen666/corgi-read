import { expect, test, vi } from "vitest";

import { createBaiduTokenClient } from "@/features/transcription/server/baidu-token";

test("reuses cached token until close to expiry", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      access_token: "token-1",
      expires_in: 2592000,
    }),
  });

  const client = createBaiduTokenClient(fetchMock);

  await client.getToken({ apiKey: "key", secretKey: "secret" });
  await client.getToken({ apiKey: "key", secretKey: "secret" });

  expect(fetchMock).toHaveBeenCalledTimes(1);
});
