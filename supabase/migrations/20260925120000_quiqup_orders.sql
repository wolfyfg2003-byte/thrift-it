-- Quiqup last-mile ids and extra shipping states for marketplace pickups.

alter table public.transactions
  add column if not exists origin_address jsonb,
  add column if not exists destination_address jsonb,
  add column if not exists quiqup_order_id text,
  add column if not exists quiqup_partner_order_id text,
  add column if not exists quiqup_tracking_url text,
  add column if not exists quiqup_state text,
  add column if not exists quiqup_state_updated_at timestamptz;

create unique index if not exists transactions_quiqup_order_id_key
  on public.transactions (quiqup_order_id)
  where quiqup_order_id is not null;

alter table public.transactions drop constraint if exists transactions_shipping_status_check;
alter table public.transactions
  add constraint transactions_shipping_status_check
  check (shipping_status in (
    'pending',
    'label_printed',
    'picked_up',
    'out_for_delivery',
    'delivered',
    'not_required',
    'collection_failed',
    'delivery_failed',
    'returning',
    'returned',
    'cancelled',
    'rejected'
  ));
