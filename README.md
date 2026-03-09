# Corgi Read

Desktop-first English PDF reader for reading practice and spoken retelling. The current MVP follows the design spec and Pencil prototype already stored in this repo:

- design: `docs/plans/2026-03-08-english-pdf-reader-design.md`
- implementation plan: `docs/plans/2026-03-09-english-pdf-reader-implementation.md`
- prototype: `designs/english-pdf-reader-prototype.pen`

## What Works

- sample PDF rendered with `react-pdf`
- selection-driven translation popover with mock translation data
- Siri-style recording button with idle, recording, processing, and error states
- mock `/api/transcribe` and `/api/analysis` routes
- analysis modal with corrected retelling, grammar note, native expression, and coach feedback
- persistent right sidebar for recordings, favorites, and expression library

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

The MVP is mock-first. Both server routes return stable structured data even when no AI credentials are present:

- `POST /api/transcribe`
- `POST /api/analysis`

The UI stays functional without any provider keys.

## Future Provider Wiring

When the real provider is connected, these environment variables are expected:

- `OPENAI_API_KEY`
- `TRANSCRIPTION_MODEL`
- `ANALYSIS_MODEL`

Until then, the API routes intentionally stay in mock mode so the reading and speaking loop can be developed independently of backend integrations.

## Stack

- Next.js App Router
- React 19
- Tailwind CSS v4
- Zustand
- React PDF
- Zod
- Vitest
- Playwright
