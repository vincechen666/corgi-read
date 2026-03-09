import { expect, test } from "@playwright/test";

test("reader core loop works with mock services", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/read in english/i)).toBeVisible();
  await expect(page.getByText(/你的学习沉淀/i)).toBeVisible();

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

  await page.getByRole("button", { name: /start retelling/i }).click();
  await page.getByRole("button", { name: /stop retelling/i }).click();

  await expect(page.getByText(/转写失败，可重试/i)).toBeVisible();
  await page.getByRole("button", { name: /重新转写/i }).click();

  await expect(
    page.getByRole("dialog", { name: /ai retelling feedback/i }),
  ).toBeVisible();
  expect(transcriptionAttempts).toBe(2);
});
