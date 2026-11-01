-- Gitsum Pro subscriptions. Written only by /api/stripe-webhook (service role).
-- Signed-in users can read their own row; nobody can write from the browser.

create table if not exists public.gitsum_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists gitsum_subscriptions_customer_idx on public.gitsum_subscriptions (stripe_customer_id);

alter table public.gitsum_subscriptions enable row level security;

drop policy if exists "read own gitsum subscription" on public.gitsum_subscriptions;
create policy "read own gitsum subscription"
  on public.gitsum_subscriptions for select
  to authenticated
  using (auth.uid() = user_id);
