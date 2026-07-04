-- Add Japanese (ja) locale support to profiles and signup trigger.

alter table public.profiles drop constraint if exists profiles_locale_check;
alter table public.profiles add constraint profiles_locale_check check (locale in ('tr', 'en', 'ja'));

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
    case when new.raw_user_meta_data ->> 'locale' in ('tr', 'en', 'ja')
         then new.raw_user_meta_data ->> 'locale' else 'tr' end
  )
  on conflict (id) do nothing;

  insert into public.credit_balances (user_id, balance, reserved)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end $$;
