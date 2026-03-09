# Corgi Read

Desktop-first English PDF reader for reading practice and spoken retelling. The current MVP follows the design spec and Pencil prototype already stored in this repo:

- design: `docs/plans/2026-03-08-english-pdf-reader-design.md`
- implementation plan: `docs/plans/2026-03-09-english-pdf-reader-implementation.md`
- prototype: `designs/english-pdf-reader-prototype.pen`

## What Works

- sample PDF rendered with `react-pdf`
- selection-driven translation popover with mock translation data
- Siri-style recording button with idle, recording, processing, and error states
- `/api/transcribe` can now run in `mock` or `real` mode
- `/api/analysis` can now run in `mock` or `real` mode
- analysis modal with corrected retelling, grammar note, native expression, and coach feedback
- persistent right sidebar for recordings, favorites, and expression library
- retry path when transcription or analysis fails

## Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Testing

```bash
npm test
npm run lint
npm run test:e2e -- tests/e2e/reader.spec.ts
```

Playwright starts its own local Next.js server through `playwright.config.ts`.

## Mock AI Mode

The MVP is still mock-first. Both transcription and analysis can run in mock mode without any provider key:

- `POST /api/transcribe`
- `POST /api/analysis`

Default behavior:

- `TRANSCRIPTION_MODE=mock` forces mock transcription
- `TRANSCRIPTION_MODE=real` forces Baidu transcription
- if `TRANSCRIPTION_MODE` is unset, the app uses `real` only when both `BAIDU_SPEECH_API_KEY` and `BAIDU_SPEECH_SECRET_KEY` exist
- `AI_MODE=mock` forces mock analysis
- `AI_MODE=real` forces OpenRouter analysis
- if `AI_MODE` is unset, the app uses `real` only when `OPENROUTER_API_KEY` exists

The UI stays functional without provider keys. In real mode, the reader shell shows `转写失败，可重试` or `分析失败，可重试` instead of silently fabricating a fallback.

## Real Baidu Transcription Mode

Put real secrets only in `.env.local`, never in tracked files:

```env
TRANSCRIPTION_MODE=real
TRANSCRIPTION_PROVIDER=baidu
BAIDU_SPEECH_API_KEY=your-baidu-api-key
BAIDU_SPEECH_SECRET_KEY=your-baidu-secret-key
BAIDU_SPEECH_MODEL=1737
```

This real-mode integration targets Baidu short-audio standard recognition with the English model `dev_pid=1737`.

Operational notes:

- install `ffmpeg` on the machine running the Next.js server
- keep retellings under 60 seconds
- the Baidu English model returns no punctuation, so the app applies a light transcript normalizer before analysis

## Real OpenRouter Mode

Put real secrets only in `.env.local`, never in tracked files:

```env
AI_MODE=real
OPENROUTER_API_KEY=your-secret-key
OPENROUTER_MODEL=stepfun/step-3.5-flash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

The current real-mode integration targets OpenRouter with `StepFun: Step 3.5 Flash`.

## Environment Variables

- `AI_MODE`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`
- `OPENROUTER_BASE_URL`
- `TRANSCRIPTION_MODE`
- `TRANSCRIPTION_PROVIDER`
- `BAIDU_SPEECH_API_KEY`
- `BAIDU_SPEECH_SECRET_KEY`
- `BAIDU_SPEECH_MODEL`
- `TRANSCRIPTION_MODEL`
- `ANALYSIS_MODEL`

`TRANSCRIPTION_MODEL` and `ANALYSIS_MODEL` remain compatibility placeholders. Real transcription now uses the Baidu variables, and real analysis uses the OpenRouter variables.

## Running Modes

Mock mode:

```bash
npm run dev
```

Real Baidu transcription + real OpenRouter analysis:

```bash
TRANSCRIPTION_MODE=real AI_MODE=real npm run dev
```

Real OpenRouter mode:

```bash
AI_MODE=real npm run dev
```

## Secret Handling

- keep provider keys in `.env.local`
- never expose provider keys via `NEXT_PUBLIC_` variables
- never paste real keys into tracked docs or source files
- install `ffmpeg` before enabling real Baidu transcription
- if a key was previously exposed outside secret storage, rotate it before production use

## Stack

- Next.js App Router
- React 19
- Tailwind CSS v4
- Zustand
- React PDF
- Zod
- Vitest
- Playwright
