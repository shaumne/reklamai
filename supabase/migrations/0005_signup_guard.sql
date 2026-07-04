-- Signup abuse guard: hashed-IP log of recent signups. Welcome credits are
-- granted from server code (which can see the request IP) instead of the
-- signup trigger; the 3rd+ signup from the same IP within 24h gets none.

create table public.signup_guard (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index signup_guard_ip_idx on public.signup_guard (ip_hash, created_at desc);

alter table public.signup_guard enable row level security;
-- service role only; no client policies

-- welcome grant moves out of the trigger (see server-side maybeGrantWelcome)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    case when new.raw_user_meta_data ->> 'locale' in ('tr', 'en')
         then new.raw_user_meta_data ->> 'locale' else 'tr' end
  )
  on conflict (id) do nothing;

  insert into public.credit_balances (user_id, balance, reserved)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end $$;
