# Auth Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify authentication into a single in-app email OTP flow where any email can request a code, verification happens inside the modal, and Supabase creates new users automatically when needed.

**Architecture:** Keep Supabase as the only auth provider. Remove server-side flow classification, send OTP directly from the browser with `shouldCreateUser: true`, verify the code in-app, and hydrate the existing auth store from the Supabase browser session on startup and auth changes.

**Tech Stack:** Next.js App Router, React 19, Supabase JS, Zustand, Vitest, ESLint

---

### Task 1: Collapse the browser auth client into a single OTP API

**Files:**
- Modify: `src/features/auth/auth-client.ts`
- Modify: `tests/unit/auth-client.test.ts`

**Work:**
- Remove signup-link helpers
- Keep only:
  - `startEmailLoginCode(email)`
  - `verifyEmailLoginCode(email, token)`
- Make OTP sending use `shouldCreateUser: true`

**Verification:**

```bash
npm test -- tests/unit/auth-client.test.ts
```

**Commit:**

```bash
git add src/features/auth/auth-client.ts tests/unit/auth-client.test.ts
git commit -m "feat: unify auth client around email otp"
```

### Task 2: Simplify the auth modal to email-entry + code-entry

**Files:**
- Modify: `src/components/reader/auth-modal.tsx`
- Modify: `tests/unit/auth-modal.test.tsx`

**Work:**
- Remove `signup-link-sent`
- Remove `/api/auth/email-flow` fetches
- Submitting an email should always:
  - send a code
  - switch to `code-entry`
- Keep resend and verify actions inside the modal
- Update copy so the flow clearly says “sign in or create your account”

**Verification:**

```bash
npm test -- tests/unit/auth-modal.test.tsx
```

**Commit:**

```bash
git add src/components/reader/auth-modal.tsx tests/unit/auth-modal.test.tsx
git commit -m "feat: simplify auth modal to otp flow"
```

### Task 3: Keep auth session recovery and success-state UI in sync

**Files:**
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `tests/unit/app-shell-auth-avatar.test.tsx`

**Work:**
- On startup, restore the Supabase session into `authStore`
- On auth state change, keep `authStore` synchronized
- When the session becomes authenticated:
  - close the auth modal
  - close the avatar menu
- Keep logout behavior unchanged

**Verification:**

```bash
npm test -- tests/unit/app-shell-auth-avatar.test.tsx
```

**Commit:**

```bash
git add src/components/reader/app-shell.tsx tests/unit/app-shell-auth-avatar.test.tsx
git commit -m "feat: sync app shell with otp auth state"
```

### Task 4: Remove obsolete mixed-flow server code

**Files:**
- Delete: `src/app/api/auth/email-flow/route.ts`
- Delete: `src/features/auth/auth-flow-schema.ts`
- Delete: `src/features/auth/server/email-flow-service.ts`
- Delete: `tests/unit/auth-flow-schema.test.ts`
- Delete: `tests/unit/email-flow-route.test.ts`
- Delete: `tests/unit/email-flow-service.test.ts`

**Work:**
- Remove the old route and schema entirely
- Make sure no remaining runtime code imports them

**Verification:**

```bash
npm test
```

**Commit:**

```bash
git add src/app/api/auth/email-flow/route.ts src/features/auth/auth-flow-schema.ts src/features/auth/server/email-flow-service.ts tests/unit/auth-flow-schema.test.ts tests/unit/email-flow-route.test.ts tests/unit/email-flow-service.test.ts
git commit -m "chore: remove mixed auth flow route"
```

### Task 5: Update docs and environment guidance

**Files:**
- Modify: `README.md`
- Modify: `docs/plans/2026-03-25-user-system-design.md`
- Modify: `docs/plans/2026-03-25-user-system-implementation.md`
- Modify: `docs/plans/2026-03-30-auth-flow-design.md`
- Modify: `.env.example` only if environment guidance changes

**Work:**
- Replace all “first verification link, later code login” wording with unified OTP wording
- Remove any requirement that `NEXT_PUBLIC_SITE_URL` is needed for auth flow
- Keep Supabase session persistence guidance

**Verification:**

```bash
npm run lint
npm run build
```

**Commit:**

```bash
git add README.md docs/plans/2026-03-25-user-system-design.md docs/plans/2026-03-25-user-system-implementation.md docs/plans/2026-03-30-auth-flow-design.md docs/plans/2026-03-30-auth-flow-implementation.md
git commit -m "docs: update auth flow to unified otp"
```

### Final Verification

Run before merge:

```bash
npm test
npm run lint
npm run build
```

Expected result:
- new users can request a code
- returning users can request a code
- verification happens inside the modal
- authenticated state restores after reload
- no mixed-flow route remains in the codebase
