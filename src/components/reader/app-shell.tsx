"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  analyzeTranscript,
  transcribeAudio,
} from "@/features/analysis/analysis-client";
import type {
  AnalysisResult,
  AnalysisRouteResponse,
} from "@/features/analysis/analysis-schema";
import { AnalysisModal } from "@/components/reader/analysis-modal";
import { AuthModal } from "@/components/reader/auth-modal";
import { LearningSidebar } from "@/components/reader/learning-sidebar";
import {
  PdfLibraryPanel,
  type PdfLibraryDocument,
} from "@/components/reader/pdf-library-panel";
import { PdfStage } from "@/components/reader/pdf-stage";
import { RecordingButton } from "@/components/reader/recording-button";
import { TopBar } from "@/components/reader/top-bar";
import { authStore, useAuthStore } from "@/features/auth/auth-store";
import {
  authSessionFromSupabaseSession,
  authSessionSchema,
} from "@/features/auth/auth-schema";
import { createSupabaseBrowserClient } from "@/features/auth/supabase-browser";
import {
  loadPdfLibraryDocuments,
  uploadPdfDocumentToCloud,
} from "@/features/library/library-client";
import { canUploadFileWithinQuota } from "@/features/library/quota";
import {
  createPdfStageState,
  normalizePdfDocumentLabel,
} from "@/features/pdf/pdf-file-state";
import {
  hydrateSidebarStore,
  replaceSidebarStoreWithCloudData,
  restoreGuestSidebarStore,
  sidebarStore,
  useSidebarStore,
  type ExpressionItem,
  type FavoriteItem,
  type RecordingItem,
} from "@/features/sidebar/sidebar-store";
import {
  loadSidebarCloudState,
  saveExpressionToCloud,
  saveFavoriteToCloud,
  saveRecordingToCloud,
} from "@/features/sidebar/sidebar-cloud-client";
import { createSidebarItemId } from "@/features/sidebar/sidebar-id";

const E2E_AUTH_SESSION_STORAGE_KEY = "corgi-read-e2e-auth-session";

export function AppShell() {
  const authSession = useAuthStore((state) => state.session);
  const addFavorite = useSidebarStore((state) => state.addFavorite);
  const addRecording = useSidebarStore((state) => state.addRecording);
  const addExpression = useSidebarStore((state) => state.addExpression);
  const [activeAnalysis, setActiveAnalysis] = useState<{
    recordingId: string;
    result: AnalysisResult;
  } | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(
    null,
  );
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [lastAudioBlob, setLastAudioBlob] = useState<Blob | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [pdfSource, setPdfSource] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState("未打开文档");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isPdfLibraryOpen, setIsPdfLibraryOpen] = useState(false);
  const [isCloudUploadActive, setIsCloudUploadActive] = useState(false);
  const [cloudUploadProgressPercent, setCloudUploadProgressPercent] = useState(0);
  const [uploadedLibraryDocuments, setUploadedLibraryDocuments] = useState<
    PdfLibraryDocument[]
  >([]);
  const [cloudLibraryDocuments, setCloudLibraryDocuments] = useState<
    PdfLibraryDocument[]
  >([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [analysisMeta, setAnalysisMeta] = useState<AnalysisRouteResponse["meta"] | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const storageQuotaBytes =
    authSession.status === "authenticated"
      ? authSession.storageQuotaBytes
      : undefined;
  const storageUsedBytes =
    authSession.status === "authenticated"
      ? authSession.storageUsedBytes
      : undefined;
  const hasSupabaseBrowserConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  useEffect(() => {
    if (!hasSupabaseBrowserConfig) {
      return;
    }

    const client = createSupabaseBrowserClient();
    if (!client.auth?.getSession || !client.auth?.onAuthStateChange) {
      return;
    }

    let cancelled = false;

    const applySupabaseSession = (
      session: Awaited<ReturnType<typeof client.auth.getSession>>["data"]["session"],
    ) => {
      const nextSession = authSessionFromSupabaseSession(session);

      if (nextSession.status === "authenticated") {
        authStore.getState().setAuthenticated(
          nextSession.userId,
          nextSession.email,
          nextSession.storageQuotaBytes,
          nextSession.storageUsedBytes,
        );
        return;
      }

      authStore.getState().setGuest();
    };

    void client.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) {
          applySupabaseSession(session);
        }
      })
      .catch((error) => {
        console.error("[auth] failed to load Supabase session", error);
        if (!cancelled) {
          authStore.getState().setGuest();
        }
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      applySupabaseSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [hasSupabaseBrowserConfig]);

  useEffect(() => {
    return () => {
      if (pdfSource?.startsWith("blob:")) {
        URL.revokeObjectURL(pdfSource);
      }
    };
  }, [pdfSource]);

  useEffect(() => {
    hydrateSidebarStore(sidebarStore);
  }, []);

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_E2E_AUTH_BOOTSTRAP !== "1" ||
      typeof window === "undefined"
    ) {
      return;
    }

    const rawSession = window.localStorage.getItem(E2E_AUTH_SESSION_STORAGE_KEY);
    if (!rawSession) {
      return;
    }

    try {
      const parsedSession = authSessionSchema.parse(JSON.parse(rawSession));
      authStore.setState({ session: parsedSession });
    } catch (error) {
      console.error("[auth-e2e] failed to bootstrap session", error);
    }
  }, []);

  useEffect(() => {
    if (authSession.status === "authenticated") {
      setAuthModalOpen(false);
      setAvatarMenuOpen(false);
    }
  }, [authSession.status]);

  useEffect(() => {
    if (authSession.status !== "authenticated") {
      setCloudLibraryDocuments([]);
      return;
    }

    if (!hasSupabaseBrowserConfig) {
      return;
    }

    const client = createSupabaseBrowserClient();

    if (!("from" in client) || !("storage" in client)) {
      return;
    }

    let cancelled = false;

    void loadPdfLibraryDocuments({
      client,
      userId: authSession.userId,
    })
      .then((documents) => {
        if (!cancelled) {
          setCloudLibraryDocuments(documents);
        }
      })
      .catch((error) => {
        console.error("[pdf-library] failed to load library documents", error);
        if (!cancelled) {
          setCloudError("云端数据加载失败");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authSession.status, authSession.userId, hasSupabaseBrowserConfig]);

  useEffect(() => {
    if (authSession.status !== "authenticated") {
      restoreGuestSidebarStore(sidebarStore);
      return;
    }

    replaceSidebarStoreWithCloudData(sidebarStore, {
      recordings: [],
      favorites: [],
      expressions: [],
    });

    if (!hasSupabaseBrowserConfig) {
      return;
    }

    const client = createSupabaseBrowserClient();
    let cancelled = false;

    void loadSidebarCloudState({
      client,
      userId: authSession.userId,
    })
      .then((cloudState) => {
        if (!cancelled) {
          setCloudError(null);
          replaceSidebarStoreWithCloudData(sidebarStore, cloudState);
        }
      })
      .catch((error) => {
        console.error("[sidebar-cloud] failed to load sidebar data", error);
        setCloudError("云端数据加载失败");
      });

    return () => {
      cancelled = true;
    };
  }, [authSession.status, authSession.userId, hasSupabaseBrowserConfig]);

  const pdfStageState = useMemo(
    () => createPdfStageState(pdfSource, isPdfLoading, readerError),
    [isPdfLoading, pdfSource, readerError],
  );
  const libraryDocuments = useMemo(() => {
    if (authSession.status !== "authenticated") {
      return [];
    }

    const documentsById = new Map<string, PdfLibraryDocument>();

    for (const document of cloudLibraryDocuments) {
      documentsById.set(document.id, document);
    }

    for (const document of uploadedLibraryDocuments) {
      documentsById.set(document.id, document);
    }

    return Array.from(documentsById.values()).sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }, [authSession.status, cloudLibraryDocuments, uploadedLibraryDocuments]);

  const completeAnalysis = useCallback(
    async (transcript: string) => {
      const response = await analyzeTranscript(transcript);
      const recordingId = createSidebarItemId();

      const recordingItem: RecordingItem = {
        id: recordingId,
        createdAt: new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date()),
        page: 12,
        summary: response.result.corrected,
        feedback: `AI 点评：${response.result.coachFeedback}`,
        analysis: response.result,
      };

      addRecording(recordingItem);

      if (authSession.status === "authenticated" && hasSupabaseBrowserConfig) {
        void saveRecordingToCloud({
          client: createSupabaseBrowserClient(),
          item: recordingItem,
          userId: authSession.userId,
        }).catch((error) => {
          console.error("[sidebar-cloud] failed to save recording", error);
        });
      }

      setAnalysisMeta(response.meta);
      setActiveAnalysis({
        recordingId,
        result: response.result,
      });
    },
    [addRecording, authSession, hasSupabaseBrowserConfig],
  );

  const handleRecordingStop = useCallback(
    async (audioBlob: Blob | null) => {
      setLastAudioBlob(audioBlob);
      setTranscriptionError(null);
      setAnalysisError(null);

      let transcript: string;

      try {
        const transcription = await transcribeAudio(audioBlob);
        transcript = transcription.result.transcript;
      } catch (error) {
        setAnalysisMeta(null);
        setActiveAnalysis(null);
        const detail =
          error instanceof Error && error.message
            ? `转写失败：${error.message}`
            : "转写失败，可重试";
        setTranscriptionError(detail);
        throw new Error("transcription failed");
      }

      setLastTranscript(transcript);

      try {
        await completeAnalysis(transcript);
      } catch {
        setAnalysisMeta(null);
        setActiveAnalysis(null);
        setAnalysisError("分析失败，可重试");
        throw new Error("analysis failed");
      }
    },
    [completeAnalysis],
  );

  const handleOpenRecording = useCallback(
    (recording: { id: string; analysis?: AnalysisResult }) => {
      if (!recording.analysis) {
        return;
      }

      setActiveAnalysis({
        recordingId: recording.id,
        result: recording.analysis,
      });
    },
    [],
  );

  const handleAddExpression = useCallback(() => {
    if (!activeAnalysis) {
      return;
    }

    const expressionItem: ExpressionItem = {
      id: createSidebarItemId(),
      phrase: activeAnalysis.result.nativeExpression,
      note: `${activeAnalysis.result.grammar} ${activeAnalysis.result.coachFeedback}`,
      sourceRecordingId: activeAnalysis.recordingId,
    };

    addExpression(expressionItem);

    if (authSession.status === "authenticated" && hasSupabaseBrowserConfig) {
      void saveExpressionToCloud({
        client: createSupabaseBrowserClient(),
        item: expressionItem,
        userId: authSession.userId,
      }).catch((error) => {
        console.error("[sidebar-cloud] failed to save expression", error);
      });
    }

    setActiveAnalysis(null);
  }, [activeAnalysis, addExpression, authSession, hasSupabaseBrowserConfig]);

  const handleFavorite = useCallback(
    (item: FavoriteItem) => {
      addFavorite(item);

      if (authSession.status === "authenticated" && hasSupabaseBrowserConfig) {
        void saveFavoriteToCloud({
          client: createSupabaseBrowserClient(),
          item,
          userId: authSession.userId,
        }).catch((error) => {
          console.error("[sidebar-cloud] failed to save favorite", error);
        });
      }
    },
    [addFavorite, authSession, hasSupabaseBrowserConfig],
  );

  const handleRetryAnalysis = useCallback(async () => {
    if (!lastTranscript) {
      return;
    }

    setAnalysisError(null);

    try {
      await completeAnalysis(lastTranscript);
    } catch {
      setAnalysisMeta(null);
      setActiveAnalysis(null);
      setAnalysisError("分析失败，可重试");
    }
  }, [completeAnalysis, lastTranscript]);

  const handleRetryTranscription = useCallback(async () => {
    setTranscriptionError(null);
    setAnalysisError(null);

    let transcript: string;

    try {
      const transcription = await transcribeAudio(lastAudioBlob);
      transcript = transcription.result.transcript;
    } catch (error) {
      setAnalysisMeta(null);
      setActiveAnalysis(null);
      const detail =
        error instanceof Error && error.message
          ? `转写失败：${error.message}`
          : "转写失败，可重试";
      setTranscriptionError(detail);
      return;
    }

    setLastTranscript(transcript);

    try {
      await completeAnalysis(transcript);
    } catch {
      setAnalysisMeta(null);
      setActiveAnalysis(null);
      setAnalysisError("分析失败，可重试");
    }
  }, [completeAnalysis, lastAudioBlob]);

  const handleToggleMenu = useCallback(() => {
    setAvatarMenuOpen(false);
    setMenuOpen((value) => !value);
  }, []);

  const handleAvatarClick = useCallback(() => {
    if (authSession.status === "authenticated") {
      setMenuOpen(false);
      setAvatarMenuOpen((value) => !value);
      return;
    }

    setAvatarMenuOpen(false);
    setMenuOpen(false);
    setAuthModalOpen(true);
  }, [authSession.status]);

  const handleUploadClick = useCallback(() => {
    setMenuOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handleOpenLibrary = useCallback(() => {
    if (authSession.status !== "authenticated") {
      return;
    }

    setIsPdfLibraryOpen(true);
  }, [authSession.status]);

  const handleLogoutClick = useCallback(async () => {
    setAvatarMenuOpen(false);
    setMenuOpen(false);

    try {
      if (hasSupabaseBrowserConfig) {
        const client = createSupabaseBrowserClient();
        await client.auth.signOut();
      }
    } finally {
      authStore.getState().setGuest();
    }
  }, [hasSupabaseBrowserConfig]);

  const handleCloseLibrary = useCallback(() => {
    setIsPdfLibraryOpen(false);
  }, []);

  const handleOpenLibraryDocument = useCallback(
    (document: PdfLibraryDocument) => {
      const nextSource = document.previewSource;

      if (nextSource) {
        if (pdfSource?.startsWith("blob:")) {
          URL.revokeObjectURL(pdfSource);
        }

        setPdfSource(nextSource);
        setDocumentName(normalizePdfDocumentLabel(document.fileName));
      }

      setIsPdfLibraryOpen(false);
    },
    [pdfSource],
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = "";

      if (!file) {
        return;
      }

      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        setReaderError("Please choose a PDF file.");
        return;
      }

      setReaderError(null);
      setCloudError(null);
      setIsPdfLoading(true);

      setDocumentName(normalizePdfDocumentLabel(file.name));

      if (pdfSource?.startsWith("blob:")) {
        URL.revokeObjectURL(pdfSource);
      }

      const nextSource = URL.createObjectURL(file);
      setPdfSource(nextSource);

      await Promise.resolve();
      setIsPdfLoading(false);

      if (authSession.status === "authenticated") {
        if (
          !canUploadFileWithinQuota({
            incomingFileSizeBytes: file.size,
            storageQuotaBytes,
            storageUsedBytes,
          })
        ) {
          setCloudError("已达到 1 GB 空间上限");
          return;
        }

        const initiatingUserId = authSession.userId;
        setIsCloudUploadActive(true);
        setCloudUploadProgressPercent(0);
        void uploadPdfDocumentToCloud({
          client: createSupabaseBrowserClient(),
          userId: initiatingUserId,
          file,
          onProgress: (percent) => {
            setCloudUploadProgressPercent(percent);
          },
          storageQuotaBytes,
          storageUsedBytes,
        })
          .then(() => {
            authStore.setState((state) => {
              if (
                state.session.status !== "authenticated" ||
                state.session.userId !== initiatingUserId
              ) {
                return state;
              }

              return {
                session: {
                  ...state.session,
                  storageUsedBytes:
                    (state.session.storageUsedBytes ?? 0) + file.size,
                },
              };
            });

            setUploadedLibraryDocuments((currentDocuments) => [
              {
                createdAt: new Date().toISOString(),
                fileName: file.name,
                fileSizeBytes: file.size,
                id: `library-${Date.now()}`,
                previewSource: nextSource,
              },
              ...currentDocuments,
            ]);
          })
          .catch((uploadError) => {
            const errorMessage =
              uploadError instanceof Error
                ? uploadError.message
                : "Cloud upload failed";

            setCloudError(
              errorMessage === "Storage quota exceeded"
                ? "已达到 1 GB 空间上限"
                : "云端保存失败",
            );
          })
          .finally(() => {
            setIsCloudUploadActive(false);
            setCloudUploadProgressPercent(0);
          });
      }
    },
    [
      authSession.status,
      authSession.userId,
      pdfSource,
      storageQuotaBytes,
      storageUsedBytes,
    ],
  );

  return (
    <main
      className="h-screen overflow-hidden bg-[#f7f3ee] px-3 py-3 text-[#1a1a1a]"
      data-testid="app-shell"
    >
      <div className="mx-auto flex h-full max-w-[1500px] flex-col">
        <h1 className="sr-only">English PDF Reader</h1>
        <TopBar
          avatarMenuOpen={avatarMenuOpen}
          documentLabel={documentName}
          isAuthenticated={authSession.status === "authenticated"}
          menuOpen={menuOpen}
          onAvatarClick={handleAvatarClick}
          onOpenLibrary={handleOpenLibrary}
          onLogoutClick={handleLogoutClick}
          onToggleMenu={handleToggleMenu}
          userEmail={authSession.email ?? undefined}
          onUploadClick={handleUploadClick}
        />
        <input
          ref={fileInputRef}
          accept="application/pdf,.pdf"
          aria-label="Upload PDF input"
          className="sr-only"
          onChange={handleFileChange}
          type="file"
        />

        <div
          className="relative mt-3 flex min-h-0 flex-1 gap-3"
          data-testid="workspace-shell"
        >
          <PdfStage
            cloudUploadProgressPercent={cloudUploadProgressPercent}
            documentName={documentName}
            error={pdfStageState.error}
            isCloudUploadActive={isCloudUploadActive}
            onFavorite={handleFavorite}
            source={pdfStageState.source}
            status={pdfStageState.status}
          />
          <LearningSidebar
            isAuthenticated={authSession.status === "authenticated"}
            onOpenRecording={handleOpenRecording}
          />
          <RecordingButton
            disabled={pdfStageState.status !== "ready"}
            onStop={handleRecordingStop}
          />
        </div>

        <PdfLibraryPanel
          documents={libraryDocuments}
          errorMessage={cloudError}
          isOpen={authSession.status === "authenticated" && isPdfLibraryOpen}
          onClose={handleCloseLibrary}
          onOpenDocument={handleOpenLibraryDocument}
          storageQuotaBytes={storageQuotaBytes}
          storageUsedBytes={storageUsedBytes}
        />

        {transcriptionError || analysisError || cloudError ? (
          <div className="pointer-events-none absolute left-1/2 top-[78px] z-20 flex w-full max-w-[680px] -translate-x-1/2 flex-col gap-2 px-2">
            {cloudError ? (
              <div
                className="pointer-events-auto flex items-center gap-3 border border-[#e7ded4] bg-[#fff7f0] px-4 py-3 text-sm text-[#7a4530] shadow-[0_6px_16px_rgba(0,0,0,0.06)]"
                data-testid="cloud-error-banner"
              >
                <p>{cloudError}</p>
              </div>
            ) : null}
            {transcriptionError ? (
              <div className="pointer-events-auto flex items-center gap-3 border border-[#e7ded4] bg-[#fff7f0] px-4 py-3 text-sm text-[#7a4530] shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
                <p>{transcriptionError}</p>
                <button
                  className="bg-[#e07b54] px-4 py-2 font-semibold text-white"
                  onClick={() => {
                    void handleRetryTranscription();
                  }}
                  type="button"
                >
                  重新转写
                </button>
              </div>
            ) : null}

            {analysisError ? (
              <div className="pointer-events-auto flex items-center gap-3 border border-[#e7ded4] bg-[#fff7f0] px-4 py-3 text-sm text-[#7a4530] shadow-[0_6px_16px_rgba(0,0,0,0.06)]">
                <p>{analysisError}</p>
                <button
                  className="bg-[#e07b54] px-4 py-2 font-semibold text-white"
                  onClick={() => {
                    void handleRetryAnalysis();
                  }}
                  type="button"
                >
                  重新分析
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <AnalysisModal
        open={Boolean(activeAnalysis)}
        onAddExpression={handleAddExpression}
        onClose={() => setActiveAnalysis(null)}
        result={activeAnalysis?.result ?? null}
      />
      <AuthModal
        onClose={() => setAuthModalOpen(false)}
        open={authModalOpen}
      />

      {analysisMeta ? (
        <div className="pointer-events-none fixed bottom-3 right-3 border border-[#e7ded4] bg-[rgba(255,255,255,0.92)] px-3 py-2 text-[11px] font-mono tracking-[0.14em] text-[#6a625a] shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
          {analysisMeta.provider} / {analysisMeta.mode}
        </div>
      ) : null}
    </main>
  );
}
