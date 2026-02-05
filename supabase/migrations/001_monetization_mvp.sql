-- Monetization MVP schema (Telegram Stars + activation codes)
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

-- 1) user_plans: one current plan per user
create table if not exists public.user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro','max')),
  status text not null default 'active' check (status in ('active','blocked','expired')),
  valid_until timestamptz null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_plans_plan_idx on public.user_plans(plan);
create index if not exists user_plans_status_idx on public.user_plans(status);

-- 2) activation_codes: issued by bot, redeemed on website
create table if not exists public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  plan text not null check (plan in ('pro','max')),
  duration_days int not null default 30 check (duration_days > 0),
  max_activations int not null default 1 check (max_activations > 0),
  used_count int not null default 0 check (used_count >= 0),
  expires_at timestamptz null,
  created_by text not null default 'telegram_bot',
  created_at timestamptz not null default now()
);

create index if not exists activation_codes_plan_idx on public.activation_codes(plan);
create index if not exists activation_codes_expires_at_idx on public.activation_codes(expires_at);

-- 3) plan_activations: immutable redemption history
create table if not exists public.plan_activations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_id uuid not null references public.activation_codes(id) on delete restrict,
  plan_before text not null,
  plan_after text not null,
  valid_until_before timestamptz null,
  valid_until_after timestamptz null,
  activated_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists plan_activations_user_id_idx on public.plan_activations(user_id);
create index if not exists plan_activations_activated_at_idx on public.plan_activations(activated_at desc);

-- 4) daily_usage: per-day message counters for limit enforcement
create table if not exists public.daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  messages_used int not null default 0 check (messages_used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists daily_usage_day_idx on public.daily_usage(day);

-- Seed free plan for all existing users that don't have a row yet
insert into public.user_plans (user_id, plan, status, source)
select u.id, 'free', 'active', 'migration'
from auth.users u
left join public.user_plans up on up.user_id = u.id
where up.user_id is null;

-- Optional helper to keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_plans_touch_updated_at on public.user_plans;
create trigger trg_user_plans_touch_updated_at
before update on public.user_plans
for each row
execute function public.touch_updated_at();

-- RLS baseline (adjust as needed)
alter table public.user_plans enable row level security;
alter table public.activation_codes enable row level security;
alter table public.plan_activations enable row level security;
alter table public.daily_usage enable row level security;

-- Users can read only their own plan/usage/activations
drop policy if exists user_plans_select_own on public.user_plans;
create policy user_plans_select_own on public.user_plans
for select using (auth.uid() = user_id);

drop policy if exists daily_usage_select_own on public.daily_usage;
create policy daily_usage_select_own on public.daily_usage
for select using (auth.uid() = user_id);

drop policy if exists plan_activations_select_own on public.plan_activations;
create policy plan_activations_select_own on public.plan_activations
for select using (auth.uid() = user_id);

-- activation_codes must be read/write only by service role on backend
-- (no user-facing policy on purpose)
