import { execFile } from "node:child_process";

type ExecFileCallback = (error: Error | null) => void;

type ExecFileImpl = (
  file: string,
  args: string[],
  callback: ExecFileCallback,
) => void;

type ConvertWebmToWavParams = {
  inputPath: string;
  outputPath: string;
  execFileImpl?: ExecFileImpl;
};

export async function convertWebmToWav({
  inputPath,
  outputPath,
  execFileImpl = execFile as ExecFileImpl,
}: ConvertWebmToWavParams) {
  await new Promise<void>((resolve, reject) => {
    execFileImpl(
      "ffmpeg",
      [
        "-y",
        "-i",
        inputPath,
        "-ar",
        "16000",
        "-ac",
        "1",
        "-f",
        "wav",
        outputPath,
      ],
      (error) => {
        if (error) {
          reject(new Error(`ffmpeg conversion failed: ${error.message}`));
          return;
        }

        resolve();
      },
    );
  });
}
