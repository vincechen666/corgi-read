# Supabase Setup Checklist

This checklist matches the current CorgiRead user-system implementation and the bootstrap SQL in [20260327_init_user_system.sql](/Users/cyc/Documents/Code/corgi-read/supabase/migrations/20260327_init_user_system.sql).

## 1. Create Or Select A Supabase Project

- Open the Supabase dashboard and create or choose the target project.
- Copy the project URL and anon key for the app runtime.

You will later place these values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 2. Enable Email Login

- Open `Authentication -> Providers`.
- Enable `Email`.
- Keep `Confirm email` enabled if you want email verification.
- Enable magic link / OTP flow so the current lightweight login flow can work.

Recommended:

- Use email OTP or magic link as the only enabled provider for the MVP.
- Configure the site URL and redirect URL to match your deployed app.

## 3. Run The Bootstrap SQL

- Open `SQL Editor`.
- Paste and run [20260327_init_user_system.sql](/Users/cyc/Documents/Code/corgi-read/supabase/migrations/20260327_init_user_system.sql).

This script creates:

- `profiles`
- `pdf_documents`
- `recordings`
- `favorites`
- `expression_library`
- RLS policies
- `pdf-documents` storage bucket
- auth trigger for auto-creating `profiles`
- storage usage sync trigger for `pdf_documents`

## 4. Confirm Tables Exist

Open `Table Editor` and verify these tables are present under `public`:

- `profiles`
- `pdf_documents`
- `recordings`
- `favorites`
- `expression_library`

Expected profile defaults:

- `storage_quota_bytes = 1073741824`
- `storage_used_bytes = 0`

## 5. Confirm The Storage Bucket

Open `Storage` and verify:

- Bucket name: `pdf-documents`
- Public access: disabled

The current app expects user PDF objects to live under paths like:

```txt
users/<user_id>/pdf/<document_id>.pdf
```

## 6. Confirm Auth Trigger Works

- Create a test user with email login.
- Open `Table Editor -> profiles`.
- Confirm a row was created automatically for the new auth user.

Expected:

- `profiles.id` matches `auth.users.id`
- `profiles.email` matches the login email
- `storage_quota_bytes` defaults to `1073741824`

## 7. Configure The App Runtime

Add the Supabase runtime variables in the app root `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

If you are also using the current AI stack, keep the existing provider variables as well.

## 8. Smoke Test The User Flow

Run the app and verify this path:

1. Open the app as a guest.
2. Click the avatar entry and log in with email OTP / magic link.
3. Upload a PDF while logged in.
4. Open the left-side `PDF Library` overlay.
5. Confirm the uploaded PDF appears in the list.
6. Create a favorite or recording-derived item.
7. Confirm the right sidebar reflects cloud-backed data.

## 9. Run The RLS Self-Check SQL

Use the companion script:

- [20260327_user_system_rls_self_check.sql](/Users/cyc/Documents/Code/corgi-read/supabase/checks/20260327_user_system_rls_self_check.sql)

This script helps verify:

- tables exist
- RLS is enabled
- policies exist
- bucket exists
- storage policies exist

## 10. Known Boundaries In The Current MVP

- Capacity tracking is precise for PDF file sizes only.
- Notes belong to the user's private data model, but note byte usage is not yet added into `storage_used_bytes`.
- Guest mode still works without Supabase login.
- The left `PDF Library` entry only appears for logged-in users.
