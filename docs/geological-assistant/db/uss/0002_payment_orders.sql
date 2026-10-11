-- Geological Assistant: Razorpay orders, inside schema geological_assistant (USS project).
-- Additive only. Written by the ga-razorpay-create-order edge function (service role);
-- a signed-in user can read their own orders. Nothing in public or auth is touched.

create table geological_assistant.payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references geological_assistant.courses(id),
  provider text not null default 'razorpay',
  provider_ref text not null unique,
  amount_minor int not null,
  currency text not null default 'INR',
  status text not null default 'created',
  created_at timestamptz not null default now()
);
create index on geological_assistant.payment_orders (user_id, created_at desc);

alter table geological_assistant.payment_orders enable row level security;
create policy orders_own_read on geological_assistant.payment_orders for select to authenticated
  using (auth.uid() = user_id);

grant select on geological_assistant.payment_orders to authenticated;
grant all on geological_assistant.payment_orders to service_role;
