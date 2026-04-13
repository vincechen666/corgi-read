# CorgiRead Auth Flow Design

## Overview

This design updates the current email-only Supabase authentication flow so sign-in and sign-up both use a lightweight in-app email-code flow. The reader stays guest-first, and authenticated mode continues to unlock the cloud PDF library and cloud-backed sidebar records.

## Goals

- Keep guest mode intact.
- Keep authentication secure and simple.
- Remove the need to click email links during sign-in.
- Persist authenticated state across refreshes and browser restarts.
- Reuse the existing top-right avatar entry and lightweight auth modal.

## Product Behavior

### Unified Login

When a user enters an email:

- the app sends a short email verification code
- the modal switches into an in-app code-entry state
- the user enters the code inside the modal
- the app verifies the code and restores the authenticated workspace without requiring another click from email
- if the email is new, Supabase creates the account during the OTP flow

### Login Persistence

Authenticated state should persist locally using the Supabase client session and app-level session synchronization:

- refresh keeps the user logged in
- reopening the site keeps the user logged in while the session remains valid
- logout clears the local authenticated state and returns the app to guest mode

## Authentication Model

The system uses Supabase as the source of truth.

- The same email OTP flow is used for both new and returning users.
- Supabase remains the source of truth for the resulting session.
- The frontend must not attempt to maintain a separate custom auth model.

## UX Flow

### Step 1: Email Entry

The auth modal starts in an `email-entry` state:

- one email field
- one primary action button
- no explicit "register" vs "login" choice in the UI

After submission:

### Step 2: Code Entry

- the modal switches to `code-entry`
- the modal displays the submitted email
- the user enters a 6-digit code
- a resend action is available

### Step 3: Session Recovery

The app must actively hydrate the authenticated state:

- on initial load
- on auth state change
- optionally when the page regains focus

This prevents the UI from getting stuck in a stale guest or waiting state.

## Technical Design

### Frontend

The existing auth modal expands from one state into two:

- `email-entry`
- `code-entry`

The modal remains a lightweight overlay and does not become a full account page.

The app shell becomes responsible for restoring auth state from Supabase on startup and syncing it into the existing Zustand auth store.

### Backend

No flow-selection route is needed. The browser client can send OTP directly with `shouldCreateUser: true`, and verification still happens in-app.

### Supabase Usage

Use Supabase as follows:

- send an OTP code for in-app verification for every email
- allow new users to be created during OTP send
- auth persistence: rely on the Supabase browser client session with `persistSession: true`

The app should not introduce a separate custom cookie-based login system.

## Error Handling

If the code is wrong, stale, or replaced by a newer code:

- show a single friendly error
- allow resend
- keep the user in the code-entry state

### Session Sync

If the app cannot restore the Supabase session:

- fall back to guest mode
- do not block the reader
- let the user retry login from the avatar entry

## Security Principles

- Do not expose raw user existence details in the UI.
- Do not replace Supabase session handling with a custom auth cookie system.
- Keep the browser flow centered on OTP send + OTP verify only.

## Testing Scope

The implementation should cover:

- auth modal state transitions
- OTP verification state and resend behavior
- session hydration on page load
- logout and guest fallback
- regression coverage for cloud PDF library and cloud-backed sidebar data

## Out Of Scope

- social login
- password login
- account management pages
- multi-factor auth beyond email verification
- local-only pseudo-auth without Supabase
