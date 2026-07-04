-- ReklamAI core schema
-- All tables default-deny RLS; balances/ledger mutate only through RPCs.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  locale text not null default 'tr' check (locale in ('tr', 'en')),
  role text not null default 'user' check (role in ('user', 'admin')),
  plan_tier text not null default 'free' check (plan_tier in ('free', 'starter', 'pro', 'business')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- role/plan_tier must not be self-escalatable
create or replace function public.protect_profile_columns()
returns trigger language plpgsql as $$
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    new.role := old.role;
    new.plan_tier := old.plan_tier;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------------
-- credit_balances (cache; mutated only by SECURITY DEFINER RPCs)
-- ---------------------------------------------------------------------------
create table public.credit_balances (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  updated_at timestamptz not null default now()
);

alter table public.credit_balances enable row level security;

create policy "credit_balances_select_own" on public.credit_balances
  for select using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- credit_transactions (append-only ledger)
-- ---------------------------------------------------------------------------
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  type text not null check (type in (
    'grant_welcome', 'grant_subscription', 'grant_pack', 'grant_manual',
    'reserve', 'settle', 'refund', 'adjust', 'expire'
  )),
  balance_after integer not null,
  reference_type text,
  reference_id text,
  idempotency_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index credit_transactions_user_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;

create policy "credit_transactions_select_own" on public.credit_transactions
  for select using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- model_catalog (server-authoritative pricing; clients read enabled rows)
-- ---------------------------------------------------------------------------
create table public.model_catalog (
  id text primary key,
  fal_model_id text not null,
  kind text not null check (kind in ('video_t2v', 'video_i2v', 'video_v2v', 'tts', 'music', 'image', 'upscale')),
  tier text not null check (tier in ('budget', 'standard', 'premium', 'ultra')),
  label text not null,
  per_unit text not null check (per_unit in ('second', 'video', 'chars_1k', 'minute', 'generation', 'megapixel')),
  unit_price_usd numeric(10, 6) not null,
  audio_unit_price_usd numeric(10, 6),
  native_audio boolean not null default false,
  durations integer[],
  aspect_ratios text[],
  min_plan text not null default 'starter' check (min_plan in ('free', 'starter', 'pro', 'business')),
  enabled boolean not null default false,
  sort integer not null default 100,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.model_catalog enable row level security;

create policy "model_catalog_select_enabled" on public.model_catalog
  for select using (enabled = true);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  category text,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects_all_own" on public.projects
  for all using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- assets (storage object metadata)
-- ---------------------------------------------------------------------------
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('upload_image', 'upload_video', 'output_video', 'output_audio', 'thumbnail')),
  bucket text not null,
  storage_path text not null,
  mime text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  unique (bucket, storage_path)
);

alter table public.assets enable row level security;

create policy "assets_select_own" on public.assets
  for select using (user_id = (select auth.uid()));

create policy "assets_insert_own" on public.assets
  for insert with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- generations
-- ---------------------------------------------------------------------------
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  kind text not null check (kind in ('video_t2v', 'video_i2v', 'video_v2v', 'tts', 'music', 'image')),
  model_id text not null references public.model_catalog (id),
  prompt text,
  params jsonb not null default '{}'::jsonb,
  category text,
  platform text,
  credit_cost integer not null check (credit_cost > 0),
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'canceled')),
  fal_request_id text unique,
  input_asset_id uuid references public.assets (id),
  output_asset_id uuid references public.assets (id),
  output_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index generations_user_idx on public.generations (user_id, created_at desc);
create index generations_status_idx on public.generations (status, created_at)
  where status in ('queued', 'processing');

alter table public.generations enable row level security;

create policy "generations_select_own" on public.generations
  for select using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- subscriptions (mirror of payment provider state)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'polar' check (provider in ('polar', 'stripe')),
  external_subscription_id text not null,
  external_customer_id text,
  product_id text,
  plan_tier text not null check (plan_tier in ('starter', 'pro', 'business')),
  status text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'revoked')),
  monthly_credit_grant integer not null default 0,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_subscription_id)
);

create index subscriptions_user_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- orders (payment provider orders: renewals + credit packs)
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'polar' check (provider in ('polar', 'stripe')),
  external_order_id text not null,
  type text not null check (type in ('subscription', 'credit_pack')),
  product_id text,
  amount_usd numeric(10, 2),
  credits_granted integer not null default 0,
  billing_reason text,
  status text not null default 'paid' check (status in ('paid', 'refunded')),
  created_at timestamptz not null default now(),
  unique (provider, external_order_id)
);

create index orders_user_idx on public.orders (user_id, created_at desc);

alter table public.orders enable row level security;

create policy "orders_select_own" on public.orders
  for select using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- webhook_events (idempotency + audit for inbound webhooks)
-- ---------------------------------------------------------------------------
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('fal', 'polar', 'stripe')),
  external_event_id text not null,
  event_type text,
  payload jsonb,
  status text not null default 'received' check (status in ('received', 'processed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, external_event_id)
);

alter table public.webhook_events enable row level security;
-- no client policies: service role only

-- ---------------------------------------------------------------------------
-- realtime for generation status updates
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.generations;
