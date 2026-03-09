# PDF Upload Entry MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an MVP local PDF upload flow so the desktop reader starts in an empty state, lets the user open a small top-right document menu, upload a single local PDF, and render it in the reading stage on the same page.

**Architecture:** Keep file state in `AppShell` and flow it down into `TopBar` and `PdfStage`. Use a hidden file input in the shell, object URLs for the selected local file, and explicit stage states (`empty`, `loading`, `ready`, `error`) so the upload flow and reader view stay on one page without introducing persistence or file management.

**Tech Stack:** Next.js App Router, React 19, TypeScript, react-pdf, Tailwind CSS, Vitest, React Testing Library, Playwright.

---

### Task 1: Add upload state and schema types

**Files:**
- Create: `src/features/pdf/pdf-file-state.ts`
- Test: `tests/unit/pdf-file-state.test.ts`

**Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";

import { createPdfStageState } from "@/features/pdf/pdf-file-state";

test("returns empty state when no file is selected", () => {
  expect(createPdfStageState(null, false, null)).toEqual({
    status: "empty",
    documentName: "未打开文档",
    source: null,
    error: null,
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/pdf-file-state.test.ts`

Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

- Create a small helper that derives:
  - `status: "empty" | "loading" | "ready" | "error"`
  - `documentName`
  - `source`
  - `error`

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/pdf-file-state.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/pdf/pdf-file-state.ts tests/unit/pdf-file-state.test.ts
git commit -m "feat: add pdf upload stage state helper"
```

### Task 2: Make the top bar document pill interactive

**Files:**
- Modify: `src/components/reader/top-bar.tsx`
- Test: `tests/unit/top-bar-upload-menu.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { TopBar } from "@/components/reader/top-bar";

test("opens the document menu and shows upload action", async () => {
  const user = userEvent.setup();

  render(
    <TopBar
      documentLabel="未打开文档"
      menuOpen={false}
      onToggleMenu={vi.fn()}
      onUploadClick={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: /未打开文档/i }));

  expect(screen.getByRole("menuitem", { name: /上传 pdf/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/top-bar-upload-menu.test.tsx`

Expected: FAIL because `TopBar` is static and does not expose a document menu.

**Step 3: Write minimal implementation**

- Convert the document pill into a button
- Render a lightweight anchored menu
- Add only one item: `上传 PDF`
- Support controlled props:
  - `documentLabel`
  - `menuOpen`
  - `onToggleMenu`
  - `onUploadClick`

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/top-bar-upload-menu.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/top-bar.tsx tests/unit/top-bar-upload-menu.test.tsx
git commit -m "feat: add upload menu to top bar document pill"
```

### Task 3: Add empty and loading states to the reading stage

**Files:**
- Modify: `src/components/reader/pdf-stage.tsx`
- Test: `tests/unit/pdf-stage-empty-state.test.tsx`

**Step 1: Write the failing tests**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { PdfStage } from "@/components/reader/pdf-stage";

test("shows empty state when no pdf source is available", () => {
  render(
    <PdfStage
      documentName="未打开文档"
      error={null}
      source={null}
      status="empty"
    />,
  );

  expect(screen.getByText(/upload a pdf to start reading/i)).toBeInTheDocument();
});

test("shows loading state while a selected pdf is being prepared", () => {
  render(
    <PdfStage
      documentName="lesson-3.pdf"
      error={null}
      source={null}
      status="loading"
    />,
  );

  expect(screen.getByText(/loading pdf/i)).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- tests/unit/pdf-stage-empty-state.test.tsx`

Expected: FAIL because `PdfStage` still hard-codes the sample reader view.

**Step 3: Write minimal implementation**

- Add controlled props for:
  - `status`
  - `documentName`
  - `source`
  - `error`
- Render:
  - empty state
  - loading state
  - ready state with `PdfViewer`
  - error state

**Step 4: Run tests to verify they pass**

Run: `npm test -- tests/unit/pdf-stage-empty-state.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/pdf-stage.tsx tests/unit/pdf-stage-empty-state.test.tsx
git commit -m "feat: add empty and loading states to pdf stage"
```

### Task 4: Wire local file selection into the app shell

**Files:**
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/app-shell-upload-flow.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { AppShell } from "@/components/reader/app-shell";

test("updates the reader when a local pdf is selected", async () => {
  const user = userEvent.setup();
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:lesson-3");

  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /未打开文档/i }));
  const upload = screen.getByLabelText(/upload pdf input/i);

  await user.upload(
    upload,
    new File(["pdf"], "lesson-3.pdf", { type: "application/pdf" }),
  );

  expect(await screen.findByText(/lesson-3\.pdf/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/app-shell-upload-flow.test.tsx`

Expected: FAIL because the shell does not manage file input or object URLs yet.

**Step 3: Write minimal implementation**

- Add a hidden `<input type="file" accept="application/pdf,.pdf">`
- Keep local state for:
  - selected file name
  - object URL
  - menu open
  - loading/error
- Trigger the hidden input from the upload menu
- Create and revoke object URLs safely

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/app-shell-upload-flow.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/app-shell.tsx tests/unit/app-shell-upload-flow.test.tsx
git commit -m "feat: wire local pdf upload into reader shell"
```

### Task 5: Disable or weaken recording when no document is open

**Files:**
- Modify: `src/components/reader/recording-button.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/recording-button-disabled.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { RecordingButton } from "@/components/reader/recording-button";

test("disables recording interaction when no document is open", () => {
  render(<RecordingButton disabled onStop={async () => {}} />);
  expect(screen.getByRole("button", { name: /start retelling/i })).toBeDisabled();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/recording-button-disabled.test.tsx`

Expected: FAIL because the recording button does not support a disabled prop yet.

**Step 3: Write minimal implementation**

- Add `disabled` support to `RecordingButton`
- Keep the button visible but muted
- Drive the prop from `AppShell` based on whether a PDF is open

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/recording-button-disabled.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/recording-button.tsx src/components/reader/app-shell.tsx tests/unit/recording-button-disabled.test.tsx
git commit -m "feat: disable recording before pdf load"
```

### Task 6: Add error handling for invalid file selection and render failure

**Files:**
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `src/components/reader/pdf-stage.tsx`
- Test: `tests/unit/pdf-upload-error.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { AppShell } from "@/components/reader/app-shell";

test("shows inline error when a non-pdf file is selected", async () => {
  const user = userEvent.setup();

  render(<AppShell />);

  await user.click(screen.getByRole("button", { name: /未打开文档/i }));
  await user.upload(
    screen.getByLabelText(/upload pdf input/i),
    new File(["bad"], "notes.txt", { type: "text/plain" }),
  );

  expect(await screen.findByText(/please choose a pdf/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/pdf-upload-error.test.tsx`

Expected: FAIL because invalid file selection is not handled yet.

**Step 3: Write minimal implementation**

- Validate MIME type and file extension
- Surface inline error in the reading stage
- Clear error after a valid PDF is selected

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/pdf-upload-error.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/app-shell.tsx src/components/reader/pdf-stage.tsx tests/unit/pdf-upload-error.test.tsx
git commit -m "feat: handle invalid local pdf selections"
```

### Task 7: Cover the core upload flow end-to-end

**Files:**
- Modify: `tests/e2e/reader.spec.ts`

**Step 1: Write the failing e2e scenario**

```ts
import { expect, test } from "@playwright/test";

test("opens a local pdf from the top-right document menu", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /未打开文档/i }).click();
  await page.getByRole("menuitem", { name: /上传 pdf/i }).click();

  await expect(page.getByText(/lesson-3\.pdf/i)).toBeVisible();
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/reader.spec.ts`

Expected: FAIL because the current UI has no upload entry or empty-state flow.

**Step 3: Write minimal implementation support**

- Extend the existing Playwright flow to upload a local PDF fixture
- Assert:
  - empty state initially visible
  - document menu opens
  - selected file name appears
  - reading stage swaps to ready state

**Step 4: Run full verification**

Run: `npm test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run test:e2e -- tests/e2e/reader.spec.ts`
Expected: PASS

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/e2e/reader.spec.ts
git commit -m "test: cover local pdf upload entry flow"
```
