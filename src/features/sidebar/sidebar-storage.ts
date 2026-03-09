export const SIDEBAR_STORAGE_KEY = "corgi-read-sidebar";

export type SidebarStorageShape = {
  favorites: Array<{
    id: string;
    sourceText: string;
    translatedText: string;
    type: "word" | "phrase" | "sentence";
    page: number;
  }>;
  recordings: Array<{
    id: string;
    createdAt: string;
    page: number;
    summary: string;
    feedback: string;
  }>;
  expressions: Array<{
    id: string;
    phrase: string;
    note: string;
    sourceRecordingId: string;
  }>;
};

export function loadSidebarState(): SidebarStorageShape | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SidebarStorageShape;
  } catch {
    return null;
  }
}

export function saveSidebarState(state: SidebarStorageShape) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(state));
}
