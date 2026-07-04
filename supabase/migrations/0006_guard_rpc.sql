-- Atomic signup-guard check: advisory lock per ip_hash removes the
-- check-then-insert race that parallel signups could exploit.

create or replace function public.register_signup_guard(
  p_ip_hash text,
  p_user_id uuid,
  p_window_hours integer default 24,
  p_max_grants integer default 2
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('signup_guard:' || p_ip_hash));

  select count(*) into v_count
  from signup_guard
  where ip_hash = p_ip_hash
    and created_at > now() - make_interval(hours => p_window_hours);

  insert into signup_guard (ip_hash, user_id) values (p_ip_hash, p_user_id);

  return v_count < p_max_grants;
end $$;

revoke execute on function public.register_signup_guard from public, anon, authenticated;
