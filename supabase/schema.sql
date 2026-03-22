create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  policy_number text not null unique,
  type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  policy_number text not null,
  claim_type text not null,
  incident_date date not null,
  description text not null,
  status text not null default 'Pending',
  reference text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_claims_status on public.claims(status);
create index if not exists idx_claims_policy_number on public.claims(policy_number);
create index if not exists idx_claims_created_at on public.claims(created_at desc);
create index if not exists idx_policies_user_id on public.policies(user_id);
