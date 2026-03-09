"use client";

import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

import type { AnalysisResult } from "@/features/analysis/analysis-schema";
import {
  loadSidebarState,
  saveSidebarState,
  type SidebarStorageShape,
} from "@/features/sidebar/sidebar-storage";

export type FavoriteItem = SidebarStorageShape["favorites"][number];
export type RecordingItem = SidebarStorageShape["recordings"][number];
export type ExpressionItem = SidebarStorageShape["expressions"][number];
type SidebarTab = "录音" | "收藏" | "表达库";

type SidebarState = SidebarStorageShape & {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  addFavorite: (item: FavoriteItem) => void;
  addRecording: (item: RecordingItem) => void;
  addExpression: (item: ExpressionItem) => void;
};

const defaultState: SidebarStorageShape = {
  recordings: [
    {
      id: "recording-1",
      createdAt: "08:42 PM",
      page: 12,
      summary:
        "The author shows that people felt close to Multivac, but never fully understood it.",
      feedback:
        "AI 点评：理解准确，表达自然度中等，句子连接词可以更像母语者。",
      analysis: {
        transcript:
          "People knew Multivac well, but its mysteries still felt beyond them.",
        corrected:
          "People felt close to Multivac, yet its mysteries still seemed beyond them.",
        grammar:
          "Use felt close to and yet to create a more natural contrast than knew well but.",
        nativeExpression: "its mysteries still seemed beyond them",
        coachFeedback:
          "Your retelling is accurate. Push contrast words harder to sound more native.",
      } satisfies AnalysisResult,
    },
  ],
  favorites: [
    {
      id: "favorite-1",
      sourceText: "faithful attendants of Multivac",
      translatedText: "Multivac 的忠实看护者",
      type: "sentence",
      page: 12,
    },
  ],
  expressions: [
    {
      id: "expression-1",
      phrase: "They felt close to Multivac, yet its mysteries stayed beyond them.",
      note: "更地道的对比句式，可替换“they know it well but...”这样的平直表达。",
      sourceRecordingId: "recording-1",
    },
  ],
};

const emptyState: SidebarStorageShape = {
  recordings: [],
  favorites: [],
  expressions: [],
};

function selectPersistedState(state: SidebarState): SidebarStorageShape {
  return {
    favorites: state.favorites,
    recordings: state.recordings,
    expressions: state.expressions,
  };
}

export function createSidebarStore(
  initialState?: Partial<SidebarStorageShape>,
  options?: { seedDefaults?: boolean },
) {
  const persisted =
    typeof window === "undefined" ? null : loadSidebarState();
  const baseSeed = options?.seedDefaults ? defaultState : emptyState;

  const baseState: SidebarStorageShape = {
    ...baseSeed,
    ...persisted,
    ...initialState,
  };

  const store = createStore<SidebarState>()((set) => ({
    activeTab: "录音",
    ...baseState,
    setActiveTab: (tab) => set({ activeTab: tab }),
    addFavorite: (item) => {
      set((state) => {
        const favorites = state.favorites.some((favorite) => favorite.id === item.id)
          ? state.favorites
          : [item, ...state.favorites];
        const nextState = { favorites, activeTab: "收藏" as const };
        saveSidebarState({ ...selectPersistedState(state), ...nextState });
        return nextState;
      });
    },
    addRecording: (item) => {
      set((state) => {
        const recordings = [item, ...state.recordings];
        saveSidebarState({
          ...selectPersistedState(state),
          recordings,
        });
        return { recordings, activeTab: "录音" as const };
      });
    },
    addExpression: (item) => {
      set((state) => {
        const expressions = state.expressions.some(
          (expression) => expression.id === item.id,
        )
          ? state.expressions
          : [item, ...state.expressions];
        saveSidebarState({
          ...selectPersistedState(state),
          expressions,
        });
        return { expressions, activeTab: "表达库" as const };
      });
    },
  }));

  return store;
}

export const sidebarStore = createSidebarStore(undefined, {
  seedDefaults: true,
});

export function useSidebarStore<T>(selector: (state: SidebarState) => T) {
  return useStore(sidebarStore, selector);
}
