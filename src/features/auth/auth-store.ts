"use client";

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

import { guestAuthSession, type AuthSession } from "@/features/auth/auth-schema";

type AuthState = {
  session: AuthSession;
  setGuest: () => void;
  setAuthenticated: (
    userId: string,
    email: string,
    storageQuotaBytes?: number,
    storageUsedBytes?: number,
  ) => void;
};

export function createAuthStore(initialSession?: AuthSession) {
  return createStore<AuthState>()((set) => ({
    session: initialSession ?? guestAuthSession,
    setGuest: () =>
      set({
        session: guestAuthSession,
      }),
    setAuthenticated: (
      userId,
      email,
      storageQuotaBytes,
      storageUsedBytes,
    ) =>
      set({
        session: {
          status: "authenticated",
          userId,
          email,
          storageQuotaBytes,
          storageUsedBytes,
        },
      }),
  }));
}

export const authStore = createAuthStore();

export function useAuthStore<T>(selector: (state: AuthState) => T) {
  return useStore(authStore, selector);
}
