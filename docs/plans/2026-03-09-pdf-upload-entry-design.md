# PDF Upload Entry MVP Design

**Date:** 2026-03-09

**Scope:** Add a first-use PDF upload entry to the desktop reader so the user can click the document area in the top-right bar, open a minimal menu, upload a single local PDF, and immediately read it on the same page.

---

## 1. Goal

The current MVP already renders a fixed sample PDF and supports translation, retelling, transcription, and analysis. What it does not yet support is the core reader behavior of opening a user-selected local file.

This phase adds the smallest usable file-opening loop:

- user enters the reader
- the reading area starts in an empty state
- the top-right document pill is clickable
- clicking it opens a lightweight menu
- the menu contains a single action: `上传 PDF`
- user selects one local `.pdf`
- the same page swaps from empty state into the reading view

The focus is not document management. It is only the first local file open experience.

---

## 2. Constraints

- Desktop-first only
- Single local file only
- No persistence across refresh
- No multi-file list or recent files
- No drag-and-drop
- No new route for file management
- Existing translation, recording, and AI structure should stay intact

The reader should still feel like a reading tool, not like a storage browser or upload dashboard.

---

## 3. Verified Current State

The current UI already has the right skeleton for this change:

- [`src/components/reader/top-bar.tsx`](/Users/cyc/Documents/Code/corgi-read/src/components/reader/top-bar.tsx) contains a static document pill in the top-right area
- [`src/components/reader/pdf-stage.tsx`](/Users/cyc/Documents/Code/corgi-read/src/components/reader/pdf-stage.tsx) renders the fixed sample PDF and translation popover
- [`src/components/reader/app-shell.tsx`](/Users/cyc/Documents/Code/corgi-read/src/components/reader/app-shell.tsx) composes the full reader layout

This means the best path is to preserve the current layout and replace only:

- the top-right document affordance
- the default content state of the reading panel
- the PDF source flow

---

## 4. Proposed Approaches

### Approach A: Keep the sample PDF, add upload as a replacement action

User still lands on the sample PDF. The top-right document pill becomes clickable and can replace the current PDF.

Pros:

- minimal disruption to current demo flow

Cons:

- conflicts with the approved empty-state direction
- weakens the “this is your reader” feeling

### Approach B: Empty reader by default with document-pill upload entry, recommended

The reader stage starts empty. The top-right document pill shows `未打开文档`, opens a tiny menu, and file selection swaps the stage into the reading view.

Pros:

- matches the approved MVP behavior
- preserves the current reading-page structure
- adds the upload feature without inventing a separate file manager

Cons:

- the upload entry must be visually clear enough or users may miss it

### Approach C: Dedicated file panel or modal

Introduce a stronger file chooser panel before entering reading.

Pros:

- high discoverability

Cons:

- too heavy for the MVP
- turns a reading product into a workflow tool

**Recommendation:** Approach B.

---

## 5. Information Architecture

This phase keeps the existing three-region page structure:

- top toolbar
- main reading area
- right learning sidebar

Only two regions change materially.

### 5.1 Top-right document entry

The current static document pill becomes a stateful trigger.

States:

- no file open: `未打开文档`
- file open: the uploaded file name, for example `lesson-3.pdf`

Behavior:

- click opens a lightweight anchored menu
- menu contains only one item: `上传 PDF`
- clicking outside closes the menu

This remains part of the top bar, not a separate navigation system.

### 5.2 Main reading area

The reading area needs two primary states.

#### Empty Reader View

Used when no PDF is loaded.

Contents:

- a short title such as `Upload a PDF to start reading`
- a brief supporting line telling the user to use the top-right document entry
- the same editorial paper-like framing as the current reading stage

This should not look like a generic admin upload page. It should still feel like part of the reading surface.

#### Reader View

Used after a PDF is selected and loaded.

Contents:

- PDF toolbar
- PDF canvas
- translation popover support
- existing reading layout

The page should swap states in place, without route changes.

---

## 6. Interaction Flow

### 6.1 Initial entry

User enters the page.

- top-right document pill shows `未打开文档`
- reading area is empty state
- right learning sidebar stays visible
- recording button remains visually present but should be weakened or disabled

### 6.2 Open upload menu

User clicks the top-right document pill.

- a small menu opens beneath or near the pill
- menu contains `上传 PDF`
- no nested actions or secondary options

### 6.3 Select file

Clicking `上传 PDF` opens the system file picker.

Requirements:

- only allow a single file
- accept `.pdf`
- no batch upload

### 6.4 Loading

After selection:

- document pill updates to the selected file name
- reading area enters a lightweight loading state
- once loaded, swap to the full reader view

The loading state can be small and embedded rather than a full-screen blocker.

### 6.5 Replace current file

If a file is already open:

- user can click the document pill again
- use the same menu and the same `上传 PDF` action
- selecting another file replaces the current reading content directly

No confirmation dialog is needed in this MVP.

---

## 7. Component Changes

### 7.1 Top bar

[`src/components/reader/top-bar.tsx`](/Users/cyc/Documents/Code/corgi-read/src/components/reader/top-bar.tsx) should evolve from static display to a controlled component.

It should receive:

- current document label
- whether a file is open
- menu open state
- upload trigger callback

It should not own the selected file itself. File state belongs higher up in the reader shell.

### 7.2 Reader stage

[`src/components/reader/pdf-stage.tsx`](/Users/cyc/Documents/Code/corgi-read/src/components/reader/pdf-stage.tsx) should stop hard-coding the sample file as the only state.

It should support:

- `empty`
- `loading`
- `ready`
- `error`

Inputs should include:

- current file source
- current document name
- whether upload is still pending

### 7.3 App shell

[`src/components/reader/app-shell.tsx`](/Users/cyc/Documents/Code/corgi-read/src/components/reader/app-shell.tsx) should become the coordinator for:

- selected local file
- derived object URL
- current document name
- upload menu open state
- file-loading lifecycle

This keeps file state at the page-shell level where both top bar and reading stage can consume it.

### 7.4 Recording button

The bottom recording control should remain in place, but when no file is open it should be visually muted or disabled so the layout stays stable while signaling that reading content is missing.

---

## 8. Error Handling

This phase should handle only a small set of errors:

- user selects a non-PDF file
- browser fails to create or load the object URL
- PDF rendering fails after selection

Behavior:

- keep the user on the same page
- show a small inline error in the reading area
- do not clear the whole shell or sidebar

No global error center is needed.

---

## 9. Out of Scope

This phase does not include:

- drag-and-drop upload
- persistence across refresh
- recent files
- multiple open files
- server-side file storage
- upload progress UI
- file deletion or rename actions
- mobile-first upload flow

---

## 10. Success Criteria

This design is successful when all of the following are true:

- user can discover a single upload entry from the top-right document area
- the initial reading panel is an intentional empty state
- selecting one local PDF opens it on the same page
- the current file can be replaced by uploading another one
- the reader remains visually aligned with the existing prototype and MVP
