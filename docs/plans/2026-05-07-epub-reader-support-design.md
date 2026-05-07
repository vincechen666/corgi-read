# EPUB Reader Support Design

## Goal

Add EPUB reading support while preserving the existing PDF upload, cloud library, translation selection, recording, and progress flows.

## Approach

Keep the current PDF viewer intact and introduce EPUB as a second document kind. The app will detect the selected file kind from MIME type or extension, keep `source` as the same blob or signed URL value, and pass `documentKind` into the reading stage. The stage will choose between the existing `PdfViewer` and a new browser-only `EpubViewer`.

Cloud storage will continue using the existing `pdf_documents` metadata table and bucket to avoid a migration in this feature. Storage paths will keep PDF files under `users/{userId}/pdf/{documentId}.pdf` and EPUB files under `users/{userId}/epub/{documentId}.epub`; signed URL loading stays unchanged.

## UI

User-facing copy should describe "PDF / EPUB" or "document" where the feature is no longer PDF-only. Existing accessibility names used by tests can keep PDF as a substring while mentioning EPUB, so older PDF behavior remains stable.

## Error Handling

Unsupported uploads should be rejected before object URL creation with a clear "Please choose a PDF or EPUB file." message. Existing cloud quota, upload progress, and cloud failure handling apply to both file types.

## Testing

Tests should cover document kind detection, storage path extension selection, EPUB upload acceptance, upload menu copy, and reader-stage dispatch to the EPUB viewer.
