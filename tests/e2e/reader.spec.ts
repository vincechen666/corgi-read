import { expect, test } from "@playwright/test";

test("reader core loop works with mock services", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/read in english/i)).toBeVisible();
  await expect(page.getByText(/你的学习沉淀/i)).toBeVisible();

  await page.getByRole("button", { name: /start retelling/i }).click();
  await page.getByRole("button", { name: /stop retelling/i }).click();

  await expect(page.getByRole("dialog", { name: /ai retelling feedback/i })).toBeVisible();
  await page.getByRole("button", { name: /加入表达库/i }).click();
  await expect(page.getByRole("button", { name: /^表达库$/ })).toBeVisible();
});
