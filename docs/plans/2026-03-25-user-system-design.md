# CorgiRead User System Design

## Overview

This design adds a lightweight user system to CorgiRead without changing the current guest-first reader workflow. Guest users can continue using the current MVP locally. Logged-in users gain a private cloud workspace with:

- 1 GB initial storage quota
- private PDF storage
- private learning records for recordings, favorites, and expression library items
- a left-side PDF library panel for reopening uploaded documents

The goal is to keep the experience simple: login upgrades the existing reader into a personal cloud workspace instead of replacing it with a separate dashboard product.

## Product Principles

- Keep guest mode intact. The app must remain usable without login.
- Keep login lightweight. First registration uses an email verification link, and returning users sign in with an in-app email code.
- Keep the main reader flow unchanged. Upload, read, translate, and retell should feel familiar.
- Keep cloud data personal. Every PDF and every note belongs to one user.
- Keep UI additions minimal. Reuse existing top bar, reader workspace, and right sidebar.

## User Experience

### Guest Mode

Guests can continue using the current local MVP:

- local single-PDF upload
- local reading session
- local right-sidebar data for recordings, favorites, and expressions

There is no PDF library entry in guest mode.

### Logged-In Mode

After login, the app switches into user-cloud mode:

- uploaded PDFs are stored in the user’s cloud storage
- the right sidebar reads user-owned cloud data
- a left-side PDF library panel becomes available
- users can reopen previously uploaded PDFs

Login is progressive enhancement, not a hard gate.

## Authentication

The first release uses Supabase Auth with a mixed email flow.

- First registration uses an email verification link
- Returning login uses an in-app email code
- `NEXT_PUBLIC_SITE_URL` remains required for the first-time verification link
- No social login in the first version
- No password-heavy account management in the first version
- The top-right round avatar area becomes the login / user entry point
- The same round avatar shape is shown in both guest and authenticated states
- State changes affect behavior and menu content, not the top-bar silhouette

States:

- guest: avatar opens lightweight login flow
- authenticated: avatar opens lightweight user menu, PDF library feature enabled

## Information Architecture

### Top Bar

- Right-side avatar entry is always rendered as a small round icon button
- Guest state: clicking the avatar opens the email login overlay
- Authenticated state: clicking the avatar opens a lightweight user menu
- The document trigger, reading-mode pill, and avatar sit in a tighter right-aligned cluster with reduced spacing
- The top bar should not switch between rectangle and avatar variants across auth states

### Left-Side PDF Library

The PDF library is a hidden overlay panel, not a permanent third column.

- hidden by default
- only visible for authenticated users
- opens from a left-side trigger in the top bar
- overlays the reader from the left
- blocks interaction with the reading surface while open
- closes when users click outside the panel

Each item shows:

- file name
- upload time
- file size

Selecting an item opens it in the main reading area.

### Center Reading Area

The reading area keeps the current behavior. The only behavioral difference is the source of files:

- guest uploads stay local
- authenticated uploads are saved to the user’s cloud storage and opened in the reader

When the PDF library overlay is open:

- the reading surface is visually masked
- reader interactions are blocked until the overlay closes

### Right Sidebar

The existing `录音 / 收藏 / 表达库` structure stays unchanged.

Data source changes by mode:

- guest: local persisted browser data
- authenticated: user-owned cloud data

## Storage Model

Each authenticated user gets an initial 1 GB quota.

Product meaning:

- PDFs belong to the user’s private storage
- notes also belong to the user’s private space

First-release quota accounting:

- PDF size is counted precisely
- notes are treated as user-owned data but are not byte-accurately deducted from quota yet

This keeps the quota model simple without adding low-value byte accounting complexity for tiny note records.

## Data Model

### `profiles`

Stores lightweight user profile and quota information.

- `id`
- `email`
- `storage_quota_bytes`
- `storage_used_bytes`

### `pdf_documents`

Stores PDF metadata for each user.

- `id`
- `user_id`
- `file_name`
- `file_size_bytes`
- `storage_path`
- `created_at`

Actual files are stored in Supabase Storage.

Suggested storage path pattern:

- `users/{user_id}/pdf/{document_id}.pdf`

### `recordings`

Stores structured retelling history only, not raw audio.

- `id`
- `user_id`
- `document_id`
- `page`
- `transcript`
- `corrected`
- `grammar`
- `native_expression`
- `coach_feedback`
- `created_at`

### `favorites`

Stores saved selections.

- `id`
- `user_id`
- `document_id`
- `source_text`
- `translated_text`
- `type`
- `page`
- `created_at`

### `expression_library`

Stores reusable expression entries.

- `id`
- `user_id`
- `document_id`
- `source_phrase`
- `natural_phrase`
- `note`
- `created_at`

## Architecture

The recommended architecture is Supabase-first:

- Supabase Auth for mixed email login
- Supabase Storage for PDFs
- Supabase Postgres for user metadata and learning data
- RLS and storage policies for user isolation
- Session persistence is restored through Supabase client session hydration

This keeps the system lightweight while maintaining a clean security boundary.

## Core Flows

### Login

1. User clicks the round avatar entry in the top-right corner
2. First-time users complete the verification link flow
3. Returning users enter the in-app email code
4. UI switches to authenticated mode
5. PDF library becomes available
6. Right sidebar reads cloud-backed user data

### Authenticated PDF Upload

1. User uploads a PDF from the existing upload flow
2. File is saved to Supabase Storage
3. Metadata is saved to `pdf_documents`
4. The file opens in the reader
5. The PDF appears in the PDF library list

### Reopen Cloud PDF

1. User opens the PDF library panel
2. User selects a file
3. The panel closes
4. The selected PDF opens in the reader

### Close PDF Library

1. User clicks outside the left-side PDF library panel
2. The overlay closes
3. Reading interaction becomes active again

### Cloud Notes

When authenticated:

- favorites are stored in cloud-backed `favorites`
- recordings are stored in cloud-backed `recordings`
- expression entries are stored in cloud-backed `expression_library`

## Security and Isolation

- Users can only access their own rows
- Users can only access their own storage objects
- The frontend must rely on authenticated session identity, not arbitrary client-provided user IDs
- Every user-facing data table must be scoped by `user_id`

## Error Handling

### Login Failure

- Show a lightweight error message
- Keep the reader usable in guest mode

### Cloud Upload Failure

- If cloud save fails, the app should avoid breaking the current reading flow
- The user should receive a clear failure message

### Cloud Data Load Failure

- Right sidebar or PDF library should show a lightweight error/empty state
- The main reader should remain usable

### Storage Quota Exceeded

- Prevent cloud PDF upload when the user exceeds quota
- Show a clear “1 GB limit reached” style message

## Out of Scope for First Release

- social login
- custom avatars
- reading-position sync
- team sharing
- collaborative notes
- raw audio cloud storage
- paid storage expansion
- automatic migration of guest local data into the cloud

## Testing Focus

The first implementation should validate:

- guest vs authenticated UI behavior
- user-private data isolation
- authenticated PDF upload and list retrieval
- cloud-backed right sidebar data loading
- quota exceeded handling
- login and data-load failure states

## Prototype Alignment

The current prototype source of truth is:

- `designs/english-pdf-reader-prototype.pen`

The first implementation should follow these prototype constraints:

- `Login Overlay View`: guest state still uses the same round top-right avatar entry
- `Cloud Reader View`: authenticated state keeps the same avatar shell and unlocks the PDF library trigger
- `PDF Library Open View`: the left overlay panel masks the reading area and closes on outside click
- the right-side top-bar cluster uses compact spacing between document trigger, mode/library pill, and avatar
