# User System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a lightweight Supabase-based user system to CorgiRead so authenticated users have private cloud-backed PDF storage and cloud-backed learning data while guest mode remains fully usable.

**Architecture:** Keep the current reader shell and guest workflow intact, then layer in Supabase Auth, Storage, and Postgres-backed user data. The top-right round avatar stays visually consistent in both guest and authenticated states, while authenticated mode adds a left-side PDF library overlay, cloud-backed right-sidebar data, and cloud-backed PDF upload. Security relies on Supabase RLS and user-scoped storage paths.

**Tech Stack:** Next.js App Router, React 19, Zustand, Supabase Auth, Supabase Storage, Supabase Postgres, Zod, Vitest, Playwright

---

### Task 1: Add Supabase environment and client scaffolding

**Files:**
- Create: `src/features/auth/auth-env.ts`
- Create: `src/features/auth/supabase-browser.ts`
- Create: `src/features/auth/supabase-server.ts`
- Modify: `.env.example`
- Modify: `README.md`
- Test: `tests/unit/auth-env.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { getAuthConfig } from "@/features/auth/auth-env";

describe("getAuthConfig", () => {
  test("returns configured Supabase project values", () => {
    const config = getAuthConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(config.url).toBe("https://example.supabase.co");
    expect(config.anonKey).toBe("anon-key");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/auth-env.test.ts`
Expected: FAIL because auth env module does not exist yet.

**Step 3: Write minimal implementation**

- Create `getAuthConfig()` in `src/features/auth/auth-env.ts`
- Return `url` and `anonKey`
- Add thin browser/server Supabase client helpers with clear server-only and browser-only boundaries
- Add documented variables to `.env.example`
- Add README auth setup section

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/auth-env.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/auth/auth-env.ts src/features/auth/supabase-browser.ts src/features/auth/supabase-server.ts .env.example README.md tests/unit/auth-env.test.ts
git commit -m "feat: add supabase auth config"
```

### Task 2: Add auth session model and avatar-based top-bar auth state

**Files:**
- Create: `src/features/auth/auth-schema.ts`
- Create: `src/features/auth/auth-store.ts`
- Modify: `src/components/reader/top-bar.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/top-bar-auth-state.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { TopBar } from "@/components/reader/top-bar";

test("shows avatar entry for guests", () => {
  render(<TopBar isAuthenticated={false} />);
  expect(screen.getByRole("button", { name: /account/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/top-bar-auth-state.test.tsx`
Expected: FAIL because top bar does not expose a shared avatar-based guest/authenticated user entry yet.

**Step 3: Write minimal implementation**

- Add auth schema and local auth store for current session UI state
- Update top bar so guest and authenticated states both use the same round avatar shell
- Keep current upload control behavior intact
- Render the PDF library trigger only for authenticated users

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/top-bar-auth-state.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/auth/auth-schema.ts src/features/auth/auth-store.ts src/components/reader/top-bar.tsx src/components/reader/app-shell.tsx tests/unit/top-bar-auth-state.test.tsx
git commit -m "feat: add avatar-based auth top bar state"
```

### Task 3: Add lightweight email login overlay from avatar entry

**Files:**
- Create: `src/components/reader/auth-modal.tsx`
- Create: `src/features/auth/auth-client.ts`
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/auth-modal.test.tsx`

**Step 1: Write the failing test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { AppShell } from "@/components/reader/app-shell";

test("opens login modal from guest user entry", () => {
  render(<AppShell />);
  fireEvent.click(screen.getByRole("button", { name: /account/i }));
  expect(screen.getByText(/email verification/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/auth-modal.test.tsx`
Expected: FAIL because login overlay does not exist.

**Step 3: Write minimal implementation**

- Add lightweight auth modal
- Collect email and start the mixed Supabase email flow: verification link for first registration, in-app email code for returning login
- Open the modal from the guest avatar entry rather than a text login chip
- Keep failure state inline and non-blocking
- Closing the modal must return users to the current reader state

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/auth-modal.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/auth-modal.tsx src/features/auth/auth-client.ts src/components/reader/app-shell.tsx src/components/reader/top-bar.tsx tests/unit/auth-modal.test.tsx
git commit -m "feat: add email login overlay"
```

### Task 4: Define user data contracts for cloud-backed reader data

**Files:**
- Create: `src/features/library/library-schema.ts`
- Create: `src/features/sidebar/sidebar-cloud-schema.ts`
- Test: `tests/unit/library-schema.test.ts`

**Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { pdfDocumentSchema } from "@/features/library/library-schema";

test("accepts minimal cloud pdf metadata", () => {
  const result = pdfDocumentSchema.parse({
    id: "doc-1",
    userId: "user-1",
    fileName: "lesson-1.pdf",
    fileSizeBytes: 2048,
    storagePath: "users/user-1/pdf/doc-1.pdf",
    createdAt: "2026-03-25T10:00:00.000Z",
  });

  expect(result.fileName).toBe("lesson-1.pdf");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/library-schema.test.ts`
Expected: FAIL because library schema does not exist.

**Step 3: Write minimal implementation**

- Define schemas for cloud-backed PDF metadata
- Define schemas for cloud-backed recordings, favorites, and expression entries
- Keep shapes aligned with current sidebar UI needs

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/library-schema.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/library/library-schema.ts src/features/sidebar/sidebar-cloud-schema.ts tests/unit/library-schema.test.ts
git commit -m "feat: define cloud reader data contracts"
```

### Task 5: Add authenticated PDF upload service

**Files:**
- Create: `src/features/library/library-client.ts`
- Create: `src/features/library/storage-path.ts`
- Modify: `src/features/pdf/pdf-file-state.ts`
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/library-client.test.ts`

**Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { buildPdfStoragePath } from "@/features/library/storage-path";

test("builds user-scoped pdf storage paths", () => {
  expect(buildPdfStoragePath("user-1", "doc-1")).toBe("users/user-1/pdf/doc-1.pdf");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/library-client.test.ts`
Expected: FAIL because library upload client does not exist.

**Step 3: Write minimal implementation**

- Add authenticated upload flow to Supabase Storage
- Write PDF metadata rows to cloud storage table
- Keep guest uploads local-only
- Reject upload when authenticated user has reached quota

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/library-client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/library/library-client.ts src/features/library/storage-path.ts src/features/pdf/pdf-file-state.ts src/components/reader/app-shell.tsx tests/unit/library-client.test.ts
git commit -m "feat: add cloud pdf upload flow"
```

### Task 6: Add left-side PDF library overlay

**Files:**
- Create: `src/components/reader/pdf-library-panel.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `src/components/reader/top-bar.tsx`
- Test: `tests/unit/pdf-library-panel.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { PdfLibraryPanel } from "@/components/reader/pdf-library-panel";

test("renders pdf file metadata rows", () => {
  render(
    <PdfLibraryPanel
      isOpen
      documents={[{
        id: "doc-1",
        userId: "user-1",
        fileName: "lesson-1.pdf",
        fileSizeBytes: 2048,
        storagePath: "users/user-1/pdf/doc-1.pdf",
        createdAt: "2026-03-25T10:00:00.000Z",
      }]}
      onClose={() => {}}
      onOpenDocument={() => {}}
    />,
  );

  expect(screen.getByText("lesson-1.pdf")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/pdf-library-panel.test.tsx`
Expected: FAIL because the PDF library overlay does not exist.

**Step 3: Write minimal implementation**

- Add left-side overlay panel
- Show file name, upload time, and file size
- Close on backdrop click
- Block reader interaction while open
- Only render trigger and panel for authenticated users
- Keep the top-right avatar unchanged while the PDF library feature appears as a separate authenticated-only trigger

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/pdf-library-panel.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/pdf-library-panel.tsx src/components/reader/app-shell.tsx src/components/reader/top-bar.tsx tests/unit/pdf-library-panel.test.tsx
git commit -m "feat: add pdf library overlay"
```

### Task 7: Add cloud-backed sidebar reads and writes

**Files:**
- Create: `src/features/sidebar/sidebar-cloud-client.ts`
- Modify: `src/features/sidebar/sidebar-store.ts`
- Modify: `src/components/reader/learning-sidebar.tsx`
- Modify: `src/components/reader/translation-popover.tsx`
- Modify: `src/components/reader/analysis-modal.tsx`
- Test: `tests/unit/sidebar-cloud-client.test.ts`
- Test: `tests/unit/learning-sidebar-cloud-state.test.tsx`

**Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { mapFavoriteToCloudRow } from "@/features/sidebar/sidebar-cloud-client";

test("maps sidebar favorites into cloud row shape", () => {
  expect(mapFavoriteToCloudRow({
    id: "12-hello",
    sourceText: "hello",
    translatedText: "你好",
    type: "sentence",
    page: 12,
  }).source_text).toBe("hello");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/sidebar-cloud-client.test.ts tests/unit/learning-sidebar-cloud-state.test.tsx`
Expected: FAIL because cloud sidebar sync is not implemented.

**Step 3: Write minimal implementation**

- Add Supabase-backed read/write layer for recordings, favorites, and expressions
- Keep local guest data path intact
- Switch sidebar source based on auth state
- Reuse current UI without changing tab structure

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/sidebar-cloud-client.test.ts tests/unit/learning-sidebar-cloud-state.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/sidebar/sidebar-cloud-client.ts src/features/sidebar/sidebar-store.ts src/components/reader/learning-sidebar.tsx src/components/reader/translation-popover.tsx src/components/reader/analysis-modal.tsx tests/unit/sidebar-cloud-client.test.ts tests/unit/learning-sidebar-cloud-state.test.tsx
git commit -m "feat: add cloud-backed sidebar data"
```

### Task 8: Add quota checks and lightweight cloud error states

**Files:**
- Create: `src/features/library/quota.ts`
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `src/components/reader/pdf-library-panel.tsx`
- Test: `tests/unit/quota.test.ts`
- Test: `tests/unit/app-shell-cloud-errors.test.tsx`

**Step 1: Write the failing test**

```ts
import { expect, test } from "vitest";
import { canUploadFileWithinQuota } from "@/features/library/quota";

test("rejects upload when file exceeds remaining quota", () => {
  expect(
    canUploadFileWithinQuota({
      storageQuotaBytes: 1024,
      storageUsedBytes: 900,
      incomingFileSizeBytes: 200,
    }),
  ).toBe(false);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/quota.test.ts tests/unit/app-shell-cloud-errors.test.tsx`
Expected: FAIL because quota helpers and cloud upload error UI do not exist.

**Step 3: Write minimal implementation**

- Add quota guard helper
- Show lightweight quota/upload/login/data-load error messages
- Keep failure paths non-blocking for guest reading

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/quota.test.ts tests/unit/app-shell-cloud-errors.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/library/quota.ts src/components/reader/app-shell.tsx src/components/reader/pdf-library-panel.tsx tests/unit/quota.test.ts tests/unit/app-shell-cloud-errors.test.tsx
git commit -m "feat: add quota and cloud error states"
```

### Task 9: Verify integration and document Supabase setup

**Files:**
- Modify: `README.md`
- Create: `docs/plans/2026-03-25-user-system-rollout-notes.md`
- Test: `tests/e2e/reader.spec.ts`

**Step 1: Write the failing test**

Add an authenticated-mode fixture or test expectation to `tests/e2e/reader.spec.ts` that verifies:

- guest avatar opens login path
- authenticated upload trigger path
- PDF library panel visibility
- cloud-backed sidebar mode indicator or loaded content

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- tests/e2e/reader.spec.ts`
Expected: FAIL because authenticated mode behavior is not fully wired yet.

**Step 3: Write minimal implementation**

- Complete any missing integration glue
- Document Supabase setup in README
- Add rollout notes for required tables, bucket, and RLS policies

**Step 4: Run verification**

Run:

```bash
npm test
npm run lint
npm run build
npm run test:e2e -- tests/e2e/reader.spec.ts
```

Expected:

- all unit tests pass
- lint passes
- build passes
- e2e flow passes

**Step 5: Commit**

```bash
git add README.md docs/plans/2026-03-25-user-system-rollout-notes.md tests/e2e/reader.spec.ts
git commit -m "feat: complete user system integration"
```
