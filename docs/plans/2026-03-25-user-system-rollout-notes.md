# User System Rollout Notes

## Scope

This rollout adds a lightweight optional user system on top of the existing guest reader:

- guest users keep the local-only reader flow
- signed-in users get a private cloud PDF library
- signed-in users read and write cloud-backed recordings, favorites, and expressions
- signed-in uploads respect a 1 GB starting quota

## Supabase Setup

Configure the following in Supabase:

1. Enable email OTP / magic-link login in Auth
2. Create the `pdf-documents` storage bucket
3. Create these tables:
   - `profiles`
   - `pdf_documents`
   - `recordings`
   - `favorites`
   - `expression_library`
4. Enable Row Level Security on every user-owned table
5. Add policies so users can only read and write rows where `user_id = auth.uid()`
6. Store uploaded PDFs under `users/{user_id}/pdf/{document_id}.pdf`

Recommended `profiles` defaults:

- `storage_quota_bytes = 1073741824`
- `storage_used_bytes = 0`

## Environment Variables

Minimum client-side Supabase config:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Keep the existing translation, transcription, and analysis provider settings unchanged.

## Verification Checklist

- Guest users can still upload a local PDF and read without logging in
- Guest avatar opens the email login modal
- Authenticated users see the `PDF 库` trigger
- Authenticated uploads open locally first, then save to cloud
- PDF library overlay opens and closes correctly
- Cloud-backed sidebar loads recordings, favorites, and expressions
- Quota overflow shows a lightweight error without blocking reading
- Cloud load failures show a lightweight error banner

## Known Limits

- The current MVP seeds a couple of signed-in PDF rows in the UI to make the library interaction obvious before full backend wiring is complete
- Raw audio files are not stored in cloud storage
- Reading progress restore is not included yet
