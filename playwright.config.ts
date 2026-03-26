import { defineConfig } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? "3000");
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      `AI_MODE=mock TRANSCRIPTION_MODE=mock NEXT_PUBLIC_E2E_STATIC_PDF=1 ` +
      `NEXT_PUBLIC_E2E_AUTH_BOOTSTRAP=1 ` +
      `NEXT_DIST_DIR=.next-playwright ` +
      `npx next dev --webpack --hostname 127.0.0.1 --port ${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: baseURL,
  },
});
