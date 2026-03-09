# Baidu English Transcription Integration Design

**Date:** 2026-03-09

**Scope:** Replace mock-only `/api/transcribe` behavior with a server-side, provider-pluggable transcription service that can run in `mock` or `real` mode, using Baidu Speech short-audio recognition for English retellings while preserving API key privacy and retrying the same recorded audio on failure.

---

## 1. Goal

The current MVP already records audio in the browser and uses [`src/app/api/transcribe/route.ts`](src/app/api/transcribe/route.ts) to return a fixed mock transcript. That is enough for UI development, but it breaks the core product promise once the user starts speaking real English summaries.

This phase upgrades only the transcription leg. The rest of the flow stays intact:

- browser records audio
- server transcribes audio
- successful transcript flows into AI analysis
- failed transcription shows `转写失败，可重试`
- retry reuses the same recorded audio instead of forcing the user to record again

The chosen real provider is Baidu Speech, but the code should not be tightly coupled to Baidu forever.

---

## 2. Verified Provider Constraints

The implementation is based on Baidu official documentation:

- The original “short-audio rapid” document is not suitable for this product because it centers on the Chinese near-field model (`80001`).
- The better fit is **短语音识别标准版 API**, which supports **60-second** audio and lists **`dev_pid=1737`** for **English**, with the limitation that the model returns **no punctuation**.
- Supported audio formats for this API include `pcm`, `wav`, `amr`, and `m4a`; Baidu recommends **16kHz, 16-bit, mono** audio.
- Authentication can use `access_token`, acquired from `API Key + Secret Key`.
- The asynchronous **音频文件转写 API** also supports an English model, but it is task-based and not a good match for the current “record, stop, analyze immediately” interaction.

Design implications:

- keep recording length capped at **60 seconds**
- convert browser output into a Baidu-supported format
- normalize the returned English transcript before sending it into analysis
- cache `access_token` server-side

Sources:

- [短语音识别标准版 API](https://cloud.baidu.com/doc/SPEECH/s/Jlbxdezuf)
- [鉴权认证](https://cloud.baidu.com/doc/SPEECH/s/cm8sn2bii)
- [音频文件转写 API](https://cloud.baidu.com/doc/SPEECH/s/Klbxern8v)

---

## 3. Proposed Approaches

### Approach A: Inline Baidu fetch in the route

Put token fetching, ffmpeg conversion, provider request, normalization, mode switching, and error handling directly into [`src/app/api/transcribe/route.ts`](src/app/api/transcribe/route.ts).

Pros:

- quickest to write

Cons:

- route becomes responsible for too many concerns
- hard to unit test cleanly
- awkward to replace provider later

### Approach B: Lightweight transcription adapter, recommended

Create a small server-only transcription layer:

- env/config helper
- token helper
- ffmpeg conversion helper
- Baidu client
- mode switch and response shaping service

Pros:

- keeps the route thin
- supports `mock` and `real` modes cleanly
- isolates Baidu-specific protocol details
- keeps future provider swaps cheap

Cons:

- slightly more structure than an inline fetch

### Approach C: Full provider platform

Create a generic transcription registry with multiple providers and runtime selection.

Pros:

- most extensible

Cons:

- overbuilt for the current product stage

**Recommendation:** Approach B.

---

## 4. Architecture

### 4.1 Server-only transcription service

Add a new server-only subtree under `src/features/transcription/server/`:

- `transcription-env.ts`
- `baidu-token.ts`
- `audio-convert.ts`
- `baidu-client.ts`
- `transcription-service.ts`
- `transcript-normalize.ts`

Responsibilities:

- resolve `mock` vs `real`
- read Baidu credentials from env
- turn recorded browser audio into Baidu-compatible audio using system `ffmpeg`
- fetch and cache `access_token`
- call Baidu short-audio standard API with English `dev_pid=1737`
- normalize the transcript
- return a fixed route contract

[`src/app/api/transcribe/route.ts`](src/app/api/transcribe/route.ts) should only:

1. parse the incoming request
2. call `transcribeRetelling()`
3. map failures to HTTP responses
4. return `{ result, meta }`

### 4.2 Response contract

The route should move from:

```ts
{ transcript: string }
```

to:

```ts
{
  result: {
    transcript: string;
  };
  meta: {
    mode: "mock" | "real";
    provider: "mock" | "baidu";
    model: string;
  };
}
```

This keeps the transcription payload minimal while making debugging and UI state consistent with the analysis route.

### 4.3 Mode selection

Mode selection should mirror the analysis leg:

- `TRANSCRIPTION_MODE=mock` => always mock
- `TRANSCRIPTION_MODE=real` => require Baidu config and run real provider
- unset `TRANSCRIPTION_MODE`:
  - if Baidu credentials exist => `real`
  - otherwise => `mock`

This keeps local development zero-config while allowing explicit forcing in tests and debugging.

---

## 5. Audio and Provider Flow

### 5.1 Browser recording input

The browser currently records audio through `MediaRecorder` and produces `audio/webm`. Baidu short-audio standard recognition does not accept `webm`, so the real-mode pipeline must convert it.

### 5.2 Server-side conversion

The selected approach uses system `ffmpeg`.

Real-mode flow:

1. receive uploaded audio payload from browser
2. write a temporary source file
3. call `ffmpeg`
4. emit a `wav` file at **16kHz mono**
5. send converted audio to Baidu
6. remove temporary files

If `ffmpeg` is missing or conversion fails, transcription fails explicitly. No fake transcript is produced.

### 5.3 Baidu request details

The service should use Baidu short-audio standard recognition:

- endpoint: `http://vop.baidu.com/server_api`
- language model: `dev_pid=1737`
- audio format sent from server: `wav`
- rate: `16000`
- channel: mono

The returned transcript should be taken from Baidu’s `result[0]` when `err_no === 0`.

### 5.4 Token handling

Authentication should use `access_token`.

Server behavior:

- request token from `https://aip.baidubce.com/oauth/2.0/token`
- cache token and expiry in-process
- reuse if still valid
- refresh early when close to expiry
- if the provider signals token invalidation, clear cache and retry one time

No token or secret leaves the server runtime.

---

## 6. Transcript Normalization

The English model `1737` is documented as **无标点**. The transcript should therefore be lightly normalized before analysis.

Normalization rules should stay intentionally conservative:

- trim leading and trailing whitespace
- collapse repeated internal whitespace
- capitalize the first alphabetical character
- append a period if the text ends without terminal punctuation

This layer should not paraphrase or “improve” the sentence. Its only job is to make the transcript easier to read and easier for the downstream analysis model to consume.

---

## 7. Error Handling and Retry

### 7.1 Server failures

Expected real-mode failures:

- missing Baidu env configuration in `real` mode
- missing `ffmpeg`
- audio conversion failure
- Baidu token request failure
- Baidu recognition failure
- malformed provider response

The route should return a safe user-facing message such as:

- `Transcription failed, please retry.`

### 7.2 Client behavior

[`src/features/analysis/analysis-client.ts`](src/features/analysis/analysis-client.ts) should be updated so `transcribeAudio()` sends real audio rather than only `hasAudio`.

[`src/components/reader/app-shell.tsx`](src/components/reader/app-shell.tsx) should:

- preserve the last recorded `Blob`
- show `转写失败，可重试` when transcription fails
- offer `重新转写`
- retry using the same audio blob
- avoid calling analysis if transcription fails

This is different from the analysis retry path: transcription retry must reuse the recorded audio, not the already produced transcript.

---

## 8. Privacy and Secret Handling

Use only server-side env vars:

- `TRANSCRIPTION_MODE`
- `TRANSCRIPTION_PROVIDER`
- `BAIDU_SPEECH_API_KEY`
- `BAIDU_SPEECH_SECRET_KEY`
- `BAIDU_SPEECH_MODEL`

Rules:

- never expose Baidu credentials via `NEXT_PUBLIC_*`
- never persist `access_token` in tracked files
- never log Authorization-bearing URLs or raw secrets
- keep real values only in `.env.local`

Because the user may later deploy this app, the README must also state the `ffmpeg` requirement explicitly.

---

## 9. Testing Strategy

The implementation should cover four layers:

1. env and mode selection
2. token cache behavior
3. transcript normalization
4. route/UI retry behavior

Unit tests should stub provider calls rather than contacting Baidu. End-to-end tests should focus on UI behavior:

- failure shows retry state
- retry can succeed without re-recording
- successful transcription proceeds into analysis

One manual verification pass should use a real local environment with:

- system `ffmpeg`
- valid Baidu credentials
- a short English recording under 60 seconds

---

## 10. Out of Scope

This phase does not include:

- long-form asynchronous transcription
- streaming partial transcripts
- pronunciation scoring
- multilingual provider switching UI
- audio persistence in a database
- replacing the existing analysis provider
