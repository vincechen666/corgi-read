-- Normalize existing profile emails to lowercase and refresh the bootstrap trigger.

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

delete from public.profiles p
using (
  select id
  from (
    select
      id,
      row_number() over (
        partition by lower(email)
        order by created_at asc, id asc
      ) as rn
    from public.profiles
  ) ranked_profiles
  where rn > 1
) duplicate_profiles
where p.id = duplicate_profiles.id;

update public.profiles
set email = lower(email)
where email <> lower(email);
