# English PDF Reader Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the first working desktop web MVP of the English-learning PDF reader defined in the design doc and Pencil prototype, including PDF reading, word/phrase translation popovers, a Siri-style recording button, AI retelling analysis, and a persistent right sidebar.

**Architecture:** Start from a fresh Next.js App Router project and build the UI from the Pencil prototype in thin vertical slices. Keep the first release server-light: store session data locally in IndexedDB/localStorage, use mocked PDF/AI data early, then add real server routes for speech-to-text and AI analysis behind a stable contract. The reader page should be a single dominant screen with two presentational states from the `.pen` file: `Reader View` and `Feedback View`.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, PDF.js via `react-pdf`, Zustand, Zod, TanStack Query, MediaRecorder/Web Audio APIs, IndexedDB/localStorage, Vitest, React Testing Library, Playwright.

---

## Source References

- Design doc: `docs/plans/2026-03-08-english-pdf-reader-design.md`
- Pencil prototype: `designs/english-pdf-reader-prototype.pen`
- Prototype states to match:
  - `Reader View`
  - `Feedback View`

## Recommended Project Structure

```text
src/
  app/
    api/
      analysis/route.ts
      transcribe/route.ts
    globals.css
    layout.tsx
    page.tsx
  components/
    reader/
      app-shell.tsx
      top-bar.tsx
      pdf-stage.tsx
      pdf-toolbar.tsx
      translation-popover.tsx
      learning-sidebar.tsx
      recording-button.tsx
      analysis-modal.tsx
      empty-reader-state.tsx
    ui/
      card.tsx
      pill-tabs.tsx
      status-badge.tsx
  features/
    analysis/
      analysis-client.ts
      analysis-schema.ts
    pdf/
      pdf-selection.ts
      pdf-types.ts
    recording/
      recorder.ts
      recorder-schema.ts
    sidebar/
      sidebar-store.ts
      sidebar-storage.ts
    translation/
      translation-client.ts
      translation-schema.ts
  lib/
    env.ts
    utils.ts
  tests/
    e2e/
      reader.spec.ts
    unit/
      analysis-schema.test.ts
      recorder.test.ts
      sidebar-store.test.ts
      translation-schema.test.ts
```

### Task 1: Bootstrap the Web App and Tooling

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.js`
- Create: `eslint.config.js`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `tests/setup/vitest.setup.ts`
- Create: `.env.example`
- Create: `README.md`

**Step 1: Scaffold the app**

Run:

```bash
npm create next-app@latest . --ts --eslint --app --src-dir --tailwind --import-alias "@/*"
```

Expected: a fresh Next.js app is created in the current repo with `src/app/page.tsx` and Tailwind enabled.

**Step 2: Add test and app dependencies**

Run:

```bash
npm install react-pdf pdfjs-dist zustand @tanstack/react-query zod idb lucide-react
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom playwright
```

Expected: install completes without peer dependency errors.

**Step 3: Wire the base config**

Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

**Step 4: Add failing smoke test for the root app shell**

Create `tests/unit/app-shell-smoke.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

test("renders the reader app shell heading", () => {
  render(<Page />);
  expect(screen.getByText(/english pdf reader/i)).toBeInTheDocument();
});
```

Run:

```bash
npm test -- tests/unit/app-shell-smoke.test.tsx
```

Expected: FAIL because the current page still contains the default scaffold.

**Step 5: Replace the scaffold with a minimal branded shell**

Implement `src/app/page.tsx` and `src/app/layout.tsx` so the smoke test passes and the project is ready for real feature work.

**Step 6: Verify**

Run:

```bash
npm test -- tests/unit/app-shell-smoke.test.tsx
npm run lint
```

Expected: both pass.

**Step 7: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json postcss.config.js eslint.config.js vitest.config.ts playwright.config.ts tests/setup/vitest.setup.ts tests/unit/app-shell-smoke.test.tsx src/app/layout.tsx src/app/page.tsx src/app/globals.css .env.example README.md
git commit -m "chore: bootstrap pdf reader app"
```

### Task 2: Build the Static Reader Screen from the Pencil Prototype

**Files:**
- Create: `src/components/reader/app-shell.tsx`
- Create: `src/components/reader/top-bar.tsx`
- Create: `src/components/reader/pdf-stage.tsx`
- Create: `src/components/reader/learning-sidebar.tsx`
- Create: `src/components/reader/recording-button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/pill-tabs.tsx`
- Create: `src/lib/utils.ts`
- Modify: `src/app/page.tsx`
- Test: `tests/unit/reader-shell.test.tsx`

**Step 1: Write the failing UI structure test**

Create `tests/unit/reader-shell.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

test("renders the reader workspace, learning sidebar, and recording button", () => {
  render(<Page />);
  expect(screen.getByText(/read in english/i)).toBeInTheDocument();
  expect(screen.getByText(/你的学习沉淀/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /start retelling/i })).toBeInTheDocument();
});
```

**Step 2: Run the test**

Run:

```bash
npm test -- tests/unit/reader-shell.test.tsx
```

Expected: FAIL because the prototype-derived sections do not exist yet.

**Step 3: Implement the static layout**

Translate `Reader View` from `designs/english-pdf-reader-prototype.pen` into components:

- `TopBar` for brand, doc metadata, and mode pills
- `PdfStage` for the large editorial paper-like reading panel
- `LearningSidebar` for `录音 / 收藏 / 表达库`
- `RecordingButton` as a bottom-centered Siri-style circular CTA

Seed the page with static mock content from the design doc. Match the prototype’s hierarchy before wiring behavior.

**Step 4: Verify**

Run:

```bash
npm test -- tests/unit/reader-shell.test.tsx
npm run lint
```

Expected: both pass.

**Step 5: Commit**

```bash
git add src/app/page.tsx src/components/reader/app-shell.tsx src/components/reader/top-bar.tsx src/components/reader/pdf-stage.tsx src/components/reader/learning-sidebar.tsx src/components/reader/recording-button.tsx src/components/ui/card.tsx src/components/ui/pill-tabs.tsx src/lib/utils.ts tests/unit/reader-shell.test.tsx
git commit -m "feat: build static reader screen from prototype"
```

### Task 3: Add PDF Rendering and Selection-Aware Translation Popover

**Files:**
- Create: `public/sample/the-last-question.pdf`
- Create: `src/features/pdf/pdf-types.ts`
- Create: `src/features/pdf/pdf-selection.ts`
- Create: `src/features/translation/translation-schema.ts`
- Create: `src/features/translation/translation-client.ts`
- Create: `src/components/reader/pdf-toolbar.tsx`
- Create: `src/components/reader/translation-popover.tsx`
- Modify: `src/components/reader/pdf-stage.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/translation-schema.test.ts`
- Test: `tests/unit/pdf-selection.test.ts`

**Step 1: Write failing domain tests**

Create `tests/unit/translation-schema.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { translationResultSchema } from "@/features/translation/translation-schema";

describe("translationResultSchema", () => {
  test("accepts source text, chinese translation, and note", () => {
    const result = translationResultSchema.parse({
      sourceText: "deliberate translation moment",
      translatedText: "按需触发的翻译提示",
      note: "在卡住时快速确认含义"
    });
    expect(result.translatedText).toBe("按需触发的翻译提示");
  });
});
```

Create `tests/unit/pdf-selection.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { normalizeSelectionText } from "@/features/pdf/pdf-selection";

describe("normalizeSelectionText", () => {
  test("collapses repeated whitespace from PDF text selection", () => {
    expect(normalizeSelectionText("felt   close\\n to   Multivac")).toBe("felt close to Multivac");
  });
});
```

**Step 2: Run the tests**

Run:

```bash
npm test -- tests/unit/translation-schema.test.ts tests/unit/pdf-selection.test.ts
```

Expected: FAIL because the feature files do not exist yet.

**Step 3: Implement PDF stage behavior**

Build the minimal behavior slice:

- Render `public/sample/the-last-question.pdf`
- Support page number and zoom controls
- Capture selected text from the PDF text layer
- Show a local popover near the selection
- Use a mock `translateSelection()` client that returns prototype-aligned data

**Step 4: Verify**

Run:

```bash
npm test -- tests/unit/translation-schema.test.ts tests/unit/pdf-selection.test.ts
npm run lint
```

Expected: pass.

**Step 5: Commit**

```bash
git add public/sample/the-last-question.pdf src/features/pdf/pdf-types.ts src/features/pdf/pdf-selection.ts src/features/translation/translation-schema.ts src/features/translation/translation-client.ts src/components/reader/pdf-toolbar.tsx src/components/reader/translation-popover.tsx src/components/reader/pdf-stage.tsx src/components/reader/app-shell.tsx tests/unit/translation-schema.test.ts tests/unit/pdf-selection.test.ts
git commit -m "feat: add pdf stage and translation popover"
```

### Task 4: Persist the Right Sidebar and Collection Workflows

**Files:**
- Create: `src/features/sidebar/sidebar-store.ts`
- Create: `src/features/sidebar/sidebar-storage.ts`
- Modify: `src/components/reader/learning-sidebar.tsx`
- Modify: `src/components/reader/translation-popover.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/sidebar-store.test.ts`

**Step 1: Write the failing store test**

Create `tests/unit/sidebar-store.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { createSidebarStore } from "@/features/sidebar/sidebar-store";

describe("sidebar-store", () => {
  test("adds a collected sentence into favorites", () => {
    const store = createSidebarStore();
    store.getState().addFavorite({
      id: "fav-1",
      sourceText: "faithful attendants of Multivac",
      translatedText: "Multivac 的忠实看护者",
      type: "sentence",
      page: 12
    });
    expect(store.getState().favorites).toHaveLength(1);
  });
});
```

**Step 2: Run the test**

Run:

```bash
npm test -- tests/unit/sidebar-store.test.ts
```

Expected: FAIL because the store is not implemented.

**Step 3: Implement the sidebar data layer**

Support three collections:

- `recordings`
- `favorites`
- `expressions`

Persist them in local storage or IndexedDB through a thin adapter. Wire the translation popover’s “收藏词句” action to the store and render live sidebar updates.

**Step 4: Verify**

Run:

```bash
npm test -- tests/unit/sidebar-store.test.ts
npm run lint
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/features/sidebar/sidebar-store.ts src/features/sidebar/sidebar-storage.ts src/components/reader/learning-sidebar.tsx src/components/reader/translation-popover.tsx src/components/reader/app-shell.tsx tests/unit/sidebar-store.test.ts
git commit -m "feat: persist sidebar learning collections"
```

### Task 5: Implement the Siri-Style Recording Button and Recording State Machine

**Files:**
- Create: `src/features/recording/recorder-schema.ts`
- Create: `src/features/recording/recorder.ts`
- Modify: `src/components/reader/recording-button.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/recorder.test.ts`

**Step 1: Write the failing recorder test**

Create `tests/unit/recorder.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { nextRecordingState } from "@/features/recording/recorder";

describe("nextRecordingState", () => {
  test("moves from idle to recording on primary click", () => {
    expect(nextRecordingState("idle", "primary-click")).toBe("recording");
  });
});
```

**Step 2: Run the test**

Run:

```bash
npm test -- tests/unit/recorder.test.ts
```

Expected: FAIL because the state machine is not implemented.

**Step 3: Implement the minimal state machine**

Support these states only:

- `idle`
- `recording`
- `processing`
- `error`

Use `MediaRecorder` in a hook or controller and keep the component API simple:

```ts
type RecordingController = {
  state: "idle" | "recording" | "processing" | "error";
  startOrStop: () => Promise<void>;
};
```

The button UI should mirror the `.pen` prototype:

- idle: glowing mic circle
- recording: stronger glow/ripple and elapsed timer
- processing: spinner or pulsing processing label

**Step 4: Verify**

Run:

```bash
npm test -- tests/unit/recorder.test.ts
npm run lint
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/features/recording/recorder-schema.ts src/features/recording/recorder.ts src/components/reader/recording-button.tsx src/components/reader/app-shell.tsx tests/unit/recorder.test.ts
git commit -m "feat: add siri-style recording control"
```

### Task 6: Add Transcription and AI Analysis Contracts

**Files:**
- Create: `src/features/analysis/analysis-schema.ts`
- Create: `src/features/analysis/analysis-client.ts`
- Create: `src/app/api/transcribe/route.ts`
- Create: `src/app/api/analysis/route.ts`
- Modify: `src/features/recording/recorder.ts`
- Modify: `src/components/reader/app-shell.tsx`
- Create: `src/lib/env.ts`
- Test: `tests/unit/analysis-schema.test.ts`

**Step 1: Write the failing analysis contract test**

Create `tests/unit/analysis-schema.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { analysisResultSchema } from "@/features/analysis/analysis-schema";

describe("analysisResultSchema", () => {
  test("accepts transcript, corrected text, grammar note, and coach feedback", () => {
    const result = analysisResultSchema.parse({
      transcript: "People knew Multivac well...",
      corrected: "People felt close to Multivac...",
      grammar: "know ... very well is too flat here.",
      nativeExpression: "its mysteries still seemed beyond them",
      coachFeedback: "Use stronger contrast words like yet or while."
    });
    expect(result.nativeExpression).toMatch(/beyond them/);
  });
});
```

**Step 2: Run the test**

Run:

```bash
npm test -- tests/unit/analysis-schema.test.ts
```

Expected: FAIL because the schema and routes do not exist.

**Step 3: Implement route contracts with mock-first behavior**

Create:

- `POST /api/transcribe`
- `POST /api/analysis`

Start with stable mock outputs when env vars are missing. This keeps the UI buildable before real provider wiring.

Suggested route response:

```ts
{
  transcript: string;
  corrected: string;
  grammar: string;
  nativeExpression: string;
  coachFeedback: string;
}
```

Only after the mock contract is stable should the route optionally call real providers via env vars such as:

- `OPENAI_API_KEY`
- `TRANSCRIPTION_MODEL`
- `ANALYSIS_MODEL`

**Step 4: Verify**

Run:

```bash
npm test -- tests/unit/analysis-schema.test.ts
npm run lint
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/features/analysis/analysis-schema.ts src/features/analysis/analysis-client.ts src/app/api/transcribe/route.ts src/app/api/analysis/route.ts src/features/recording/recorder.ts src/components/reader/app-shell.tsx src/lib/env.ts tests/unit/analysis-schema.test.ts
git commit -m "feat: add ai transcription and analysis contracts"
```

### Task 7: Build the Feedback Modal and Recording-to-Sidebar Flow

**Files:**
- Create: `src/components/reader/analysis-modal.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `src/components/reader/learning-sidebar.tsx`
- Modify: `src/features/sidebar/sidebar-store.ts`
- Test: `tests/unit/analysis-modal.test.tsx`

**Step 1: Write the failing modal behavior test**

Create `tests/unit/analysis-modal.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalysisModal } from "@/components/reader/analysis-modal";

test("closes when the backdrop is clicked", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  render(
    <AnalysisModal
      open
      onClose={onClose}
      result={{
        transcript: "People knew Multivac well...",
        corrected: "People felt close to Multivac...",
        grammar: "More natural contrast needed.",
        nativeExpression: "its mysteries still seemed beyond them",
        coachFeedback: "Use yet for smoother contrast."
      }}
    />
  );

  await user.click(screen.getByTestId("analysis-backdrop"));
  expect(onClose).toHaveBeenCalled();
});
```

**Step 2: Run the test**

Run:

```bash
npm test -- tests/unit/analysis-modal.test.tsx
```

Expected: FAIL because the modal does not exist.

**Step 3: Implement the feedback flow**

Wire the full happy path:

1. User clicks the recording button
2. Audio capture ends
3. `/api/transcribe` returns transcript
4. `/api/analysis` returns structured feedback
5. `AnalysisModal` opens in the `Feedback View` state
6. Closing the modal keeps the recording in sidebar history
7. “加入表达库” adds a derived expression entry

Match the modal information hierarchy in the `.pen` file, not just the raw data.

**Step 4: Verify**

Run:

```bash
npm test -- tests/unit/analysis-modal.test.tsx
npm run lint
```

Expected: pass.

**Step 5: Commit**

```bash
git add src/components/reader/analysis-modal.tsx src/components/reader/app-shell.tsx src/components/reader/learning-sidebar.tsx src/features/sidebar/sidebar-store.ts tests/unit/analysis-modal.test.tsx
git commit -m "feat: connect recording flow to analysis modal"
```

### Task 8: Add End-to-End Coverage for the Core Learning Loop

**Files:**
- Create: `tests/e2e/reader.spec.ts`
- Modify: `playwright.config.ts`
- Modify: `README.md`

**Step 1: Write the failing E2E test**

Create `tests/e2e/reader.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("reader core loop works with mock services", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/read in english/i)).toBeVisible();
  await expect(page.getByText(/你的学习沉淀/i)).toBeVisible();

  await page.getByRole("button", { name: /start retelling/i }).click();
  await page.getByRole("button", { name: /stop retelling/i }).click();

  await expect(page.getByText(/复述分析结果/i)).toBeVisible();
  await page.getByRole("button", { name: /加入表达库/i }).click();
  await expect(page.getByText(/表达库/i)).toBeVisible();
});
```

**Step 2: Run the test**

Run:

```bash
npm run test:e2e -- tests/e2e/reader.spec.ts
```

Expected: FAIL until the app exposes stable accessible names and mock analysis flow.

**Step 3: Add the missing accessibility and test hooks**

Ensure the UI exposes reliable selectors:

- recording button accessible name changes by state
- modal buttons use visible text
- sidebar sections expose stable text

Document the mock mode and required env vars in `README.md`.

**Step 4: Verify**

Run:

```bash
npm test
npm run lint
npm run test:e2e -- tests/e2e/reader.spec.ts
```

Expected: all pass.

**Step 5: Commit**

```bash
git add tests/e2e/reader.spec.ts playwright.config.ts README.md src/components/reader/recording-button.tsx src/components/reader/analysis-modal.tsx src/components/reader/learning-sidebar.tsx src/components/reader/app-shell.tsx
git commit -m "test: cover reader learning loop end to end"
```

## Notes for the Implementer

- Keep the first release desktop-only in layout decisions. Mobile can be deferred.
- Do not add user auth, cloud sync, or multi-document workspace in this iteration.
- Keep translation, transcription, and analysis behind typed contracts so providers can be swapped later.
- Treat the Pencil file as the visual truth for spacing, hierarchy, and component states.
- Prefer mock-first API routes so UI work and backend integration can progress independently.

## Definition of Done

- The home page visually matches the current Pencil prototype at a functional level.
- A sample PDF renders and supports selection-driven translation popovers.
- The Siri-style record button supports idle, recording, and processing states.
- Mock transcription and analysis routes produce the modal and sidebar updates.
- Sidebar state persists across refreshes.
- Unit tests and the main Playwright flow pass locally.
