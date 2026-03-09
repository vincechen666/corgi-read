# OpenRouter Analysis Integration Design

**Date:** 2026-03-09

**Scope:** Replace mock-only AI analysis with a server-side OpenRouter integration while keeping mock transcription, preserving API key privacy, and adding a visible retry path when analysis fails.

---

## 1. Goal

The current MVP already supports the full reading-to-retelling loop, but the analysis step is still mocked in [`src/app/api/analysis/route.ts`](/Users/cyc/Documents/Code/corgi-read/src/app/api/analysis/route.ts). This design upgrades only the analysis leg to use OpenRouter with `StepFun: Step 3.5 Flash (free)` while keeping transcription mocked for now.

The result must remain compatible with the existing UI contract:

- `transcript`
- `corrected`
- `grammar`
- `nativeExpression`
- `coachFeedback`

The product behavior on failure is explicit: preserve the transcript, show `分析失败，可重试`, and let the user retry analysis without pretending a mock answer is real.

---

## 2. Constraints

- API keys must never be committed, rendered in the client, or returned by API routes.
- The real provider is OpenRouter, but the server code should not hard-code the app around one provider forever.
- Transcription remains mock-based in this phase.
- The UI language split is fixed:
  - `corrected`: English
  - `nativeExpression`: English
  - `grammar`: Chinese
  - `coachFeedback`: Chinese
- The route must support mock/real switching for development and debugging.

Because the user pasted a live key in chat, the implementation must avoid storing it anywhere in tracked files. Operationally, that key should be rotated after development because it has already been exposed outside a secret store.

---

## 3. Proposed Approaches

### Approach A: Inline OpenRouter fetch in the route

Put the request construction, mode switching, parsing, and fallback logic directly inside [`src/app/api/analysis/route.ts`](/Users/cyc/Documents/Code/corgi-read/src/app/api/analysis/route.ts).

Pros:
- Fastest initial implementation

Cons:
- Route becomes responsible for env loading, provider protocol, JSON parsing, mode switching, and error formatting
- Harder to test cleanly
- Harder to replace provider later

### Approach B: Lightweight provider adapter, recommended

Create a small server-only analysis service layer:

- env/config helper
- OpenRouter request helper
- prompt builder
- response parser + schema validation
- route delegates to service

Pros:
- Keeps route thin
- Makes `mock` vs `real` behavior testable
- Preserves future ability to swap providers without rewriting route/UI

Cons:
- Slightly more structure than a direct fetch

### Approach C: Multi-provider platform abstraction

Introduce a generalized provider registry with multiple model adapters and runtime switching.

Pros:
- Maximal extensibility

Cons:
- Overbuilt for current product stage

**Recommendation:** Approach B. It solves the real needs in this phase without turning the MVP into infrastructure work.

---

## 4. Architecture

### 4.1 Server-only analysis service

Add a server-only module under `src/features/analysis/server/` responsible for:

- reading env vars
- deciding `mock` or `real`
- calling OpenRouter in `real`
- returning structured output plus minimal metadata

Suggested modules:

- `src/features/analysis/server/analysis-env.ts`
- `src/features/analysis/server/openrouter-client.ts`
- `src/features/analysis/server/analysis-service.ts`
- `src/features/analysis/server/analysis-prompt.ts`

[`src/app/api/analysis/route.ts`](/Users/cyc/Documents/Code/corgi-read/src/app/api/analysis/route.ts) should only:

1. parse incoming request
2. call `analyzeRetelling()`
3. map domain errors to HTTP status
4. return JSON

### 4.2 Response contract

The route should return:

```ts
{
  result: {
    transcript: string;
    corrected: string;
    grammar: string;
    nativeExpression: string;
    coachFeedback: string;
  };
  meta: {
    mode: "mock" | "real";
    provider: "mock" | "openrouter";
    model: string;
  };
}
```

This preserves the existing analysis fields while adding just enough metadata for debugging and UI labeling.

[`src/features/analysis/analysis-schema.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/analysis/analysis-schema.ts) should be extended with a route-response schema instead of overloading the existing `analysisResultSchema`.

### 4.3 Mode selection

Mode selection should be deterministic:

- `AI_MODE=mock` => always mock
- `AI_MODE=real` => require OpenRouter config and call real provider
- unset `AI_MODE`:
  - if `OPENROUTER_API_KEY` exists => `real`
  - otherwise => `mock`

This gives local development a zero-config fallback while still allowing explicit forcing for tests and debugging.

---

## 5. OpenRouter Request Design

### 5.1 Model

Default model:

- `stepfun/step-3.5-flash`

Model should still be configurable through `OPENROUTER_MODEL`.

### 5.2 Prompt rules

The model acts only as an English retelling coach. It must not invent unseen PDF content. It only evaluates the supplied transcript and returns strict JSON.

Required output semantics:

- `transcript`: original transcript verbatim
- `corrected`: one concise, natural English rewrite
- `grammar`: Chinese explanation of the 1-2 most important grammar/expression issues
- `nativeExpression`: one English expression worth learning
- `coachFeedback`: short Chinese summary of fluency/accuracy/expression quality

The prompt must explicitly say:

- output JSON only
- no markdown
- no code fences
- no extra commentary

### 5.3 Parsing

The service should:

1. read text response from OpenRouter
2. extract JSON safely
3. validate with Zod
4. treat parse or schema failure as request failure

No silent fallback to mock is allowed in `real` mode.

---

## 6. Error Handling

### 6.1 Server behavior

When real analysis fails:

- return non-2xx response
- include a user-safe message such as `Analysis failed, please retry.`
- do not fabricate a result

Expected failure classes:

- missing env config in `real` mode
- upstream network timeout
- OpenRouter 4xx/5xx
- malformed model output

### 6.2 Client behavior

[`src/features/analysis/analysis-client.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/analysis/analysis-client.ts) should parse the new route response and throw a meaningful client error on failure.

[`src/components/reader/app-shell.tsx`](/Users/cyc/Documents/Code/corgi-read/src/components/reader/app-shell.tsx) should gain a small failure state:

- preserve transcript from mock transcription
- do not open the analysis modal
- show an inline error message near the recording control or main shell
- offer `重新分析`

The retry action should reuse the same transcript instead of re-recording.

---

## 7. Privacy and Secret Handling

- Use `.env.local` for the actual OpenRouter key
- Keep `.env.example` placeholder-only
- Never prefix provider env vars with `NEXT_PUBLIC_`
- Never log authorization headers
- Never persist provider responses with secret-bearing config

Recommended environment variables:

- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_BASE_URL`
- `AI_MODE`

`OPENROUTER_BASE_URL` should default to `https://openrouter.ai/api/v1`.

---

## 8. Testing Strategy

### Unit tests

Add unit coverage for:

- env mode resolution
- route response schema
- OpenRouter response parsing
- client-side failure handling / retry state

Mock `fetch` in unit tests rather than calling OpenRouter.

### Existing behavior checks

Maintain passing:

- `npm test`
- `npm run lint`
- `npm run build`

### E2E

Keep Playwright on mock by default unless explicit env is passed. The current E2E should remain deterministic and not depend on third-party rate limits.

---

## 9. Implementation Boundaries

### In scope

- real OpenRouter analysis
- mock/real mode switch
- structured response metadata
- UI retry path for failed analysis
- safe env handling
- docs update

### Out of scope

- real transcription
- streaming analysis
- persistent retry queue
- model selection UI
- usage analytics dashboard
- provider failover chains

---

## 10. Recommendation

Implement a lightweight server-only provider adapter for OpenRouter, preserve mock transcription, extend the analysis API contract with `meta`, and add a clear retry state in the reader shell. This gives the product its first real model-backed value while keeping the rest of the MVP stable, testable, and secret-safe.
