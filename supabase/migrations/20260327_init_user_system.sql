-- CorgiRead user system bootstrap
-- Safe to run from the Supabase SQL Editor on a fresh project.
-- This script creates:
--   - profiles
--   - pdf_documents
--   - recordings
--   - favorites
--   - expression_library
--   - RLS policies for per-user isolation
--   - pdf-documents storage bucket + storage policies
--   - profile bootstrap + storage usage sync triggers

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  storage_quota_bytes bigint not null default 1073741824 check (storage_quota_bytes >= 0),
  storage_used_bytes bigint not null default 0 check (storage_used_bytes >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pdf_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  file_size_bytes bigint not null check (file_size_bytes >= 0),
  storage_path text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid references public.pdf_documents (id) on delete set null,
  page integer not null check (page > 0),
  transcript text not null,
  corrected text not null,
  grammar text not null,
  native_expression text not null,
  coach_feedback text not null,
  summary text not null,
  feedback text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid references public.pdf_documents (id) on delete set null,
  source_text text not null,
  translated_text text not null,
  type text not null check (type in ('word', 'phrase', 'sentence')),
  page integer not null check (page > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.expression_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid references public.pdf_documents (id) on delete set null,
  source_phrase text not null,
  natural_phrase text not null,
  note text not null,
  source_recording_id uuid not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists pdf_documents_user_id_created_at_idx
  on public.pdf_documents (user_id, created_at desc);

create index if not exists recordings_user_id_created_at_idx
  on public.recordings (user_id, created_at desc);

create index if not exists favorites_user_id_created_at_idx
  on public.favorites (user_id, created_at desc);

create index if not exists expression_library_user_id_created_at_idx
  on public.expression_library (user_id, created_at desc);

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update
    set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_profile();

insert into public.profiles (id, email)
select u.id, coalesce(u.email, '')
from auth.users u
on conflict (id) do update
set email = excluded.email;

create or replace function public.refresh_profile_storage_used_bytes(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set storage_used_bytes = coalesce((
    select sum(file_size_bytes)::bigint
    from public.pdf_documents
    where user_id = target_user_id
  ), 0)
  where id = target_user_id;
end;
$$;

create or replace function public.sync_profile_storage_usage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_profile_storage_used_bytes(old.user_id);
    return old;
  end if;

  perform public.refresh_profile_storage_used_bytes(new.user_id);

  if tg_op = 'UPDATE' and old.user_id <> new.user_id then
    perform public.refresh_profile_storage_used_bytes(old.user_id);
  end if;

  return new;
end;
$$;

drop trigger if exists pdf_documents_sync_profile_storage_usage on public.pdf_documents;

create trigger pdf_documents_sync_profile_storage_usage
after insert or update or delete on public.pdf_documents
for each row
execute function public.sync_profile_storage_usage();

alter table public.profiles enable row level security;
alter table public.pdf_documents enable row level security;
alter table public.recordings enable row level security;
alter table public.favorites enable row level security;
alter table public.expression_library enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "pdf_documents_select_own" on public.pdf_documents;
create policy "pdf_documents_select_own"
on public.pdf_documents
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "pdf_documents_insert_own" on public.pdf_documents;
create policy "pdf_documents_insert_own"
on public.pdf_documents
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "pdf_documents_update_own" on public.pdf_documents;
create policy "pdf_documents_update_own"
on public.pdf_documents
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "pdf_documents_delete_own" on public.pdf_documents;
create policy "pdf_documents_delete_own"
on public.pdf_documents
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "recordings_select_own" on public.recordings;
create policy "recordings_select_own"
on public.recordings
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "recordings_insert_own" on public.recordings;
create policy "recordings_insert_own"
on public.recordings
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "recordings_update_own" on public.recordings;
create policy "recordings_update_own"
on public.recordings
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "recordings_delete_own" on public.recordings;
create policy "recordings_delete_own"
on public.recordings
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
on public.favorites
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
on public.favorites
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "favorites_update_own" on public.favorites;
create policy "favorites_update_own"
on public.favorites
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
on public.favorites
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "expression_library_select_own" on public.expression_library;
create policy "expression_library_select_own"
on public.expression_library
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "expression_library_insert_own" on public.expression_library;
create policy "expression_library_insert_own"
on public.expression_library
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "expression_library_update_own" on public.expression_library;
create policy "expression_library_update_own"
on public.expression_library
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "expression_library_delete_own" on public.expression_library;
create policy "expression_library_delete_own"
on public.expression_library
for delete
to authenticated
using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('pdf-documents', 'pdf-documents', false)
on conflict (id) do nothing;

drop policy if exists "pdf_documents_storage_select_own" on storage.objects;
create policy "pdf_documents_storage_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'pdf-documents'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "pdf_documents_storage_insert_own" on storage.objects;
create policy "pdf_documents_storage_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'pdf-documents'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "pdf_documents_storage_update_own" on storage.objects;
create policy "pdf_documents_storage_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'pdf-documents'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
)
with check (
  bucket_id = 'pdf-documents'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
);

drop policy if exists "pdf_documents_storage_delete_own" on storage.objects;
create policy "pdf_documents_storage_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'pdf-documents'
  and split_part(name, '/', 1) = 'users'
  and split_part(name, '/', 2) = auth.uid()::text
);

select public.refresh_profile_storage_used_bytes(id)
from public.profiles;
