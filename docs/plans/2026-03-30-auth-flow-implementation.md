# Auth Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current always-magic-link auth flow with a mixed flow where first-time users verify by email link, returning users log in with an in-app email code, and authenticated state restores automatically across reloads.

**Architecture:** Keep Supabase as the single auth provider. Add a small server route that classifies an email into `signup-link` or `login-code`, extend the auth modal into a multi-state flow, and hydrate the app auth store from the Supabase browser session on startup and auth changes. Preserve guest mode and all existing cloud workspace behavior.

**Tech Stack:** Next.js App Router, React 19, Supabase JS, Zustand, Vitest, ESLint

---

### Task 1: Add Email Flow Selection Contract

**Files:**
- Create: `src/features/auth/auth-flow-schema.ts`
- Test: `tests/unit/auth-flow-schema.test.ts`

**Step 1: Write the failing test**

Create `tests/unit/auth-flow-schema.test.ts`:

```ts
import { describe, expect, test } from "vitest";

import { authEmailFlowResponseSchema } from "@/features/auth/auth-flow-schema";

describe("authEmailFlowResponseSchema", () => {
  test("accepts signup-link and login-code flow responses", () => {
    expect(
      authEmailFlowResponseSchema.parse({ flow: "signup-link" }).flow,
    ).toBe("signup-link");

    expect(
      authEmailFlowResponseSchema.parse({ flow: "login-code" }).flow,
    ).toBe("login-code");
  });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/auth-flow-schema.test.ts
```

Expected: FAIL because the schema file does not exist.

**Step 3: Write minimal implementation**

Create `src/features/auth/auth-flow-schema.ts` with:

```ts
import { z } from "zod";

export const authEmailFlowResponseSchema = z.object({
  flow: z.enum(["signup-link", "login-code"]),
});
```

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/auth-flow-schema.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/auth/auth-flow-schema.ts tests/unit/auth-flow-schema.test.ts
git commit -m "feat: add auth flow response schema"
```

### Task 2: Add Server Route For Email Flow Detection

**Files:**
- Create: `src/app/api/auth/email-flow/route.ts`
- Create: `src/features/auth/server/email-flow-service.ts`
- Modify: `src/features/auth/supabase-server.ts`
- Test: `tests/unit/email-flow-service.test.ts`
- Test: `tests/unit/email-flow-route.test.ts`

**Step 1: Write the failing tests**

Create `tests/unit/email-flow-service.test.ts` with cases for:

- verified user returns `login-code`
- missing user returns `signup-link`
- unverified user returns `signup-link`

Create `tests/unit/email-flow-route.test.ts` with cases for:

- valid email request returns `{ flow }`
- invalid payload returns `400`

**Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/unit/email-flow-service.test.ts tests/unit/email-flow-route.test.ts
```

Expected: FAIL because the route and service do not exist.

**Step 3: Write minimal implementation**

Implement:

- `src/features/auth/server/email-flow-service.ts`
  - server-only logic
  - inspect Supabase auth user state
  - return `signup-link` or `login-code`
- `src/app/api/auth/email-flow/route.ts`
  - parse email
  - call service
  - return JSON using the shared schema

Keep the route response intentionally small:

```ts
return Response.json({ flow: "login-code" });
```

**Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- tests/unit/email-flow-service.test.ts tests/unit/email-flow-route.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/auth/email-flow/route.ts src/features/auth/server/email-flow-service.ts src/features/auth/supabase-server.ts tests/unit/email-flow-service.test.ts tests/unit/email-flow-route.test.ts
git commit -m "feat: add auth email flow route"
```

### Task 3: Split Browser Auth Client Into Link And Code Actions

**Files:**
- Modify: `src/features/auth/auth-client.ts`
- Test: `tests/unit/auth-client.test.ts`

**Step 1: Write the failing tests**

Extend `tests/unit/auth-client.test.ts` to cover:

- `startEmailSignupLink(email)` uses `signInWithOtp` with `emailRedirectTo`
- `startEmailLoginCode(email)` uses `signInWithOtp` without redirect link forcing the code flow contract
- `verifyEmailLoginCode(email, token)` calls the correct Supabase verify API

**Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- tests/unit/auth-client.test.ts
```

Expected: FAIL because the new functions do not exist.

**Step 3: Write minimal implementation**

Refactor `src/features/auth/auth-client.ts` into:

- `getEmailRedirectTo()`
- `startEmailSignupLink(email)`
- `startEmailLoginCode(email)`
- `verifyEmailLoginCode(email, token)`

Keep the current redirect URL behavior for signup links:

- prefer `NEXT_PUBLIC_SITE_URL`
- fall back to `window.location.origin`

**Step 4: Run tests to verify they pass**

Run:

```bash
npm test -- tests/unit/auth-client.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/auth/auth-client.ts tests/unit/auth-client.test.ts
git commit -m "feat: split auth client into signup link and code flows"
```

### Task 4: Expand The Auth Modal Into Multi-Step UI

**Files:**
- Modify: `src/components/reader/auth-modal.tsx`
- Test: `tests/unit/auth-modal.test.tsx`

**Step 1: Write the failing tests**

Create `tests/unit/auth-modal.test.tsx` with cases for:

- email-entry state renders email field and submit button
- signup-link response shows the inbox instructions state
- login-code response shows a code input state
- code verification error shows an error message

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/auth-modal.test.tsx
```

Expected: FAIL because the modal only supports one email-submit state.

**Step 3: Write minimal implementation**

Update `src/components/reader/auth-modal.tsx` to support:

- `email-entry`
- `signup-link-sent`
- `code-entry`

Behavior:

- submit email -> call `/api/auth/email-flow`
- if flow is `signup-link`, call signup-link sender and show inbox message
- if flow is `login-code`, call login-code sender and switch to code input
- submit code -> verify code in-app
- include `Resend code` in code-entry state

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/auth-modal.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/auth-modal.tsx tests/unit/auth-modal.test.tsx
git commit -m "feat: add multi-step auth modal"
```

### Task 5: Hydrate App Auth State From Supabase Session

**Files:**
- Modify: `src/components/reader/app-shell.tsx`
- Modify: `src/features/auth/auth-store.ts`
- Modify: `src/features/auth/auth-schema.ts`
- Test: `tests/unit/app-shell-auth-session.test.tsx`

**Step 1: Write the failing tests**

Create `tests/unit/app-shell-auth-session.test.tsx` with cases for:

- existing Supabase session hydrates auth store on mount
- auth state changes switch app state to authenticated
- logout returns app state to guest

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/app-shell-auth-session.test.tsx
```

Expected: FAIL because app-shell does not subscribe to Supabase auth state.

**Step 3: Write minimal implementation**

Update `src/components/reader/app-shell.tsx` to:

- create a Supabase browser client when config is available
- read the current session on mount
- subscribe to auth state changes
- map Supabase session data into `authStore.setAuthenticated(...)`
- clear to guest when the session is absent

Keep existing guest-mode behavior intact.

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/app-shell-auth-session.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/app-shell.tsx src/features/auth/auth-store.ts src/features/auth/auth-schema.ts tests/unit/app-shell-auth-session.test.tsx
git commit -m "feat: hydrate auth state from supabase session"
```

### Task 6: Add Authenticated User Menu And Logout

**Files:**
- Modify: `src/components/reader/top-bar.tsx`
- Modify: `src/components/reader/app-shell.tsx`
- Test: `tests/unit/app-shell-auth-avatar.test.tsx`

**Step 1: Write the failing test**

Extend `tests/unit/app-shell-auth-avatar.test.tsx` to verify:

- guest avatar opens auth modal
- authenticated avatar opens user menu
- logout returns to guest mode

**Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/unit/app-shell-auth-avatar.test.tsx
```

Expected: FAIL because authenticated avatar does not yet expose a logout menu.

**Step 3: Write minimal implementation**

Update the top bar and app shell so:

- guest avatar opens auth modal
- authenticated avatar opens a small user menu
- menu shows email and `退出登录`
- logout signs out from Supabase and clears auth store

**Step 4: Run test to verify it passes**

Run:

```bash
npm test -- tests/unit/app-shell-auth-avatar.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/reader/top-bar.tsx src/components/reader/app-shell.tsx tests/unit/app-shell-auth-avatar.test.tsx
git commit -m "feat: add authenticated avatar menu"
```

### Task 7: Update Docs And Verify Regression Coverage

**Files:**
- Modify: `README.md`
- Modify: `docs/plans/2026-03-25-user-system-design.md`
- Modify: `docs/plans/2026-03-25-user-system-implementation.md`
- Test: existing auth, sidebar, and library tests as needed

**Step 1: Update documentation**

Document:

- first registration uses an email link
- later login uses an in-app email code
- `NEXT_PUBLIC_SITE_URL` remains required for first-time verification links
- session persistence is handled through Supabase client session hydration

**Step 2: Run focused regression checks**

Run:

```bash
npm test -- tests/unit/auth-client.test.ts tests/unit/auth-modal.test.tsx tests/unit/app-shell-auth-session.test.tsx tests/unit/app-shell-auth-avatar.test.tsx tests/unit/app-shell-pdf-library.test.tsx
npm run lint
```

Expected: PASS

**Step 3: Run broader verification**

Run:

```bash
npm test
npm run build
```

Expected: PASS

**Step 4: Commit**

```bash
git add README.md docs/plans/2026-03-25-user-system-design.md docs/plans/2026-03-25-user-system-implementation.md
git commit -m "docs: update auth flow references"
```
