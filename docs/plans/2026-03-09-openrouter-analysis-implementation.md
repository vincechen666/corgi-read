# OpenRouter Analysis Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace mock-only analysis with a server-side OpenRouter integration, keep transcription mocked, and add a retryable front-end error state without exposing provider secrets.

**Architecture:** Add a small server-only analysis service layer that resolves `mock` vs `real` mode, calls OpenRouter in `real`, validates structured JSON, and returns typed route metadata. Keep the existing UI contract but extend it with minimal `meta` fields and a retry path in the app shell.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod, Vitest, Playwright, server-side `fetch`

---

### Task 1: Add Env and Response Schemas

**Files:**
- Create: `src/features/analysis/server/analysis-env.ts`
- Modify: `src/features/analysis/analysis-schema.ts`
- Create: `tests/unit/analysis-env.test.ts`
- Modify: `tests/unit/analysis-schema.test.ts`

**Step 1: Write the failing env and response tests**

Create `tests/unit/analysis-env.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { resolveAnalysisMode } from "@/features/analysis/server/analysis-env";

describe("resolveAnalysisMode", () => {
  test("defaults to mock when no key exists", () => {
    expect(
      resolveAnalysisMode({
        AI_MODE: undefined,
        OPENROUTER_API_KEY: undefined,
      }),
    ).toBe("mock");
  });

  test("defaults to real when a key exists", () => {
    expect(
      resolveAnalysisMode({
        AI_MODE: undefined,
        OPENROUTER_API_KEY: "test-key",
      }),
    ).toBe("real");
  });
});
```

Extend `tests/unit/analysis-schema.test.ts` with:

```ts
import { analysisRouteResponseSchema } from "@/features/analysis/analysis-schema";

test("accepts result with route metadata", () => {
  const parsed = analysisRouteResponseSchema.parse({
    result: {
      transcript: "People knew Multivac well...",
      corrected: "People felt close to Multivac...",
      grammar: "这里用 yet 更自然。",
      nativeExpression: "its mysteries still seemed beyond them",
      coachFeedback: "整体准确，表达还可以更地道。",
    },
    meta: {
      mode: "real",
      provider: "openrouter",
      model: "stepfun/step-3.5-flash",
    },
  });

  expect(parsed.meta.provider).toBe("openrouter");
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/unit/analysis-env.test.ts tests/unit/analysis-schema.test.ts
```

Expected: FAIL because the env helper and route response schema do not exist yet.

**Step 3: Implement minimal schemas and mode resolution**

Update [`src/features/analysis/analysis-schema.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/analysis/analysis-schema.ts) to add:

- `analysisMetaSchema`
- `analysisRouteResponseSchema`
- `AnalysisMode`
- `AnalysisRouteResponse`

Create [`src/features/analysis/server/analysis-env.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/analysis/server/analysis-env.ts) with:

- `resolveAnalysisMode(env)`
- `getAnalysisConfig(env)`

`getAnalysisConfig()` should return:

```ts
{
  mode: "mock" | "real";
  apiKey?: string;
  model: string;
  baseUrl: string;
}
```

**Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- tests/unit/analysis-env.test.ts tests/unit/analysis-schema.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/analysis/server/analysis-env.ts src/features/analysis/analysis-schema.ts tests/unit/analysis-env.test.ts tests/unit/analysis-schema.test.ts
git commit -m "feat: add analysis env and response schemas"
```

### Task 2: Add OpenRouter Prompt and Server Client

**Files:**
- Create: `src/features/analysis/server/analysis-prompt.ts`
- Create: `src/features/analysis/server/openrouter-client.ts`
- Create: `tests/unit/openrouter-client.test.ts`

**Step 1: Write the failing client test**

Create `tests/unit/openrouter-client.test.ts`:

```ts
import { describe, expect, test, vi } from "vitest";

import { requestOpenRouterAnalysis } from "@/features/analysis/server/openrouter-client";

describe("requestOpenRouterAnalysis", () => {
  test("parses a structured json response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          transcript: "People knew Multivac well...",
          corrected: "People felt close to Multivac...",
          grammar: "这里应用 yet 更自然。",
          nativeExpression: "its mysteries still seemed beyond them",
          coachFeedback: "整体准确。",
        }),
    });

    const result = await requestOpenRouterAnalysis(
      {
        apiKey: "test-key",
        baseUrl: "https://openrouter.ai/api/v1",
        model: "stepfun/step-3.5-flash",
      },
      "People knew Multivac well...",
      fetchMock,
    );

    expect(result.corrected).toMatch(/felt close/);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/openrouter-client.test.ts
```

Expected: FAIL because the OpenRouter client does not exist.

**Step 3: Implement minimal prompt and client**

Create [`src/features/analysis/server/analysis-prompt.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/analysis/server/analysis-prompt.ts) to build a strict JSON-only instruction with the confirmed language split.

Create [`src/features/analysis/server/openrouter-client.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/analysis/server/openrouter-client.ts) with:

- `requestOpenRouterAnalysis(config, transcript, fetchImpl = fetch)`
- request body for OpenRouter chat completions
- response extraction from `choices[0].message.content`
- JSON parsing
- Zod validation with `analysisResultSchema`

Treat malformed JSON and schema mismatch as thrown errors.

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/openrouter-client.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/analysis/server/analysis-prompt.ts src/features/analysis/server/openrouter-client.ts tests/unit/openrouter-client.test.ts
git commit -m "feat: add openrouter analysis client"
```

### Task 3: Build Analysis Service and Route Modes

**Files:**
- Create: `src/features/analysis/server/analysis-service.ts`
- Modify: `src/app/api/analysis/route.ts`
- Modify: `src/lib/env.ts`
- Create: `tests/unit/analysis-service.test.ts`

**Step 1: Write the failing service test**

Create `tests/unit/analysis-service.test.ts`:

```ts
import { describe, expect, test, vi } from "vitest";

import { analyzeRetelling } from "@/features/analysis/server/analysis-service";

describe("analyzeRetelling", () => {
  test("returns mock metadata in mock mode", async () => {
    const response = await analyzeRetelling("People knew Multivac well...", {
      AI_MODE: "mock",
    });

    expect(response.meta.mode).toBe("mock");
    expect(response.meta.provider).toBe("mock");
  });

  test("throws when real mode is forced without key", async () => {
    await expect(
      analyzeRetelling("People knew Multivac well...", { AI_MODE: "real" }),
    ).rejects.toThrow(/OPENROUTER_API_KEY/);
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/analysis-service.test.ts
```

Expected: FAIL because the analysis service does not exist yet.

**Step 3: Implement service and route**

Create [`src/features/analysis/server/analysis-service.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/analysis/server/analysis-service.ts) with:

- `analyzeRetelling(transcript, env = process.env)`
- mock branch returning current sample output plus `meta`
- real branch using `getAnalysisConfig()` and `requestOpenRouterAnalysis()`

Update [`src/app/api/analysis/route.ts`](/Users/cyc/Documents/Code/corgi-read/src/app/api/analysis/route.ts):

- parse transcript input
- call `analyzeRetelling()`
- on success return `analysisRouteResponseSchema.parse(response)`
- on failure return `NextResponse.json({ error: "Analysis failed, please retry." }, { status: 502 })`

Update [`src/lib/env.ts`](/Users/cyc/Documents/Code/corgi-read/src/lib/env.ts) only if needed to avoid duplicate env helpers; do not keep overlapping config logic in two places.

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/analysis-service.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/analysis/server/analysis-service.ts src/app/api/analysis/route.ts src/lib/env.ts tests/unit/analysis-service.test.ts
git commit -m "feat: add mock and real analysis service modes"
```

### Task 4: Update Client Contract and Error Surface

**Files:**
- Modify: `src/features/analysis/analysis-client.ts`
- Modify: `src/components/reader/app-shell.tsx`
- Create: `tests/unit/analysis-client.test.ts`
- Create: `tests/unit/app-shell-analysis-error.test.tsx`

**Step 1: Write the failing client and UI tests**

Create `tests/unit/analysis-client.test.ts`:

```ts
import { expect, test, vi } from "vitest";

import { analyzeTranscript } from "@/features/analysis/analysis-client";

test("returns result and metadata from the analysis route", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          transcript: "People knew Multivac well...",
          corrected: "People felt close to Multivac...",
          grammar: "这里应用 yet 更自然。",
          nativeExpression: "its mysteries still seemed beyond them",
          coachFeedback: "整体准确。",
        },
        meta: {
          mode: "real",
          provider: "openrouter",
          model: "stepfun/step-3.5-flash",
        },
      }),
    }),
  );

  const response = await analyzeTranscript("People knew Multivac well...");

  expect(response.meta.provider).toBe("openrouter");
});
```

Create `tests/unit/app-shell-analysis-error.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { AppShell } from "@/components/reader/app-shell";

vi.mock("@/features/analysis/analysis-client", () => ({
  transcribeAudio: vi.fn().mockResolvedValue({
    transcript: "People knew Multivac well...",
  }),
  analyzeTranscript: vi.fn().mockRejectedValue(new Error("analysis failed")),
}));

test("shows retry feedback when analysis fails", async () => {
  const user = userEvent.setup();
  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /start retelling/i }));
  await user.click(screen.getByRole("button", { name: /stop retelling/i }));

  expect(await screen.findByText(/分析失败，可重试/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /重新分析/i })).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/unit/analysis-client.test.ts tests/unit/app-shell-analysis-error.test.tsx
```

Expected: FAIL because the client still expects the old route shape and the UI has no retry state.

**Step 3: Implement minimal client and UI changes**

Update [`src/features/analysis/analysis-client.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/analysis/analysis-client.ts):

- parse `analysisRouteResponseSchema`
- return `{ result, meta }`
- throw a friendly error when response is non-OK

Update [`src/components/reader/app-shell.tsx`](/Users/cyc/Documents/Code/corgi-read/src/components/reader/app-shell.tsx):

- store `lastTranscript`
- store `analysisError`
- store `analysisMeta`
- on analysis failure show `分析失败，可重试`
- add `重新分析` button that reuses `lastTranscript`
- pass `result` only to `AnalysisModal`
- optionally surface `meta.provider` / `meta.mode` near the modal header or shell

**Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- tests/unit/analysis-client.test.ts tests/unit/app-shell-analysis-error.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/features/analysis/analysis-client.ts src/components/reader/app-shell.tsx tests/unit/analysis-client.test.ts tests/unit/app-shell-analysis-error.test.tsx
git commit -m "feat: add analysis retry state to app shell"
```

### Task 5: Document Secret Usage and Validate End-to-End

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `tests/e2e/reader.spec.ts`

**Step 1: Write the failing E2E assertion**

Extend [`tests/e2e/reader.spec.ts`](/Users/cyc/Documents/Code/corgi-read/tests/e2e/reader.spec.ts) with an assertion that the successful flow still works when API analysis succeeds:

```ts
await expect(page.getByRole("dialog", { name: /ai retelling feedback/i })).toBeVisible();
await expect(page.getByText(/OpenRouter|Mock Analysis/i)).toBeVisible();
```

If you decide not to expose provider metadata in the current UI, instead add a unit test for the meta label component and keep E2E unchanged.

**Step 2: Run test to verify it fails if new UI hook is missing**

Run:

```bash
npm run test:e2e -- tests/e2e/reader.spec.ts
```

Expected: FAIL until the UI exposes the agreed debug label or alternative hook.

**Step 3: Implement docs and final UI hook**

Update [`.env.example`](/Users/cyc/Documents/Code/corgi-read/.env.example):

```env
AI_MODE=mock
OPENROUTER_API_KEY=
OPENROUTER_MODEL=stepfun/step-3.5-flash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
TRANSCRIPTION_MODEL=
ANALYSIS_MODEL=
```

Update [`README.md`](/Users/cyc/Documents/Code/corgi-read/README.md):

- explain mock vs real analysis mode
- state that real keys belong in `.env.local`
- note that transcription is still mocked
- add commands for running in mock mode vs real mode

Expose a small provider/mode label in the success UI only if it does not degrade the main layout.

**Step 4: Run full verification**

Run:

```bash
npm test
npm run lint
npm run test:e2e -- tests/e2e/reader.spec.ts
npm run build
```

Expected: all PASS.

**Step 5: Commit**

```bash
git add .env.example README.md tests/e2e/reader.spec.ts src/components/reader/app-shell.tsx src/components/reader/analysis-modal.tsx
git commit -m "docs: document real analysis mode"
```

---

## Notes for the Implementer

- Do not write the real OpenRouter key into any tracked file.
- Do not add `NEXT_PUBLIC_` secrets.
- Keep Playwright deterministic; avoid making E2E depend on OpenRouter uptime.
- Preserve existing mocked transcription route and recording flow.
- If the provider output is malformed, fail fast and surface retry instead of auto-falling back to mock in `real` mode.

## Definition of Done

- Analysis can run in `mock` or `real` mode using the same client contract.
- OpenRouter responses are parsed into the fixed UI schema.
- Failure state preserves transcript and offers retry.
- `.env.example` and `README.md` document safe setup.
- `npm test`, `npm run lint`, `npm run test:e2e -- tests/e2e/reader.spec.ts`, and `npm run build` all pass locally.
