-- Credit ledger RPCs. All SECURITY DEFINER; concurrency handled with
-- per-key advisory locks + row locks; idempotency via unique ledger keys.

-- ---------------------------------------------------------------------------
-- grant_credits: add credits (welcome, subscription period, pack, manual)
-- ---------------------------------------------------------------------------
create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_reference_type text default null,
  p_reference_id text default null,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
begin
  if p_amount <= 0 then
    raise exception 'GRANT_AMOUNT_INVALID';
  end if;

  if p_idempotency_key is not null then
    perform pg_advisory_xact_lock(hashtext(p_idempotency_key));
    if exists (select 1 from credit_transactions where idempotency_key = p_idempotency_key) then
      return;
    end if;
  end if;

  insert into credit_balances (user_id, balance, reserved)
  values (p_user_id, 0, 0)
  on conflict (user_id) do nothing;

  update credit_balances
  set balance = balance + p_amount, updated_at = now()
  where user_id = p_user_id
  returning balance into v_balance;

  insert into credit_transactions
    (user_id, amount, type, balance_after, reference_type, reference_id, idempotency_key, metadata)
  values
    (p_user_id, p_amount, p_type, v_balance, p_reference_type, p_reference_id, p_idempotency_key, p_metadata);
end $$;

revoke execute on function public.grant_credits from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- reserve_credits: hold credits for a generation before submitting the job
-- ---------------------------------------------------------------------------
create or replace function public.reserve_credits(
  p_user_id uuid,
  p_generation_id uuid,
  p_amount integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_key text := 'reserve:' || p_generation_id::text;
begin
  if p_amount <= 0 then
    raise exception 'RESERVE_AMOUNT_INVALID';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_key));
  if exists (select 1 from credit_transactions where idempotency_key = v_key) then
    return;
  end if;

  select balance into v_balance
  from credit_balances
  where user_id = p_user_id
  for update;

  if v_balance is null or v_balance < p_amount then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  update credit_balances
  set balance = balance - p_amount, reserved = reserved + p_amount, updated_at = now()
  where user_id = p_user_id;

  insert into credit_transactions
    (user_id, amount, type, balance_after, reference_type, reference_id, idempotency_key)
  values
    (p_user_id, -p_amount, 'reserve', v_balance - p_amount, 'generation', p_generation_id::text, v_key);
end $$;

revoke execute on function public.reserve_credits from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- settle_generation: convert reservation to final spend (job succeeded)
-- ---------------------------------------------------------------------------
create or replace function public.settle_generation(
  p_generation_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_cost integer;
  v_balance integer;
  v_final_key text := 'final:' || p_generation_id::text;
  v_key text := 'settle:' || p_generation_id::text;
begin
  perform pg_advisory_xact_lock(hashtext(v_final_key));

  if exists (select 1 from credit_transactions
             where idempotency_key in (v_key, 'refund:' || p_generation_id::text)) then
    return; -- already settled or refunded
  end if;

  select user_id, credit_cost into v_user_id, v_cost
  from generations where id = p_generation_id;
  if v_user_id is null then
    raise exception 'GENERATION_NOT_FOUND';
  end if;

  if not exists (select 1 from credit_transactions
                 where idempotency_key = 'reserve:' || p_generation_id::text) then
    raise exception 'NO_RESERVATION';
  end if;

  update credit_balances
  set reserved = greatest(reserved - v_cost, 0), updated_at = now()
  where user_id = v_user_id;

  select balance into v_balance from credit_balances where user_id = v_user_id;

  insert into credit_transactions
    (user_id, amount, type, balance_after, reference_type, reference_id, idempotency_key)
  values
    (v_user_id, 0, 'settle', v_balance, 'generation', p_generation_id::text, v_key);
end $$;

revoke execute on function public.settle_generation from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- refund_generation: return reserved credits (job failed / canceled)
-- ---------------------------------------------------------------------------
create or replace function public.refund_generation(
  p_generation_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_cost integer;
  v_balance integer;
  v_final_key text := 'final:' || p_generation_id::text;
  v_key text := 'refund:' || p_generation_id::text;
begin
  perform pg_advisory_xact_lock(hashtext(v_final_key));

  if exists (select 1 from credit_transactions
             where idempotency_key in (v_key, 'settle:' || p_generation_id::text)) then
    return; -- already refunded or settled
  end if;

  select user_id, credit_cost into v_user_id, v_cost
  from generations where id = p_generation_id;
  if v_user_id is null then
    raise exception 'GENERATION_NOT_FOUND';
  end if;

  if not exists (select 1 from credit_transactions
                 where idempotency_key = 'reserve:' || p_generation_id::text) then
    return; -- nothing was reserved; nothing to refund
  end if;

  update credit_balances
  set balance = balance + v_cost,
      reserved = greatest(reserved - v_cost, 0),
      updated_at = now()
  where user_id = v_user_id
  returning balance into v_balance;

  insert into credit_transactions
    (user_id, amount, type, balance_after, reference_type, reference_id, idempotency_key)
  values
    (v_user_id, v_cost, 'refund', v_balance, 'generation', p_generation_id::text, v_key);
end $$;

revoke execute on function public.refund_generation from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- signup provisioning: profile + balance + one-time welcome credits
-- ---------------------------------------------------------------------------
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

  perform public.grant_credits(
    new.id, 20, 'grant_welcome', 'signup', new.id::text, 'signup:' || new.id::text
  );

  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
