# Corgi Read

Corgi Read is a desktop-first English PDF reader for reading practice and spoken retelling. It combines continuous PDF reading, selection-based translation, voice retelling, speech-to-text, and AI feedback in one workspace.

## Features

- Local upload for a single PDF file in the current browser session
- Optional mixed email auth backed by Supabase Auth: first registration uses an email verification link, returning users sign in with an in-app email code
- Per-user cloud PDF library with a 1 GB starting quota
- Cloud-backed recordings, saved translations, and expression snippets for signed-in users
- Continuous PDF reading with an internally scrollable reader pane
- Selection-based translation popover for words and short phrases
- Siri-style recording button for spoken retelling
- Baidu speech recognition for English retelling transcripts
- Google Cloud Translation for on-demand Chinese text translation
- OpenRouter-based analysis for correction, grammar notes, native phrasing, and coach feedback
- Persistent right sidebar for recordings, saved translations, and expression snippets

## Quick Start

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If you want real Baidu transcription, install `ffmpeg` on the machine that runs the Next.js server:

```bash
ffmpeg -version
```

## Project Status

Current MVP supports:

- desktop-first reading layout
- guest mode for local-only reading
- authenticated mode for cloud-backed PDFs and sidebar records
- local PDF upload and in-page replacement
- left-side PDF library overlay for signed-in users
- full-document vertical scrolling in the reader pane
- translation popover on text selection
- recording, transcription, and AI analysis flow
- retry states for failed transcription and analysis

Current scope does not include:

- mobile-first interaction design
- multi-file library management
- persisted local PDFs after refresh
- pronunciation scoring
- long-form asynchronous transcription jobs

## Environment Setup

Copy the variables you need into `.env.local`. Never commit real secrets.

Minimal mock-first setup:

```env
AI_MODE=mock
TRANSCRIPTION_MODE=mock
```

Supabase auth and storage setup:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=https://corgi.study
```

`NEXT_PUBLIC_SITE_URL` is required for the first-time verification link sent during registration.

Supabase user system rollout assumes:

- Auth provider: mixed email flow with first registration via verification link and returning login via in-app email code
- `NEXT_PUBLIC_SITE_URL` points to your deployed app origin for first-time verification links
- Storage bucket: `pdf-documents`
- Tables: `profiles`, `pdf_documents`, `recordings`, `favorites`, `expression_library`
- Row Level Security enabled on all user-owned tables and storage paths
- Session persistence is restored through Supabase client session hydration on reload

Recommended profile defaults:

- `storage_quota_bytes = 1073741824`
- `storage_used_bytes = 0`

Real OpenRouter analysis:

```env
AI_MODE=real
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=stepfun/step-3.5-flash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Real Google translation:

```env
TRANSLATION_MODE=real
TRANSLATION_PROVIDER=google
GOOGLE_CLOUD_PROJECT=your-google-cloud-project
GOOGLE_TRANSLATE_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
```

Optional explicit Google bearer token:

```env
TRANSLATION_MODE=real
TRANSLATION_PROVIDER=google
GOOGLE_CLOUD_PROJECT=your-google-cloud-project
GOOGLE_TRANSLATE_LOCATION=global
GOOGLE_TRANSLATE_ACCESS_TOKEN=your-short-lived-access-token
```

Real Baidu transcription:

```env
TRANSCRIPTION_MODE=real
TRANSCRIPTION_PROVIDER=baidu
BAIDU_SPEECH_API_KEY=your-baidu-api-key
BAIDU_SPEECH_SECRET_KEY=your-baidu-secret-key
BAIDU_SPEECH_MODEL=1737
```

Combined real setup:

```env
AI_MODE=real
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=stepfun/step-3.5-flash
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

TRANSLATION_MODE=real
TRANSLATION_PROVIDER=google
GOOGLE_CLOUD_PROJECT=your-google-cloud-project
GOOGLE_TRANSLATE_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json

TRANSCRIPTION_MODE=real
TRANSCRIPTION_PROVIDER=baidu
BAIDU_SPEECH_API_KEY=your-baidu-api-key
BAIDU_SPEECH_SECRET_KEY=your-baidu-secret-key
BAIDU_SPEECH_MODEL=1737
```

Notes:

- `BAIDU_SPEECH_MODEL=1737` is the current English short-audio model
- translation now uses Google Cloud Translation and no longer shares provider config with analysis
- `GOOGLE_APPLICATION_CREDENTIALS` is the recommended production path for Google translation
- `GOOGLE_TRANSLATE_ACCESS_TOKEN` is available for short-lived explicit token setups
- Baidu short-audio recognition is intended for short retellings, not long recordings
- the English Baidu model returns text without punctuation, so the app applies light normalization before analysis
- translation and analysis fall back gracefully when provider latency is too high or a request fails

See [`.env.example`](/Users/cyc/Documents/Code/corgi-read/.env.example) for the tracked template.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
npm run test:e2e
```

To run the current end-to-end reader flow only:

```bash
npm run test:e2e -- tests/e2e/reader.spec.ts
```

## Tech Stack

- Next.js App Router
- React 19
- Tailwind CSS v4
- Zustand
- React PDF
- Zod
- Vitest
- Playwright

## Project Docs

- Design spec: [2026-03-08-english-pdf-reader-design.md](/Users/cyc/Documents/Code/corgi-read/docs/plans/2026-03-08-english-pdf-reader-design.md)
- Implementation plan: [2026-03-09-english-pdf-reader-implementation.md](/Users/cyc/Documents/Code/corgi-read/docs/plans/2026-03-09-english-pdf-reader-implementation.md)
- Upload flow design: [2026-03-09-pdf-upload-entry-design.md](/Users/cyc/Documents/Code/corgi-read/docs/plans/2026-03-09-pdf-upload-entry-design.md)
- User system design: [2026-03-25-user-system-design.md](/Users/cyc/Documents/Code/corgi-read/docs/plans/2026-03-25-user-system-design.md)
- User system implementation: [2026-03-25-user-system-implementation.md](/Users/cyc/Documents/Code/corgi-read/docs/plans/2026-03-25-user-system-implementation.md)
- User system rollout notes: [2026-03-25-user-system-rollout-notes.md](/Users/cyc/Documents/Code/corgi-read/docs/plans/2026-03-25-user-system-rollout-notes.md)
- OpenRouter analysis design: [2026-03-09-openrouter-analysis-design.md](/Users/cyc/Documents/Code/corgi-read/docs/plans/2026-03-09-openrouter-analysis-design.md)
- Baidu transcription design: [2026-03-09-baidu-transcription-design.md](/Users/cyc/Documents/Code/corgi-read/docs/plans/2026-03-09-baidu-transcription-design.md)
- Pencil prototype: [english-pdf-reader-prototype.pen](/Users/cyc/Documents/Code/corgi-read/designs/english-pdf-reader-prototype.pen)

## License

This project is licensed under the GNU General Public License v3.0. See [LICENSE](/Users/cyc/Documents/Code/corgi-read/LICENSE).
