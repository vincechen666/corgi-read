import { randomUUID } from "node:crypto";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { transcriptionRouteResponseSchema } from "@/features/analysis/analysis-schema";
import { createBaiduTokenClient } from "@/features/transcription/server/baidu-token";
import { requestBaiduTranscription } from "@/features/transcription/server/baidu-client";
import { convertWebmToWav } from "@/features/transcription/server/audio-convert";
import { getTranscriptionConfig } from "@/features/transcription/server/transcription-env";
import { normalizeTranscript } from "@/features/transcription/server/transcript-normalize";

type TranscriptionEnv = {
  TRANSCRIPTION_MODE?: string;
  TRANSCRIPTION_PROVIDER?: string;
  BAIDU_SPEECH_API_KEY?: string;
  BAIDU_SPEECH_SECRET_KEY?: string;
  BAIDU_SPEECH_MODEL?: string;
} & Record<string, string | undefined>;

type TempFileHandle = {
  path: string;
  cleanup: () => Promise<void>;
};

type TranscribeRetellingDependencies = {
  getToken?: (params: { apiKey: string; secretKey: string }) => Promise<string>;
  convertAudio?: (params: {
    inputPath: string;
    outputPath: string;
  }) => Promise<void>;
  requestProviderTranscript?: (params: {
    token: string;
    cuid: string;
    model: string;
    audioBuffer: Uint8Array;
  }) => Promise<string>;
  writeTempFile?: (params: {
    audioBuffer: Uint8Array;
    extension: string;
  }) => Promise<TempFileHandle>;
  createTempPath?: (extension: string) => string;
  readFile?: (path: string) => Promise<Uint8Array>;
  removeFile?: (path: string) => Promise<void>;
};

type TranscribeRetellingParams = {
  audioBuffer: Uint8Array;
  mimeType: string;
  env?: TranscriptionEnv;
  dependencies?: TranscribeRetellingDependencies;
};

const baiduTokenClient = createBaiduTokenClient();

function buildMockTranscript() {
  return "People knew Multivac well, but its mysteries still felt beyond them.";
}

function createTempPath(extension: string) {
  return join(tmpdir(), `corgi-read-${randomUUID()}${extension}`);
}

export function getAudioFileExtension(mimeType: string) {
  const normalized = mimeType.toLowerCase();

  if (normalized.includes("webm")) {
    return ".webm";
  }

  if (
    normalized.includes("mp4") ||
    normalized.includes("m4a") ||
    normalized.includes("aac")
  ) {
    return ".m4a";
  }

  if (normalized.includes("ogg") || normalized.includes("opus")) {
    return ".ogg";
  }

  if (normalized.includes("wav") || normalized.includes("wave")) {
    return ".wav";
  }

  if (normalized.includes("mpeg") || normalized.includes("mp3")) {
    return ".mp3";
  }

  return ".audio";
}

async function writeTempAudioFile({
  audioBuffer,
  extension,
}: {
  audioBuffer: Uint8Array;
  extension: string;
}): Promise<TempFileHandle> {
  const path = createTempPath(extension);
  await writeFile(path, audioBuffer);

  return {
    path,
    cleanup: () => unlink(path).catch(() => undefined),
  };
}

export async function transcribeRetelling({
  audioBuffer,
  mimeType,
  env = process.env,
  dependencies = {},
}: TranscribeRetellingParams) {
  const config = getTranscriptionConfig(env);

  if (config.mode === "mock") {
    return transcriptionRouteResponseSchema.parse({
      result: {
        transcript: buildMockTranscript(),
      },
      meta: {
        mode: "mock",
        provider: "mock",
        model: "mock",
      },
    });
  }

  if (!config.apiKey || !config.secretKey) {
    throw new Error("BAIDU_SPEECH_API_KEY and BAIDU_SPEECH_SECRET_KEY are required in real mode");
  }

  if (audioBuffer.byteLength === 0) {
    throw new Error("Recorded audio is empty");
  }

  const inputExtension = getAudioFileExtension(mimeType);
  const writeTempFileImpl = dependencies.writeTempFile ?? writeTempAudioFile;
  const createTempPathImpl = dependencies.createTempPath ?? createTempPath;
  const convertAudio = dependencies.convertAudio ?? convertWebmToWav;
  const getToken = dependencies.getToken ?? baiduTokenClient.getToken;
  const requestProviderTranscript =
    dependencies.requestProviderTranscript ?? requestBaiduTranscription;
  const readFileImpl = dependencies.readFile ?? readFile;
  const removeFileImpl = dependencies.removeFile ?? unlink;

  const inputFile = await writeTempFileImpl({
    audioBuffer,
    extension: inputExtension,
  });
  const outputPath = createTempPathImpl(".wav");

  try {
    await convertAudio({
      inputPath: inputFile.path,
      outputPath,
    });

    const wavBuffer = await readFileImpl(outputPath);
    const token = await getToken({
      apiKey: config.apiKey,
      secretKey: config.secretKey,
    });
    const transcript = await requestProviderTranscript({
      token,
      cuid: "corgi-read",
      model: config.model,
      audioBuffer: wavBuffer,
    });

    return transcriptionRouteResponseSchema.parse({
      result: {
        transcript: normalizeTranscript(transcript),
      },
      meta: {
        mode: "real",
        provider: "baidu",
        model: config.model,
      },
    });
  } finally {
    await Promise.allSettled([
      inputFile.cleanup(),
      removeFileImpl(outputPath).catch(() => undefined),
    ]);
  }
}
