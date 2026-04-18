# PDF Upload Progress Design

## Overview

This design adds a lightweight upload progress indicator for authenticated users when a PDF is being saved to the cloud. The goal is to make the reader feel more trustworthy without interrupting the current "reader-first" workflow: the PDF should still open locally right away, while the cloud save proceeds in the background.

## Goals

- Show authenticated users that their PDF is actively uploading to cloud storage
- Keep the current local-open-first behavior intact
- Avoid adding heavy new UI or blocking the reading workflow
- Hide the progress indicator automatically when upload finishes
- Preserve existing failure handling for quota and cloud save errors

## Non-Goals

- No progress bar for guest/local-only uploads
- No separate upload manager or file queue
- No progress UI for metadata insert or later background sync tasks
- No change to the existing PDF library or quota product rules

## Product Behavior

### Authenticated Upload

When an authenticated user selects a PDF:

1. The PDF opens locally in the reader immediately
2. A thin progress bar appears above the PDF.js reading area
3. The progress bar advances during the cloud file upload
4. When upload completes, the progress bar hides
5. Metadata insert and PDF-library updates continue as they do today

If metadata persistence later fails, the progress bar still hides because the file upload itself has finished. The existing cloud error banner continues to report the failure.

### Guest Upload

Guest users keep the existing local-only behavior:

- no cloud upload
- no upload progress bar
- no new visual change in the reading area

## UI Placement

The progress bar should live inside the left reading pane, directly above the PDF.js content region.

Design constraints:

- full width of the reading pane content area
- very thin vertical height
- warm accent color consistent with the current interface
- no additional persistent label row
- hidden when idle

This keeps the interface compact and avoids competing with the page badge, zoom controls, or top navigation.

## Technical Approach

Supabase standard `.upload()` does not expose progress callbacks. To show real progress, the authenticated upload path should switch to Supabase resumable upload using TUS, which supports byte-level progress reporting.

Recommended upload flow:

1. User selects PDF
2. Reader opens a local `blob:` URL immediately
3. If authenticated, start TUS upload to the `pdf-documents` bucket
4. Update upload progress state from `bytesUploaded / bytesTotal`
5. After upload completes, hide the progress bar
6. Insert the `pdf_documents` metadata row
7. Update in-session quota and PDF library state

## State Model

Add a small upload UI state for the active authenticated PDF upload:

- `idle`
- `uploading`
- `complete`

And data:

- `progressPercent`
- optional `documentName`

The UI only needs `uploading` plus `progressPercent`; the completed state can be transient and collapse back to hidden immediately.

## Error Handling

### Quota Exceeded

- Do not show the progress bar
- Show the existing quota error banner
- Keep local reading available

### Storage Upload Failure

- Hide the progress bar
- Show the existing cloud error banner
- Keep local reading available

### Metadata Insert Failure

- Hide the progress bar because the file upload already finished
- Show the existing cloud error banner
- Keep local reading available

## Testing Scope

Cover at least:

- authenticated upload shows the progress bar
- progress updates as upload advances
- upload completion hides the progress bar
- upload failure hides the progress bar and preserves the error banner
- guest upload never shows the progress bar

## Implementation Notes

- Keep the progress UI scoped to the reader pane; do not add top-level global banners for upload state
- Prefer a single-upload assumption for the MVP because the UI only supports opening one PDF at a time
- The progress bar represents file transfer only, not the entire cloud persistence pipeline
