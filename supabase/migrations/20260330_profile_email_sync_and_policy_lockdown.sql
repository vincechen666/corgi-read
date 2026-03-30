-- Lock profiles.email to system-managed writes and keep it synced with auth.users.

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, lower(coalesce(new.email, '')))
  on conflict (id) do update
    set email = lower(excluded.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert or update on auth.users
for each row
execute function public.handle_new_profile();

drop policy if exists "profiles_update_own" on public.profiles;
