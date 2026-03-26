import type { SupabaseClient } from "@supabase/supabase-js";

import type { AnalysisResult } from "@/features/analysis/analysis-schema";
import {
  cloudExpressionEntrySchema,
  cloudFavoriteEntrySchema,
  cloudRecordingEntrySchema,
} from "@/features/sidebar/sidebar-cloud-schema";
import type {
  ExpressionItem,
  FavoriteItem,
  RecordingItem,
} from "@/features/sidebar/sidebar-store";
import type { SidebarStorageShape } from "@/features/sidebar/sidebar-storage";

type CloudMutationContext = {
  createdAt?: string;
  documentId?: string | null;
  userId: string;
};

type CloudFavoriteRow = {
  created_at: string;
  document_id: string | null;
  id: string;
  page: number;
  source_text: string;
  translated_text: string;
  type: FavoriteItem["type"];
  user_id: string;
};

type CloudRecordingRow = {
  coach_feedback: string;
  corrected: string;
  created_at: string;
  document_id: string | null;
  feedback: string;
  grammar: string;
  id: string;
  native_expression: string;
  page: number;
  summary: string;
  transcript: string;
  user_id: string;
};

type CloudExpressionRow = {
  created_at: string;
  document_id: string | null;
  id: string;
  natural_phrase: string;
  note: string;
  source_phrase: string;
  source_recording_id: string;
  user_id: string;
};

function createAnalysisFromRecording(item: RecordingItem): AnalysisResult {
  if (item.analysis) {
    return item.analysis;
  }

  return {
    transcript: item.summary,
    corrected: item.summary,
    grammar: item.feedback,
    nativeExpression: item.summary,
    coachFeedback: item.feedback,
  };
}

function mapCloudFavoriteRowToFavoriteItem(row: CloudFavoriteRow): FavoriteItem {
  const entry = cloudFavoriteEntrySchema.parse({
    id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    sourceText: row.source_text,
    translatedText: row.translated_text,
    type: row.type,
    page: row.page,
    createdAt: row.created_at,
  });

  return {
    id: entry.id,
    sourceText: entry.sourceText,
    translatedText: entry.translatedText,
    type: entry.type,
    page: entry.page,
  };
}

function mapCloudRecordingRowToRecordingItem(row: CloudRecordingRow): RecordingItem {
  const entry = cloudRecordingEntrySchema.parse({
    id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    page: row.page,
    createdAt: row.created_at,
    transcript: row.transcript,
    corrected: row.corrected,
    grammar: row.grammar,
    nativeExpression: row.native_expression,
    coachFeedback: row.coach_feedback,
    summary: row.summary,
    feedback: row.feedback,
  });

  return {
    id: entry.id,
    createdAt: entry.createdAt,
    page: entry.page,
    summary: entry.summary,
    feedback: entry.feedback,
    analysis: {
      transcript: entry.transcript,
      corrected: entry.corrected,
      grammar: entry.grammar,
      nativeExpression: entry.nativeExpression,
      coachFeedback: entry.coachFeedback,
    },
  };
}

function mapCloudExpressionRowToExpressionItem(
  row: CloudExpressionRow,
): ExpressionItem {
  const entry = cloudExpressionEntrySchema.parse({
    id: row.id,
    userId: row.user_id,
    documentId: row.document_id,
    sourcePhrase: row.source_phrase,
    naturalPhrase: row.natural_phrase,
    note: row.note,
    sourceRecordingId: row.source_recording_id,
    createdAt: row.created_at,
  });

  return {
    id: entry.id,
    phrase: entry.naturalPhrase,
    note: entry.note,
    sourceRecordingId: entry.sourceRecordingId,
  };
}

export function mapFavoriteToCloudRow(
  item: FavoriteItem,
  context: CloudMutationContext,
): CloudFavoriteRow {
  return {
    id: item.id,
    user_id: context.userId,
    document_id: context.documentId ?? null,
    source_text: item.sourceText,
    translated_text: item.translatedText,
    type: item.type,
    page: item.page,
    created_at: context.createdAt ?? new Date().toISOString(),
  };
}

export function mapRecordingToCloudRow(
  item: RecordingItem,
  context: CloudMutationContext,
): CloudRecordingRow {
  const analysis = createAnalysisFromRecording(item);

  return {
    id: item.id,
    user_id: context.userId,
    document_id: context.documentId ?? null,
    page: item.page,
    transcript: analysis.transcript,
    corrected: analysis.corrected,
    grammar: analysis.grammar,
    native_expression: analysis.nativeExpression,
    coach_feedback: analysis.coachFeedback,
    summary: item.summary,
    feedback: item.feedback,
    created_at: context.createdAt ?? new Date().toISOString(),
  };
}

export function mapExpressionToCloudRow(
  item: ExpressionItem,
  context: CloudMutationContext,
): CloudExpressionRow {
  return {
    id: item.id,
    user_id: context.userId,
    document_id: context.documentId ?? null,
    source_phrase: item.phrase,
    natural_phrase: item.phrase,
    note: item.note,
    source_recording_id: item.sourceRecordingId,
    created_at: context.createdAt ?? new Date().toISOString(),
  };
}

export async function loadSidebarCloudState({
  client,
  userId,
}: {
  client: SupabaseClient;
  userId: string;
}): Promise<SidebarStorageShape> {
  const [recordingsResult, favoritesResult, expressionsResult] =
    await Promise.all([
      client
        .from("recordings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      client
        .from("favorites")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      client
        .from("expression_library")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  if (recordingsResult.error) {
    throw new Error(
      `Supabase recordings fetch failed: ${recordingsResult.error.message}`,
    );
  }

  if (favoritesResult.error) {
    throw new Error(
      `Supabase favorites fetch failed: ${favoritesResult.error.message}`,
    );
  }

  if (expressionsResult.error) {
    throw new Error(
      `Supabase expressions fetch failed: ${expressionsResult.error.message}`,
    );
  }

  return {
    recordings: (recordingsResult.data ?? []).map((row) =>
      mapCloudRecordingRowToRecordingItem(row as CloudRecordingRow),
    ),
    favorites: (favoritesResult.data ?? []).map((row) =>
      mapCloudFavoriteRowToFavoriteItem(row as CloudFavoriteRow),
    ),
    expressions: (expressionsResult.data ?? []).map((row) =>
      mapCloudExpressionRowToExpressionItem(row as CloudExpressionRow),
    ),
  };
}

export async function saveFavoriteToCloud({
  client,
  item,
  ...context
}: {
  client: SupabaseClient;
  item: FavoriteItem;
} & CloudMutationContext) {
  const row = mapFavoriteToCloudRow(item, context);
  const result = await client.from("favorites").insert([row]);

  if (result.error) {
    throw new Error(`Supabase favorite insert failed: ${result.error.message}`);
  }

  return row;
}

export async function saveRecordingToCloud({
  client,
  item,
  ...context
}: {
  client: SupabaseClient;
  item: RecordingItem;
} & CloudMutationContext) {
  const row = mapRecordingToCloudRow(item, context);
  const result = await client.from("recordings").insert([row]);

  if (result.error) {
    throw new Error(`Supabase recording insert failed: ${result.error.message}`);
  }

  return row;
}

export async function saveExpressionToCloud({
  client,
  item,
  ...context
}: {
  client: SupabaseClient;
  item: ExpressionItem;
} & CloudMutationContext) {
  const row = mapExpressionToCloudRow(item, context);
  const result = await client.from("expression_library").insert([row]);

  if (result.error) {
    throw new Error(`Supabase expression insert failed: ${result.error.message}`);
  }

  return row;
}
