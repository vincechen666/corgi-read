# Google Translation Integration Design

**Date:** 2026-03-23

**Scope:** Replace the current OpenRouter-backed translation provider with Google Cloud Translation while preserving the existing front-end contract, dictionary-first behavior, and server-only secret handling.

---

## 1. Goal

The reader already supports on-demand word and phrase translation through [`/api/translate`](/Users/cyc/Documents/Code/corgi-read/src/app/api/translate/route.ts). Today that route ultimately depends on OpenRouter via [`translation-service.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/translation/server/translation-service.ts), which is not the right long-term provider for fast, deterministic text translation.

This change switches the real translation provider to Google Cloud Translation and keeps the existing UI contract unchanged:

- `sourceText`
- `translatedText`
- `note`

The front-end should not need to change its data handling. It should continue to render the same translation popover and favorites behavior.

---

## 2. External Reference

This design follows the Google Cloud Translation documentation for translating text:

- Official doc: [使用 Cloud Translation 翻译文本](https://docs.cloud.google.com/translate/docs/translate-text?hl=zh-cn)

Relevant API details from the doc:

- Recommended v3 REST endpoint:
  - `POST https://translation.googleapis.com/v3/projects/PROJECT_NUMBER_OR_ID/locations/LOCATION:translateText`
- Request fields:
  - `sourceLanguageCode`
  - `targetLanguageCode`
  - `contents`
  - `mimeType`
- The doc also shows authenticated requests using:
  - `Authorization: Bearer <access_token>`
  - `x-goog-user-project: PROJECT_NUMBER_OR_ID`

This means the app should translate on the server, not from the browser, and should acquire Google credentials in the server runtime only.

---

## 3. Constraints

- Translation secrets must remain server-only.
- The current front-end response shape must stay stable.
- Existing dictionary hits should still return immediately.
- Existing fallback behavior should remain available for slow or failing providers.
- The translation system should no longer depend on analysis provider settings.
- Production failures should log useful server-side details without exposing credentials or raw authorization data to the client.

---

## 4. Proposed Approaches

### Approach A: Replace the current OpenRouter client inline

Modify [`translation-service.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/translation/server/translation-service.ts) to call Google directly and remove the OpenRouter helper.

Pros:
- Minimal file churn

Cons:
- Authentication, request building, response parsing, and fallback policy stay mixed together
- Harder to test and extend

### Approach B: Add a Google provider adapter, recommended

Keep the current service orchestration layer, but swap the provider-specific client underneath it.

Pros:
- Clean separation of env/config, auth, API request building, and service fallback policy
- Keeps `/api/translate` thin
- Easy to test provider behavior independently

Cons:
- Slightly more structure than a direct fetch

### Approach C: Full translation provider framework

Build a generalized provider registry for Google, OpenRouter, and any future translation backend.

Pros:
- Maximal extensibility

Cons:
- Overbuilt for the current app stage

**Recommendation:** Approach B. It preserves the existing API and UX while replacing only the provider-specific layer.

---

## 5. Architecture

### 5.1 Route contract stays the same

[`/api/translate`](/Users/cyc/Documents/Code/corgi-read/src/app/api/translate/route.ts) should continue to:

1. parse `{ sourceText }`
2. call `translateText(sourceText)`
3. return the parsed [`translationResultSchema`](/Users/cyc/Documents/Code/corgi-read/src/features/translation/translation-schema.ts)

The client route contract remains:

```ts
{
  sourceText: string;
  translatedText: string;
  note: string;
}
```

### 5.2 Translation service responsibilities

[`translation-service.ts`](/Users/cyc/Documents/Code/corgi-read/src/features/translation/server/translation-service.ts) remains the coordinator and continues to own:

- dictionary-first returns
- `mock` vs `real` mode selection
- timeout and provider fallback policy
- final schema validation

### 5.3 New Google translation client

Add a Google-specific server client, for example:

- `src/features/translation/server/google-translation-client.ts`
- `src/features/translation/server/google-translation-env.ts`
- optionally `src/features/translation/server/google-auth.ts`

The Google client should:

- acquire an access token from either explicit config or ADC-compatible credentials
- call the v3 `translateText` endpoint
- parse `translations[0].translatedText`
- return only the translated text to the service layer

---

## 6. Configuration and Authentication

The translation module should stop borrowing OpenRouter analysis settings and move to dedicated translation configuration.

Recommended environment variables:

- `TRANSLATION_MODE=mock|real`
- `TRANSLATION_PROVIDER=google`
- `GOOGLE_CLOUD_PROJECT=<project id>`
- `GOOGLE_TRANSLATE_LOCATION=global`
- `GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json`
- optional `GOOGLE_TRANSLATE_ACCESS_TOKEN=<temporary bearer token>`

Recommended resolution order:

1. If `TRANSLATION_MODE=mock`, always return mock/fallback translations.
2. If `TRANSLATION_MODE=real`, require usable Google credentials.
3. If mode is unset:
   - use `real` when Google credentials are available
   - otherwise use `mock`

Authentication priority:

1. `GOOGLE_TRANSLATE_ACCESS_TOKEN` if explicitly provided
2. application default credentials / service account JSON from `GOOGLE_APPLICATION_CREDENTIALS`

This preserves a simple local-dev path and a practical server deployment path.

---

## 7. Runtime Behavior

### 7.1 Dictionary-first behavior

Keep the current built-in dictionary entries. If a phrase matches, return it immediately without calling Google.

This preserves tailored translations such as:

- `faithful attendants of Multivac`

### 7.2 Mock behavior

In `mock` mode, continue to return the current local fallback translation.

### 7.3 Real behavior

In `real` mode:

- call Google Cloud Translation
- translate from English to Simplified Chinese
- keep `note` as a local, generic explanation string rather than asking Google to generate commentary

Example service output:

```ts
{
  sourceText: "stellar cartography",
  translatedText: "恒星制图",
  note: "当前结果由 Google 翻译生成，可结合上下文继续判断术语和语气。"
}
```

### 7.4 Timeout and fallback

Keep the current user-friendly behavior:

- race the provider request against a short timeout
- if Google is too slow or fails, return the local fallback translation

This avoids blocking the popover in normal reading flows.

---

## 8. Error Handling

The API route should keep returning a user-safe error:

- `Translation failed, please retry.`

The server should additionally log structured diagnostics, similar to transcription logging, so production logs reveal the actual failure class:

- Google token acquisition failed
- Google translation request failed
- Google response parsing failed

Sensitive values must not be logged:

- access tokens
- service account contents
- authorization headers

---

## 9. Testing Strategy

### Unit tests

Add or update tests for:

- translation env resolution
- Google request construction
- Google response parsing
- dictionary-first behavior
- provider timeout fallback behavior
- translate route error logging in production

### Existing behavior preservation

The following behavior should remain true:

- popover renders the same schema
- favorites continue storing `translatedText`
- no client-side secret exposure

---

## 10. Out of Scope

This change does not include:

- glossary support
- batch translation
- automatic language detection UI
- front-end direct calls to Google
- replacing the analysis provider
- changing the popover layout or sidebar storage contract

---

## 11. Summary

The safest change is to keep the current translation route and UI intact, introduce a dedicated Google translation provider layer, move translation config away from OpenRouter analysis settings, and preserve both dictionary-first behavior and timeout fallback.

That gives the app a real translation backend without widening the feature scope or changing the user-visible interaction model.
