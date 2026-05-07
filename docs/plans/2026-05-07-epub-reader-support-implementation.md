# EPUB Reader Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add EPUB reading support alongside the existing PDF reader.

**Architecture:** Detect document kind at upload/library boundaries, preserve the current source-based reader state, and render through a PDF or EPUB viewer inside the existing stage. Reuse the existing cloud metadata table and signed URL flow, changing only path and content-type handling per file kind.

**Tech Stack:** Next.js, React, Vitest, Testing Library, react-pdf, epubjs, Supabase storage.

---

### Task 1: Document Kind Utilities

**Files:**
- Create: `src/features/document/document-types.ts`
- Test: `tests/unit/document-types.test.ts`

**Steps:**
1. Write failing tests for PDF and EPUB MIME/extension detection.
2. Run `npm test -- tests/unit/document-types.test.ts` and confirm failure.
3. Implement `getDocumentKindFromFile`, `normalizeDocumentLabel`, and `getDocumentExtension`.
4. Re-run the same test and confirm pass.

### Task 2: Storage Paths and Cloud Upload

**Files:**
- Modify: `src/features/library/storage-path.ts`
- Modify: `src/features/library/library-client.ts`
- Test: `tests/unit/library-client.test.ts`

**Steps:**
1. Add failing tests for EPUB storage path and uploaded content type.
2. Run `npm test -- tests/unit/library-client.test.ts` and confirm failure.
3. Thread document kind into upload plan/path/content-type.
4. Re-run the same test and confirm pass.

### Task 3: Reader Stage Dispatch

**Files:**
- Create: `src/components/reader/epub-viewer.tsx`
- Modify: `src/components/reader/pdf-stage.tsx`
- Test: `tests/unit/pdf-stage-epub.test.tsx`

**Steps:**
1. Add failing stage test for `documentKind="epub"`.
2. Run `npm test -- tests/unit/pdf-stage-epub.test.tsx` and confirm failure.
3. Install `epubjs`, add a dynamic EPUB viewer, and dispatch based on `documentKind`.
4. Re-run the same test and confirm pass.

### Task 4: App Shell Integration

**Files:**
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `src/components/reader/top-bar.tsx`
- Modify: `src/components/reader/pdf-library-panel.tsx`
- Test: `tests/unit/app-shell-upload-flow.test.tsx`
- Test: `tests/unit/top-bar-upload-menu.test.tsx`

**Steps:**
1. Add failing tests for EPUB local upload and upload menu copy.
2. Run targeted tests and confirm failure.
3. Use document kind utilities in file selection and library opening; update copy and accept list.
4. Re-run targeted tests and confirm pass.

### Task 5: Verification

**Files:**
- Existing test suite.

**Steps:**
1. Run `npm test`.
2. Run `npm run lint`.
3. Fix regressions without reverting unrelated user changes.
