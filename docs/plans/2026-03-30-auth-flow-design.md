# CorgiRead Auth Flow Design

## Overview

This design updates the current email-only Supabase authentication flow so the first account activation remains email-link based, while later sign-ins switch to a lightweight in-app email-code flow. The reader stays guest-first, and authenticated mode continues to unlock the cloud PDF library and cloud-backed sidebar records.

## Goals

- Keep guest mode intact.
- Keep the first account activation secure and simple.
- Remove the need to click an email login link on every later sign-in.
- Persist authenticated state across refreshes and browser restarts.
- Reuse the existing top-right avatar entry and lightweight auth modal.

## Product Behavior

### First Registration

When a user enters an email that does not yet represent a verified account:

- the app sends a verification email link
- the modal shows a "check your inbox" state
- the user completes account activation from the email link
- after returning to the site, the app reads the Supabase session and upgrades the UI into authenticated mode

This remains the only email-link step in the normal lifecycle.

### Later Login

When a user enters an email that already belongs to a verified account:

- the app sends a short email verification code
- the modal switches into an in-app code-entry state
- the user enters the code inside the modal
- the app verifies the code and restores the authenticated workspace without requiring another click from email

### Login Persistence

Authenticated state should persist locally using the Supabase client session and app-level session synchronization:

- refresh keeps the user logged in
- reopening the site keeps the user logged in while the session remains valid
- logout clears the local authenticated state and returns the app to guest mode

## Authentication Model

The system uses Supabase as the source of truth.

- Whether an email is considered "first registration" or "later login" must be determined on the server.
- The decision is based on whether a Supabase auth user exists and has a verified email identity.
- The frontend must not infer this from local cache.

## UX Flow

### Step 1: Email Entry

The auth modal starts in an `email-entry` state:

- one email field
- one primary action button
- no explicit "register" vs "login" choice in the UI

The system decides the correct flow after submission.

### Step 2A: Signup Link Sent

For new or not-yet-verified emails:

- the modal switches to `signup-link-sent`
- copy explains that a first-time verification link was sent
- the modal does not ask for a code
- the page can remain open while the user checks email

### Step 2B: Login Code Entry

For already verified users:

- the modal switches to `code-entry`
- the modal displays the submitted email
- the user enters a 6-digit code
- a resend action is available

### Step 3: Session Recovery

The app must actively hydrate the authenticated state:

- on initial load
- on auth state change
- after returning from a verification link
- optionally when the page regains focus

This prevents the UI from getting stuck in a stale guest or waiting state.

## Technical Design

### Frontend

The existing auth modal expands from one state into three:

- `email-entry`
- `signup-link-sent`
- `code-entry`

The modal remains a lightweight overlay and does not become a full account page.

The app shell becomes responsible for restoring auth state from Supabase on startup and syncing it into the existing Zustand auth store.

### Backend

Add one small server route that determines email flow type:

- input: email
- output:
  - `signup-link`
  - `login-code`

This route uses Supabase server-side access to inspect whether the target auth user exists and has already completed verification.

### Supabase Usage

Use Supabase as follows:

- first registration: send a magic link / signup verification link
- later login: send an OTP code for in-app verification
- auth persistence: rely on the Supabase browser client session with `persistSession: true`

The app should not introduce a separate custom cookie-based login system.

## Error Handling

### Registration Flow

If the target email is new or unverified:

- show a neutral "check your inbox" message
- do not reveal detailed account existence state

### Code Login Flow

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

- Never let the client decide whether an email is new or verified.
- Do not expose raw user existence details in the UI.
- Do not replace Supabase session handling with a custom auth cookie system.
- Use server-side checks for email flow selection.

## Testing Scope

The implementation should cover:

- route-level email flow selection
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
