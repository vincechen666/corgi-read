# PDF Upload Progress Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a thin upload progress bar above the PDF reader for authenticated cloud PDF uploads, while preserving immediate local reading and current cloud error behavior.

**Architecture:** Keep the existing reader-first upload flow: open the local `blob:` immediately, then upload the file to Supabase Storage in the background. Replace the authenticated storage upload path with a resumable/TUS-based upload that reports progress, store that progress in `AppShell`, and render a lightweight progress bar inside the reading pane. Guests continue using the current local-only path with no progress UI.

**Tech Stack:** Next.js App Router, React 19, Supabase JS, Supabase Storage resumable uploads, Zustand, Vitest, ESLint

---

### Task 1: Add upload progress UI contract

**Files:**
- Create: `src/features/library/upload-progress.ts`
- Test: `tests/unit/upload-progress.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/upload-progress.test.ts`:

```ts
import { expect, test } from "vitest";

import { toUploadProgressPercent } from "@/features/library/upload-progress";

test("converts uploaded bytes to a clamped percentage", () => {
  expect(toUploadProgressPercent(0, 100)).toBe(0);
  expect(toUploadProgressPercent(50, 100)).toBe(50);
  expect(toUploadProgressPercent(150, 100)).toBe(100);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/upload-progress.test.ts`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Create `src/features/library/upload-progress.ts` with:

```ts
export function toUploadProgressPercent(uploaded: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((uploaded / total) * 100)));
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/upload-progress.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/library/upload-progress.ts tests/unit/upload-progress.test.ts
git commit -m "feat: add upload progress helper"
```

### Task 2: Replace authenticated storage upload with progress-aware uploader

**Files:**
- Modify: `src/features/library/library-client.ts`
- Test: `tests/unit/library-client.test.ts`

**Step 1: Write the failing test**

Extend `tests/unit/library-client.test.ts` to cover:

- authenticated upload accepts a progress callback
- upload callback receives percentage updates during storage transfer
- metadata insert still uses snake_case database fields

Mock the upload layer so the test can drive:

```ts
onProgress(50, 100);
onProgress(100, 100);
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/library-client.test.ts`
Expected: FAIL because the upload function has no progress callback support.

**Step 3: Write minimal implementation**

Refactor `uploadPdfDocumentToCloud()` in `src/features/library/library-client.ts`:

- accept an optional `onProgress(percent: number): void`
- use a progress-capable upload path for authenticated storage uploads
- emit progress during file upload
- keep metadata insert and cleanup logic intact
- continue throwing:
  - `Storage quota exceeded`
  - `Supabase storage upload failed: ...`
  - `Supabase metadata insert failed: ...`

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/library-client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/library/library-client.ts tests/unit/library-client.test.ts
git commit -m "feat: add progress-aware cloud pdf upload"
```

### Task 3: Add reader-pane upload progress bar UI

**Files:**
- Modify: `src/components/reader/pdf-stage.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/pdf-stage-upload-progress.test.tsx`
- Test: `tests/unit/app-shell-cloud-upload-plan.test.tsx`

**Step 1: Write the failing tests**

Create `tests/unit/pdf-stage-upload-progress.test.tsx` with cases for:

- progress bar hidden by default
- progress bar renders when upload state is active
- progress bar shows the expected width/percentage state

Extend `tests/unit/app-shell-cloud-upload-plan.test.tsx` with cases for:

- authenticated upload displays progress
- progress reaches completion and then hides
- guest upload never shows progress

**Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/unit/pdf-stage-upload-progress.test.tsx tests/unit/app-shell-cloud-upload-plan.test.tsx
```

Expected: FAIL because no upload progress UI exists yet.

**Step 3: Write minimal implementation**

In `src/components/reader/app-shell.tsx`:

- add upload progress state:
  - `isCloudUploadActive`
  - `cloudUploadProgressPercent`
- set progress state when authenticated upload begins
- pass `onProgress` into `uploadPdfDocumentToCloud()`
- clear progress on success or failure

In `src/components/reader/pdf-stage.tsx`:

- accept progress props
- render a thin progress bar above the PDF.js content area only when active

**Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- tests/unit/pdf-stage-upload-progress.test.tsx tests/unit/app-shell-cloud-upload-plan.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/pdf-stage.tsx src/components/reader/app-shell.tsx tests/unit/pdf-stage-upload-progress.test.tsx tests/unit/app-shell-cloud-upload-plan.test.tsx
git commit -m "feat: show upload progress in reader pane"
```

### Task 4: Preserve current failure semantics

**Files:**
- Modify: `tests/unit/app-shell-cloud-errors.test.tsx`
- Modify: `tests/unit/app-shell-upload-flow.test.tsx`

**Step 1: Write the failing tests**

Add or extend cases for:

- quota exceeded does not show upload progress
- cloud upload failure hides progress and preserves local reading
- metadata insert failure hides progress and surfaces the cloud error banner

**Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/unit/app-shell-cloud-errors.test.tsx tests/unit/app-shell-upload-flow.test.tsx
```

Expected: FAIL because progress cleanup is not fully covered yet.

**Step 3: Write minimal implementation**

Adjust `src/components/reader/app-shell.tsx` only if needed so:

- quota rejection never enables progress
- failed uploads always clear progress state
- local reader state remains intact after cloud failure

**Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- tests/unit/app-shell-cloud-errors.test.tsx tests/unit/app-shell-upload-flow.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/app-shell.tsx tests/unit/app-shell-cloud-errors.test.tsx tests/unit/app-shell-upload-flow.test.tsx
git commit -m "fix: keep upload progress aligned with cloud failure states"
```

### Task 5: Final verification

**Files:**
- No new files expected

**Step 1: Run targeted tests**

```bash
npm test -- tests/unit/library-client.test.ts tests/unit/pdf-stage-upload-progress.test.tsx tests/unit/app-shell-cloud-upload-plan.test.tsx tests/unit/app-shell-cloud-errors.test.tsx tests/unit/app-shell-upload-flow.test.tsx
```

Expected: PASS

**Step 2: Run lint**

```bash
npm run lint
```

Expected: PASS

**Step 3: Run production build**

```bash
npm run build
```

Expected: PASS

**Step 4: Commit if verification changes were needed**

```bash
git status --short
```

If empty, no commit needed. If verification required small cleanup changes, commit them with:

```bash
git add <files>
git commit -m "chore: finalize pdf upload progress"
```
