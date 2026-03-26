import { expect, test } from "vitest";

import { createAuthStore } from "@/features/auth/auth-store";

test("stores a stable user id alongside the authenticated session", () => {
  const store = createAuthStore();

  store.getState().setAuthenticated("user-123", "reader@example.com");

  expect(store.getState().session).toEqual({
    status: "authenticated",
    userId: "user-123",
    email: "reader@example.com",
  });
});

test("clears the user id when returning to guest mode", () => {
  const store = createAuthStore({
    status: "authenticated",
    userId: "user-123",
    email: "reader@example.com",
  });

  store.getState().setGuest();

  expect(store.getState().session).toEqual({
    status: "guest",
    userId: null,
    email: null,
  });
});
