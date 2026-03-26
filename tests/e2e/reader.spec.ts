import path from "node:path";

import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const samplePdfPath = path.join(
  process.cwd(),
  "public",
  "sample",
  "the-last-question.pdf",
);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const stream = {
      getTracks: () => [{ stop: () => undefined }],
    };

    class MockMediaRecorder {
      static isTypeSupported() {
        return true;
      }

      ondataavailable: ((event: BlobEvent) => void) | null = null;
      onstop: (() => void) | null = null;

      start() {}

      stop() {
        this.ondataavailable?.(
          new BlobEvent("dataavailable", {
            data: new Blob(["audio"], { type: "audio/webm" }),
          }),
        );
        this.onstop?.();
      }
    }

    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => stream,
      },
    });

    Object.defineProperty(window, "MediaRecorder", {
      configurable: true,
      value: MockMediaRecorder,
    });
  });
});

async function uploadPdf(page: Page) {
  await expect(page.getByText(/upload a pdf to start reading/i)).toBeVisible();
  await page.getByRole("button", { name: /未打开文档/i }).click();

  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("menuitem", { name: /上传 pdf/i }).click();
  const fileChooser = await chooser;
  await fileChooser.setFiles(samplePdfPath);

  await expect(page.getByRole("button", { name: /the-last-question\.pdf/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /start retelling/i })).toBeEnabled();
}

async function enableAuthenticatedSession(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "corgi-read-e2e-auth-session",
      JSON.stringify({
        status: "authenticated",
        userId: "user-e2e",
        email: "reader@example.com",
        storageQuotaBytes: 1073741824,
        storageUsedBytes: 2048,
      }),
    );
  });
}

test("reader core loop works with mock services", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/upload a pdf to start reading/i)).toBeVisible();
  await expect(page.getByText(/你的学习沉淀/i)).toBeVisible();
  await uploadPdf(page);

  await page.getByRole("button", { name: /start retelling/i }).click();
  await page.getByRole("button", { name: /stop retelling/i }).click();

  await expect(page.getByRole("dialog", { name: /ai retelling feedback/i })).toBeVisible();
  await expect(page.getByText(/mock \/ mock/i)).toBeVisible();
  await page.getByRole("button", { name: /加入表达库/i }).click();
  await expect(page.getByRole("button", { name: /^表达库$/ })).toBeVisible();
});

test("retries transcription without re-recording when the first request fails", async ({
  page,
}) => {
  let transcriptionAttempts = 0;

  await page.route("**/api/transcribe", async (route) => {
    transcriptionAttempts += 1;

    if (transcriptionAttempts === 1) {
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Transcription failed, please retry.",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          transcript: "People knew Multivac well.",
        },
        meta: {
          mode: "mock",
          provider: "mock",
          model: "mock",
        },
      }),
    });
  });

  await page.goto("/");
  await uploadPdf(page);

  await page.getByRole("button", { name: /start retelling/i }).click();
  await page.getByRole("button", { name: /stop retelling/i }).click();

  await expect(page.getByText(/转写失败/i)).toBeVisible();
  await page.getByRole("button", { name: /重新转写/i }).click();

  await expect(
    page.getByRole("dialog", { name: /ai retelling feedback/i }),
  ).toBeVisible();
  expect(transcriptionAttempts).toBe(2);
});

test("opens a local pdf from the top-right document menu", async ({ page }) => {
  await page.goto("/");

  await uploadPdf(page);
  await expect(page.getByText(/upload a pdf to start reading/i)).not.toBeVisible();
  await expect(
    page.getByText(/local pdf loaded for automated browser verification/i),
  ).toBeVisible();
});

test("authenticated mode exposes the pdf library workspace and cloud sidebar copy", async ({
  page,
}) => {
  await enableAuthenticatedSession(page);
  await page.goto("/");

  await expect(page.getByTestId("pdf-library-trigger")).toBeVisible();
  await expect(
    page.getByText(/登录后，录音记录、收藏内容和表达库会从你的云端空间读取/i),
  ).toBeVisible();

  await page.getByTestId("pdf-library-trigger").click();

  await expect(
    page.getByRole("button", { name: /lesson-1\.pdf/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /lesson-1\.pdf/i }),
  ).toContainText("2.0 KB");
});
