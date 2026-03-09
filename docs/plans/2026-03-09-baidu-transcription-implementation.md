# Baidu English Transcription Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the mock-only transcription route with a provider-pluggable server-side transcription flow that supports mock and real modes, uses Baidu short-audio English recognition in real mode, retries the same audio on failure, and keeps all secrets on the server.

**Architecture:** Keep the Next.js route thin and move provider behavior into `src/features/transcription/server/`. Real mode will convert browser-recorded `webm` to `wav` with `ffmpeg`, acquire and cache a Baidu `access_token`, call the Baidu short-audio standard API with `dev_pid=1737`, normalize the transcript, and return a stable `{ result, meta }` contract. The client shell will preserve the last audio blob and provide a retry path that reuses the same recording.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod, Vitest, Playwright, Node `child_process`, system `ffmpeg`, Baidu Speech REST API.

---

### Task 1: Add transcription schemas and mode config

**Files:**
- Modify: `src/features/analysis/analysis-schema.ts`
- Create: `src/features/transcription/server/transcription-env.ts`
- Test: `tests/unit/transcription-schema.test.ts`
- Test: `tests/unit/transcription-env.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "vitest";

import {
  transcriptionRouteResponseSchema,
} from "@/features/analysis/analysis-schema";
import { resolveTranscriptionMode } from "@/features/transcription/server/transcription-env";

describe("transcriptionRouteResponseSchema", () => {
  test("accepts result and metadata", () => {
    const parsed = transcriptionRouteResponseSchema.parse({
      result: { transcript: "People knew Multivac well." },
      meta: { mode: "mock", provider: "mock", model: "mock" },
    });

    expect(parsed.meta.provider).toBe("mock");
  });
});

describe("resolveTranscriptionMode", () => {
  test("uses real mode when credentials exist", () => {
    expect(
      resolveTranscriptionMode({
        BAIDU_SPEECH_API_KEY: "key",
        BAIDU_SPEECH_SECRET_KEY: "secret",
      }),
    ).toBe("real");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/transcription-schema.test.ts tests/unit/transcription-env.test.ts`

Expected: FAIL because the transcription route schema and env resolver do not exist yet.

**Step 3: Write the minimal implementation**

- Extend `src/features/analysis/analysis-schema.ts` with:
  - `transcriptionMetaSchema`
  - `transcriptionRouteResponseSchema`
  - exported `TranscriptionMode` and `TranscriptionRouteResponse`
- Create `src/features/transcription/server/transcription-env.ts`
  - `resolveTranscriptionMode(env)`
  - `getTranscriptionConfig(env)` returning mode, provider, model, credentials

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/transcription-schema.test.ts tests/unit/transcription-env.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/analysis/analysis-schema.ts src/features/transcription/server/transcription-env.ts tests/unit/transcription-schema.test.ts tests/unit/transcription-env.test.ts
git commit -m "feat: add transcription config and route schemas"
```

### Task 2: Add transcript normalization

**Files:**
- Create: `src/features/transcription/server/transcript-normalize.ts`
- Test: `tests/unit/transcript-normalize.test.ts`

**Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";

import { normalizeTranscript } from "@/features/transcription/server/transcript-normalize";

test("normalizes english transcript punctuation and casing", () => {
  expect(normalizeTranscript("  people   knew multivac well  ")).toBe(
    "People knew multivac well.",
  );
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/transcript-normalize.test.ts`

Expected: FAIL because the normalizer does not exist yet.

**Step 3: Write minimal implementation**

- Implement:
  - trim
  - whitespace collapse
  - first alphabetical letter capitalization
  - append terminal period when needed

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/transcript-normalize.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/transcription/server/transcript-normalize.ts tests/unit/transcript-normalize.test.ts
git commit -m "feat: normalize baidu english transcripts"
```

### Task 3: Add Baidu token client with cache

**Files:**
- Create: `src/features/transcription/server/baidu-token.ts`
- Test: `tests/unit/baidu-token.test.ts`

**Step 1: Write the failing tests**

```ts
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/baidu-token.test.ts`

Expected: FAIL because the token client does not exist yet.

**Step 3: Write minimal implementation**

- Implement `createBaiduTokenClient(fetchImpl = fetch)` with in-memory cache
- Use `https://aip.baidubce.com/oauth/2.0/token`
- Include:
  - `grant_type=client_credentials`
  - `client_id`
  - `client_secret`
- Refresh early before expiry

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/baidu-token.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/transcription/server/baidu-token.ts tests/unit/baidu-token.test.ts
git commit -m "feat: add baidu token cache client"
```

### Task 4: Add ffmpeg conversion helper

**Files:**
- Create: `src/features/transcription/server/audio-convert.ts`
- Test: `tests/unit/audio-convert.test.ts`

**Step 1: Write the failing tests**

```ts
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/audio-convert.test.ts`

Expected: FAIL because the conversion helper does not exist yet.

**Step 3: Write minimal implementation**

- Implement `convertWebmToWav()`
- Use `execFile("ffmpeg", [...args])`
- Emit a clear error if `ffmpeg` is missing or exits non-zero

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/audio-convert.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/transcription/server/audio-convert.ts tests/unit/audio-convert.test.ts
git commit -m "feat: add ffmpeg transcription conversion helper"
```

### Task 5: Add Baidu transcription client

**Files:**
- Create: `src/features/transcription/server/baidu-client.ts`
- Test: `tests/unit/baidu-client.test.ts`

**Step 1: Write the failing tests**

```ts
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/baidu-client.test.ts`

Expected: FAIL because the client does not exist yet.

**Step 3: Write minimal implementation**

- Implement `requestBaiduTranscription()`
- POST to `http://vop.baidu.com/server_api`
- Send Baidu-required payload and `dev_pid=1737`
- Return `result[0]`
- Throw on non-zero `err_no`

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/baidu-client.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/transcription/server/baidu-client.ts tests/unit/baidu-client.test.ts
git commit -m "feat: add baidu english transcription client"
```

### Task 6: Add transcription service with mock and real modes

**Files:**
- Create: `src/features/transcription/server/transcription-service.ts`
- Test: `tests/unit/transcription-service.test.ts`

**Step 1: Write the failing tests**

```ts
import { expect, test, vi } from "vitest";

import { transcribeRetelling } from "@/features/transcription/server/transcription-service";

test("returns mock metadata in mock mode", async () => {
  const response = await transcribeRetelling({
    audioBuffer: Buffer.from("audio"),
    mimeType: "audio/webm",
    env: { TRANSCRIPTION_MODE: "mock" },
  });

  expect(response.meta.provider).toBe("mock");
});

test("normalizes provider transcript in real mode", async () => {
  const response = await transcribeRetelling({
    audioBuffer: Buffer.from("audio"),
    mimeType: "audio/webm",
    env: {
      TRANSCRIPTION_MODE: "real",
      BAIDU_SPEECH_API_KEY: "key",
      BAIDU_SPEECH_SECRET_KEY: "secret",
    },
    dependencies: {
      getToken: vi.fn().mockResolvedValue("token"),
      convertAudio: vi.fn(),
      requestProviderTranscript: vi
        .fn()
        .mockResolvedValue("people knew multivac well"),
    },
  });

  expect(response.result.transcript).toBe("People knew multivac well.");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/transcription-service.test.ts`

Expected: FAIL because the service does not exist yet.

**Step 3: Write minimal implementation**

- Implement `transcribeRetelling()`
- Use env/config resolution
- Return current mock transcript in mock mode
- In real mode:
  - write temp input file
  - convert with `ffmpeg`
  - acquire token
  - call Baidu client
  - normalize transcript
  - return `{ result, meta }`
- Clean up temp files in `finally`

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/transcription-service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/transcription/server/transcription-service.ts tests/unit/transcription-service.test.ts
git commit -m "feat: add mock and baidu transcription service"
```

### Task 7: Update the transcribe route and client contract

**Files:**
- Modify: `src/app/api/transcribe/route.ts`
- Modify: `src/features/analysis/analysis-client.ts`
- Test: `tests/unit/transcription-client.test.ts`
- Test: `tests/unit/transcribe-route.test.ts`

**Step 1: Write the failing tests**

```ts
import { expect, test, vi } from "vitest";

import { transcribeAudio } from "@/features/analysis/analysis-client";

test("posts real audio payload and parses transcription metadata", async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      result: { transcript: "People knew Multivac well." },
      meta: { mode: "mock", provider: "mock", model: "mock" },
    }),
  });

  vi.stubGlobal("fetch", fetchMock);

  const response = await transcribeAudio(
    new Blob(["audio"], { type: "audio/webm" }),
  );

  expect(response.meta.provider).toBe("mock");
  expect(fetchMock).toHaveBeenCalled();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/transcription-client.test.ts tests/unit/transcribe-route.test.ts`

Expected: FAIL because the client still posts `{ hasAudio }` and the route still returns the old contract.

**Step 3: Write minimal implementation**

- Update `transcribeAudio()` to:
  - build `FormData`
  - append audio blob and mime type
  - call `/api/transcribe`
  - parse `transcriptionRouteResponseSchema`
- Update `/api/transcribe` route to:
  - read `request.formData()`
  - validate uploaded file
  - call `transcribeRetelling()`
  - return stable JSON response

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/transcription-client.test.ts tests/unit/transcribe-route.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/transcribe/route.ts src/features/analysis/analysis-client.ts tests/unit/transcription-client.test.ts tests/unit/transcribe-route.test.ts
git commit -m "feat: wire transcription route to form uploads"
```

### Task 8: Add UI retry flow for failed transcription

**Files:**
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/app-shell-transcription-error.test.tsx`

**Step 1: Write the failing test**

```ts
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, vi } from "vitest";

import { AppShell } from "@/components/reader/app-shell";

vi.mock("@/features/analysis/analysis-client", () => ({
  transcribeAudio: vi
    .fn()
    .mockRejectedValueOnce(new Error("transcription failed"))
    .mockResolvedValueOnce({
      result: { transcript: "People knew Multivac well." },
      meta: { mode: "mock", provider: "mock", model: "mock" },
    }),
  analyzeTranscript: vi.fn().mockResolvedValue({
    result: {
      transcript: "People knew Multivac well.",
      corrected: "People knew Multivac well.",
      grammar: "语法正确。",
      nativeExpression: "beyond them",
      coachFeedback: "表达自然。",
    },
    meta: { mode: "mock", provider: "mock", model: "mock" },
  }),
}));

test("shows retry transcription state and retries with the same audio", async () => {
  render(<AppShell />);
  const user = userEvent.setup();
  // test body uses the recording callback path already exercised in existing tests
  expect(await screen.findByText("转写失败，可重试")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "重新转写" }));
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/app-shell-transcription-error.test.tsx`

Expected: FAIL because the shell has no transcription-specific retry path yet.

**Step 3: Write minimal implementation**

- Preserve `lastAudioBlob` in `AppShell`
- Add `transcriptionError` state
- Add `handleRetryTranscription()`
- Only call analysis after successful transcription
- Keep existing analysis retry path intact

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/app-shell-transcription-error.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/app-shell.tsx tests/unit/app-shell-transcription-error.test.tsx
git commit -m "feat: add transcription retry flow"
```

### Task 9: Update docs and environment templates

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

**Step 1: Write the failing doc assertions**

```bash
rg -n "TRANSCRIPTION_MODE|BAIDU_SPEECH_API_KEY|ffmpeg|dev_pid=1737" .env.example README.md
```

**Step 2: Run the check to verify it fails**

Run: `rg -n "TRANSCRIPTION_MODE|BAIDU_SPEECH_API_KEY|ffmpeg|dev_pid=1737" .env.example README.md`

Expected: missing matches for the new Baidu transcription documentation.

**Step 3: Write minimal documentation**

- Add `.env.example` placeholders:
  - `TRANSCRIPTION_MODE`
  - `TRANSCRIPTION_PROVIDER=baidu`
  - `BAIDU_SPEECH_API_KEY`
  - `BAIDU_SPEECH_SECRET_KEY`
  - `BAIDU_SPEECH_MODEL=1737`
- Update README:
  - mock vs real transcription behavior
  - Baidu env requirements
  - `ffmpeg` runtime requirement
  - 60-second recording limit
  - English model punctuation caveat

**Step 4: Run the check to verify it passes**

Run: `rg -n "TRANSCRIPTION_MODE|BAIDU_SPEECH_API_KEY|ffmpeg|dev_pid=1737" .env.example README.md`

Expected: all required strings present.

**Step 5: Commit**

```bash
git add .env.example README.md
git commit -m "docs: add baidu transcription setup"
```

### Task 10: Run verification and manual real-mode smoke test

**Files:**
- Modify: `tests/e2e/reader.spec.ts`

**Step 1: Write the failing e2e test**

```ts
import { expect, test } from "@playwright/test";

test("shows retry state when transcription fails", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("转写失败，可重试")).toBeHidden();
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/reader.spec.ts`

Expected: FAIL until the transcription retry UI is wired and the existing harness can trigger it.

**Step 3: Write minimal implementation**

- Extend the existing Playwright reader flow to cover:
  - transcription failure UI
  - retry action
  - successful continuation into analysis

**Step 4: Run full verification**

Run: `npm test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run test:e2e -- tests/e2e/reader.spec.ts`
Expected: PASS

Run: `npm run build`
Expected: PASS

Manual smoke test:

```bash
TRANSCRIPTION_MODE=real AI_MODE=real npm run dev
```

Manual expected result:

- record a short English retelling under 60 seconds
- transcription returns real text from Baidu
- analysis continues normally
- if Baidu fails, UI shows `转写失败，可重试`

**Step 5: Commit**

```bash
git add tests/e2e/reader.spec.ts
git commit -m "test: cover baidu transcription retry flow"
```
