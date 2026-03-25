"use client";

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

import type { AuthSession } from "@/features/auth/auth-schema";

type AuthState = {
  session: AuthSession;
  setGuest: () => void;
  setAuthenticated: (email: string) => void;
};

export function createAuthStore(initialSession?: AuthSession) {
  return createStore<AuthState>()((set) => ({
    session: initialSession ?? {
      status: "guest",
      email: null,
    },
    setGuest: () =>
      set({
        session: {
          status: "guest",
          email: null,
        },
      }),
    setAuthenticated: (email) =>
      set({
        session: {
          status: "authenticated",
          email,
        },
      }),
  }));
}

export const authStore = createAuthStore();

export function useAuthStore<T>(selector: (state: AuthState) => T) {
  return useStore(authStore, selector);
}
