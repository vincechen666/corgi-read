type FetchLike = typeof fetch;

type RequestBaiduTranscriptionParams = {
  token: string;
  cuid: string;
  model: string;
  audioBuffer: Uint8Array;
};

export async function requestBaiduTranscription(
  params: RequestBaiduTranscriptionParams,
  fetchImpl: FetchLike = fetch,
) {
  const audioBuffer = Buffer.from(params.audioBuffer);

  const response = await fetchImpl("http://vop.baidu.com/server_api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      format: "wav",
      rate: 16000,
      channel: 1,
      cuid: params.cuid,
      token: params.token,
      dev_pid: Number(params.model),
      speech: audioBuffer.toString("base64"),
      len: audioBuffer.byteLength,
    }),
  });

  if (!response.ok) {
    throw new Error(`Baidu transcription request failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    err_no?: number;
    err_msg?: string;
    result?: string[];
  };

  if (json.err_no !== 0 || !json.result?.[0]) {
    throw new Error(json.err_msg ?? `Baidu transcription failed: ${json.err_no}`);
  }

  return json.result[0];
}
