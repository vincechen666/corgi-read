-- Supabase self-check for the CorgiRead user system.
-- Safe to run from SQL Editor.
-- This script is intentionally read-only.
--
-- Notes:
-- 1. SQL Editor usually runs with elevated privileges, so this script verifies schema,
--    RLS enablement, policies, and bucket/policy presence.
-- 2. It does not prove end-user policy enforcement by itself. For that, also verify
--    behavior through the app with two different accounts.

-- 1. Confirm expected public tables exist.
select
  table_schema,
  table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'pdf_documents',
    'recordings',
    'favorites',
    'expression_library'
  )
order by table_name;

-- 2. Confirm RLS is enabled on the user-system tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'pdf_documents',
    'recordings',
    'favorites',
    'expression_library'
  )
order by c.relname;

-- 3. Confirm row-level policies exist on the application tables.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'pdf_documents',
    'recordings',
    'favorites',
    'expression_library'
  )
order by tablename, policyname;

-- 4. Confirm the storage bucket exists and is private.
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'pdf-documents';

-- 5. Confirm storage policies exist for the bucket path convention.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- 6. Confirm the auth bootstrap trigger and functions exist.
select
  routine_schema,
  routine_name,
  routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'handle_new_profile',
    'refresh_profile_storage_used_bytes',
    'sync_profile_storage_usage'
  )
order by routine_name;

select
  trigger_schema,
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation
from information_schema.triggers
where (event_object_schema = 'auth' and event_object_table = 'users')
   or (event_object_schema = 'public' and event_object_table = 'pdf_documents')
order by event_object_schema, event_object_table, trigger_name;

-- 7. Quick profile defaults check.
select
  id,
  email,
  storage_quota_bytes,
  storage_used_bytes,
  created_at
from public.profiles
order by created_at desc
limit 10;

-- 8. Quick PDF metadata check.
select
  id,
  user_id,
  file_name,
  file_size_bytes,
  storage_path,
  created_at
from public.pdf_documents
order by created_at desc
limit 10;

-- 9. Quick note table checks.
select
  'recordings' as table_name,
  count(*)::bigint as row_count
from public.recordings
union all
select
  'favorites' as table_name,
  count(*)::bigint as row_count
from public.favorites
union all
select
  'expression_library' as table_name,
  count(*)::bigint as row_count
from public.expression_library;

-- 10. Reminder for manual app-level verification.
select
  'manual-check' as category,
  'Log in with two different accounts and verify each account only sees its own PDF library and sidebar data.' as next_step;
