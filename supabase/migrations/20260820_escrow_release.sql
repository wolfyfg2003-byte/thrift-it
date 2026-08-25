-- Accelerated 12-hour escrow auto-release after AJEX delivered.
-- Buyer may complete early; a dispute freezes payout forever until support acts.

create table if not exists public.escrow_balances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  listing_id text,
  amount integer not null,
  status text not null check (status in ('held', 'frozen', 'released')),
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null,
  buyer_id uuid,
  seller_id uuid,
  item_price integer not null,
  status text not null check (status in ('escrow_held', 'frozen', 'completed')),
  ajex_status text not null check (
    ajex_status in ('label_printed', 'picked_up', 'out_for_delivery', 'delivered')
  ),
  shipping_label_url text,
  delivered_at timestamptz,
  auto_release_at timestamptz,
  disputed boolean not null default false,
  dispute_reason text,
  dispute_details text,
  dispute_opened_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions (id),
  listing_id text not null,
  seller_share integer not null,
  concierge_share integer not null,
  destination text not null default 'user_profiles.wallet_balance',
  dispatched_at timestamptz not null default now()
);

comment on column public.transactions.auto_release_at is
  '12 hours after AJEX delivered. Frozen disputes never auto-release.';
