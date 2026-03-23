# Google Translation Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current OpenRouter-backed text translation path with Google Cloud Translation while preserving the existing route contract, dictionary-first behavior, and server-only credential handling.

**Architecture:** Add dedicated translation env resolution and a Google translation client that calls the Cloud Translation v3 `translateText` endpoint with server-side credentials. Keep the existing translation service as the orchestrator so the app still supports built-in dictionary hits, mock mode, provider timeouts, and local fallback translations.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod, Vitest, server-side `fetch`, Google Cloud Translation v3 REST API

---

### Task 1: Add Dedicated Translation Env Resolution

**Files:**
- Create: `src/features/translation/server/translation-env.ts`
- Create: `tests/unit/translation-env.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/translation-env.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { getTranslationConfig, resolveTranslationMode } from "@/features/translation/server/translation-env";

describe("resolveTranslationMode", () => {
  test("defaults to mock when no Google credentials exist", () => {
    expect(
      resolveTranslationMode({
        TRANSLATION_MODE: undefined,
        GOOGLE_TRANSLATE_ACCESS_TOKEN: undefined,
        GOOGLE_APPLICATION_CREDENTIALS: undefined,
      }),
    ).toBe("mock");
  });

  test("defaults to real when explicit Google credentials exist", () => {
    expect(
      resolveTranslationMode({
        TRANSLATION_MODE: undefined,
        GOOGLE_TRANSLATE_ACCESS_TOKEN: "token",
      }),
    ).toBe("real");
  });
});

test("returns google translation config defaults", () => {
  const config = getTranslationConfig({
    TRANSLATION_MODE: "real",
    GOOGLE_CLOUD_PROJECT: "demo-project",
  });

  expect(config.provider).toBe("google");
  expect(config.location).toBe("global");
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/translation-env.test.ts
```

Expected: FAIL because the env helper does not exist.

**Step 3: Write minimal implementation**

Create [`src/features/translation/server/translation-env.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/translation/server/translation-env.ts) with:

- `resolveTranslationMode(env)`
- `getTranslationConfig(env)`

Return a config shape like:

```ts
{
  mode: "mock" | "real";
  provider: "google";
  projectId?: string;
  location: string;
  accessToken?: string;
  credentialsPath?: string;
}
```

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/translation-env.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/translation/server/translation-env.ts tests/unit/translation-env.test.ts
git commit -m "feat: add translation env config"
```

### Task 2: Add Google Translation Client

**Files:**
- Create: `src/features/translation/server/google-translation-client.ts`
- Create: `tests/unit/google-translation-client.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/google-translation-client.test.ts`:

```ts
import { expect, test, vi } from "vitest";

import { requestGoogleTranslation } from "@/features/translation/server/google-translation-client";

test("requests Google Cloud translateText and parses translated text", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      translations: [{ translatedText: "恒星制图" }],
    }),
  });

  const translatedText = await requestGoogleTranslation(
    {
      accessToken: "token",
      projectId: "demo-project",
      location: "global",
    },
    "stellar cartography",
    fetchMock,
  );

  expect(fetchMock).toHaveBeenCalledWith(
    "https://translation.googleapis.com/v3/projects/demo-project/locations/global:translateText",
    expect.objectContaining({
      method: "POST",
    }),
  );
  expect(translatedText).toBe("恒星制图");
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/google-translation-client.test.ts
```

Expected: FAIL because the Google client does not exist.

**Step 3: Write minimal implementation**

Create [`src/features/translation/server/google-translation-client.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/translation/server/google-translation-client.ts) that:

- builds the v3 `translateText` URL
- sends:
  - `sourceLanguageCode: "en"`
  - `targetLanguageCode: "zh-CN"`
  - `contents: [sourceText]`
  - `mimeType: "text/plain"`
- sets headers:
  - `Authorization: Bearer <token>`
  - `x-goog-user-project: <project id>`
  - `Content-Type: application/json; charset=utf-8`
- parses `translations[0].translatedText`

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/google-translation-client.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/translation/server/google-translation-client.ts tests/unit/google-translation-client.test.ts
git commit -m "feat: add google translation client"
```

### Task 3: Add Access Token Resolution

**Files:**
- Create: `src/features/translation/server/google-auth.ts`
- Create: `tests/unit/google-auth.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/google-auth.test.ts`:

```ts
import { expect, test } from "vitest";

import { resolveGoogleAccessToken } from "@/features/translation/server/google-auth";

test("prefers explicit translation access token", async () => {
  const token = await resolveGoogleAccessToken(
    {
      GOOGLE_TRANSLATE_ACCESS_TOKEN: "explicit-token",
    },
    async () => {
      throw new Error("should not call fallback provider");
    },
  );

  expect(token).toBe("explicit-token");
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/google-auth.test.ts
```

Expected: FAIL because the auth helper does not exist.

**Step 3: Write minimal implementation**

Create [`src/features/translation/server/google-auth.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/translation/server/google-auth.ts) with:

- `resolveGoogleAccessToken(env, getAdcToken?)`
- explicit-token priority
- fallback to an ADC helper when explicit token is absent
- clear error if no usable credentials exist in `real` mode

Keep the ADC implementation thin and server-only. It can initially use Google Auth Library if already available, or a minimal abstraction around an injected token provider if you choose to add the dependency in a later task.

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/google-auth.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/translation/server/google-auth.ts tests/unit/google-auth.test.ts
git commit -m "feat: add google translation auth helper"
```

### Task 4: Switch Translation Service to Google Provider

**Files:**
- Modify: `src/features/translation/server/translation-service.ts`
- Modify: `tests/unit/translation-service.test.ts`

**Step 1: Write the failing test**

Extend `tests/unit/translation-service.test.ts` with:

```ts
import * as googleTranslationClient from "@/features/translation/server/google-translation-client";

test("uses Google translation in real mode for non-dictionary text", async () => {
  const requestSpy = vi
    .spyOn(googleTranslationClient, "requestGoogleTranslation")
    .mockResolvedValue("恒星制图");

  const result = await translateText("stellar cartography", {
    TRANSLATION_MODE: "real",
    GOOGLE_TRANSLATE_ACCESS_TOKEN: "token",
    GOOGLE_CLOUD_PROJECT: "demo-project",
  });

  expect(requestSpy).toHaveBeenCalled();
  expect(result.translatedText).toBe("恒星制图");
  expect(result.note).toMatch(/Google/);
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/translation-service.test.ts
```

Expected: FAIL because the service still uses OpenRouter.

**Step 3: Write minimal implementation**

Update [`translation-service.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/translation/server/translation-service.ts) to:

- import translation env resolution instead of analysis env
- import Google token resolution and Google translation client
- preserve dictionary-first behavior
- preserve mock mode behavior
- preserve timeout fallback behavior
- generate a stable local note such as:
  - `当前结果由 Google 翻译生成，可结合上下文继续判断术语和语气。`

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/translation-service.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/translation/server/translation-service.ts tests/unit/translation-service.test.ts
git commit -m "feat: switch translation service to google"
```

### Task 5: Add Route Logging for Production Failures

**Files:**
- Modify: `src/app/api/translate/route.ts`
- Create or Modify: `tests/unit/translate-route.test.ts`

**Step 1: Write the failing test**

Add a route test:

```ts
test("logs provider failures in production without returning detail to the client", async () => {
  process.env.NODE_ENV = "production";
  translationServiceMocks.translateText.mockRejectedValue(
    new Error("Google translation request failed: 403"),
  );

  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  const response = await POST(
    new Request("http://localhost/api/translate", {
      method: "POST",
      body: JSON.stringify({ sourceText: "stellar cartography" }),
      headers: { "Content-Type": "application/json" },
    }),
  );

  const json = await response.json();

  expect(response.status).toBe(502);
  expect(json.error).toBe("Translation failed, please retry.");
  expect(json.detail).toBeUndefined();
  expect(consoleError).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/translate-route.test.ts
```

Expected: FAIL because the route does not yet log provider failures.

**Step 3: Write minimal implementation**

Update [`src/app/api/translate/route.ts`](/Users/cyc/Documents/Code/corgi-read/src/app/api/translate/route.ts) to:

- serialize and log translation failures server-side
- keep the client response generic

Mirror the existing transcription logging style where practical.

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/translate-route.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/api/translate/route.ts tests/unit/translate-route.test.ts
git commit -m "fix: log translation provider failures"
```

### Task 6: Update Docs and Environment Examples

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

**Step 1: Write the failing documentation expectation**

No unit test is needed. Instead, define the expected config section before editing:

- README must mention Google Cloud Translation setup
- `.env.example` must include translation-specific variables
- OpenRouter analysis config must remain separate from translation config

**Step 2: Review current docs**

Run:

```bash
sed -n '1,220p' README.md
sed -n '1,220p' .env.example
```

Expected: existing translation provider config references OpenRouter or lacks Google translation envs.

**Step 3: Write minimal implementation**

Update docs to include:

- `TRANSLATION_MODE`
- `TRANSLATION_PROVIDER`
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_TRANSLATE_LOCATION`
- `GOOGLE_APPLICATION_CREDENTIALS`
- optional `GOOGLE_TRANSLATE_ACCESS_TOKEN`

Make it explicit that translation and analysis now use separate provider config.

**Step 4: Verify docs are accurate**

Run:

```bash
rg -n "GOOGLE_TRANSLATE|TRANSLATION_MODE|TRANSLATION_PROVIDER" README.md .env.example
```

Expected: matching config examples present in both files.

**Step 5: Commit**

```bash
git add README.md .env.example
git commit -m "docs: add google translation config"
```

### Task 7: Run Full Verification

**Files:**
- No new files

**Step 1: Run focused tests**

Run:

```bash
npm test -- tests/unit/translation-env.test.ts tests/unit/google-translation-client.test.ts tests/unit/google-auth.test.ts tests/unit/translation-service.test.ts tests/unit/translate-route.test.ts tests/unit/translation-client.test.ts
```

Expected: PASS.

**Step 2: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS.

**Step 3: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

**Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

**Step 5: Commit final verification if needed**

If any verification-driven edits were required:

```bash
git add <files>
git commit -m "chore: finalize google translation integration"
```
