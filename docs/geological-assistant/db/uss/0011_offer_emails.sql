-- Offer emails for Calecute courses (USS project, new schema `offers`).
-- Additive: nothing in public, auth or geological_assistant is changed.
--
-- Used only by the ga-offer-emails and offer-unsubscribe edge functions, which connect with
-- SUPABASE_DB_URL. The schema is NOT exposed in the Data API, and the browser has no grants:
-- the admin screen goes through the edge function, which checks offers.admins.
--
--   offers.admins:    who may send (email).
--   offers.contacts:  one row per email ever sent an offer; its token is the unsubscribe link.
--                     unsubscribed_at set = never email this address again, from any course.
--   offers.campaigns: one row per offer (subject, message, coupon, audiences).
--   offers.sends:     one row per campaign per email; the primary key stops a second send.

create schema if not exists offers;
revoke all on schema offers from public, anon, authenticated;
grant usage on schema offers to service_role;

create table if not exists offers.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
insert into offers.admins (email) values ('vs.vivek1@gmail.com') on conflict do nothing;

create table if not exists offers.contacts (
  email text primary key check (email = lower(email)),
  token uuid not null unique default gen_random_uuid(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists offers.campaigns (
  id uuid primary key default gen_random_uuid(),
  course text not null,                 -- e.g. 'geological-assistant'
  subject text not null check (length(subject) between 3 and 150),
  body text not null check (length(body) between 10 and 5000),
  coupon_code text,
  link_url text not null,               -- where the button goes
  audiences text[] not null,            -- audience keys, see the edge function
  skip_paid boolean not null default true,
  created_by text not null,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists offers.sends (
  campaign_id uuid not null references offers.campaigns(id) on delete cascade,
  email text not null,
  audience text not null,
  status text not null check (status in ('sent', 'failed')),
  error text,
  provider_id text,
  sent_at timestamptz not null default now(),
  primary key (campaign_id, email)
);
create index if not exists sends_email on offers.sends (email);

alter table offers.admins enable row level security;
alter table offers.contacts enable row level security;
alter table offers.campaigns enable row level security;
alter table offers.sends enable row level security;
grant all on all tables in schema offers to service_role;
