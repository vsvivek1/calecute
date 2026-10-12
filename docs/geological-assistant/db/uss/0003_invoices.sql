-- Geological Assistant: GST tax invoices and credit notes, inside schema geological_assistant (USS).
-- Additive only. Nothing in public or auth is changed (auth.users is only read, for the buyer's name).
--
-- One invoice per captured Razorpay payment, one credit note per processed refund, both issued by
-- the ga-razorpay-webhook edge function (service role). A signed-in user can read their own.
-- Each document copies the seller details at the time it is issued, so editing invoice_settings
-- later never changes an invoice that has already gone out.
--
-- Numbering (CGST Rule 46(b)): one consecutive series per financial year (April to March, IST),
-- at most 16 characters: GA/26-27/0001 for invoices, GACN/26-27/0001 for credit notes. The counter
-- is a row locked inside the issuing transaction, so a failed issue rolls back its number too and
-- the series has no gaps.

-- Seller details. One row. Fill in GSTIN once registered; until then documents are issued as
-- plain receipts with no tax lines (an unregistered seller cannot charge GST).
create table geological_assistant.invoice_settings (
  id boolean primary key default true check (id),
  legal_name text not null,
  address text not null,
  state_code text not null,              -- two-digit GST state code of the seller
  gstin text,                            -- null = not registered for GST yet
  sac text not null default '999293',    -- commercial training and coaching services
  gst_rate_bp int not null default 1800, -- 18.00%, in basis points
  price_includes_gst boolean not null default true,
  support_email text not null,
  updated_at timestamptz not null default now()
);
insert into geological_assistant.invoice_settings (legal_name, address, state_code, support_email)
values ('Calecute Technologies (OPC) Private Limited', 'Kerala, India', '32', 'info@calecutech.com');

alter table geological_assistant.invoice_settings enable row level security;
grant all on geological_assistant.invoice_settings to service_role;

-- What the buyer asked to appear on the invoice, captured at checkout.
alter table geological_assistant.payment_orders
  add column billing_name text,
  add column billing_state_code text,
  add column billing_gstin text;

create table geological_assistant.invoice_counters (
  doc_type text not null check (doc_type in ('invoice', 'credit_note')),
  fiscal_year text not null,              -- '26-27'
  last_no int not null default 0,
  primary key (doc_type, fiscal_year)
);
alter table geological_assistant.invoice_counters enable row level security;
grant all on geological_assistant.invoice_counters to service_role;

create table geological_assistant.invoices (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('invoice', 'credit_note')),
  invoice_no text not null unique,
  fiscal_year text not null,
  issued_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete restrict,
  course_id text not null references geological_assistant.courses(id),
  provider_payment_id text not null,
  provider_order_id text,
  provider_refund_id text unique,         -- credit notes only
  original_invoice_id uuid references geological_assistant.invoices(id),
  -- seller, as it was when issued
  seller_name text not null,
  seller_address text not null,
  seller_state_code text not null,
  seller_gstin text,
  -- buyer
  buyer_name text,
  buyer_email text,
  buyer_gstin text,
  place_of_supply text not null,          -- two-digit state code
  -- line
  description text not null,
  sac text not null,
  gst_rate_bp int not null,
  taxable_minor int not null,
  cgst_minor int not null default 0,
  sgst_minor int not null default 0,
  igst_minor int not null default 0,
  total_minor int not null,
  currency text not null default 'INR',
  check (taxable_minor + cgst_minor + sgst_minor + igst_minor = total_minor),
  check ((doc_type = 'credit_note') = (provider_refund_id is not null))
);
-- One invoice per payment. Webhooks repeat; the second delivery finds the first invoice.
create unique index invoices_one_per_payment on geological_assistant.invoices (provider_payment_id)
  where doc_type = 'invoice';
create index on geological_assistant.invoices (user_id, issued_at desc);

alter table geological_assistant.invoices enable row level security;
create policy invoices_own_read on geological_assistant.invoices for select to authenticated
  using (user_id = (select auth.uid()));
grant select on geological_assistant.invoices to authenticated;
grant all on geological_assistant.invoices to service_role;

-- '26-27' for any moment from 1 Apr 2026 to 31 Mar 2027, India time.
create function geological_assistant.fiscal_year_of(p_at timestamptz)
returns text language sql stable set search_path = '' as $$
  select to_char(y, 'FM00') || '-' || to_char(y + 1, 'FM00')
  from (select (extract(year from (p_at at time zone 'Asia/Kolkata'))::int
               - case when extract(month from (p_at at time zone 'Asia/Kolkata')) < 4 then 1 else 0 end)
               % 100 as y) t;
$$;

create function geological_assistant.next_invoice_no(p_doc_type text, p_fy text)
returns text language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into geological_assistant.invoice_counters (doc_type, fiscal_year, last_no)
  values (p_doc_type, p_fy, 1)
  on conflict (doc_type, fiscal_year) do update set last_no = invoice_counters.last_no + 1
  returning last_no into n;
  return case when p_doc_type = 'invoice' then 'GA/' else 'GACN/' end
         || p_fy || '/' || lpad(n::text, 4, '0');
end $$;

-- Splits an amount the buyer paid into taxable value and tax. Price is GST-inclusive by default.
-- Same state as the seller: CGST + SGST, half each. Another state: IGST.
create function geological_assistant.split_gst(
  p_paid_minor int, p_rate_bp int, p_registered boolean, p_intra boolean,
  out taxable_minor int, out cgst_minor int, out sgst_minor int, out igst_minor int)
language plpgsql immutable set search_path = '' as $$
declare tax int;
begin
  cgst_minor := 0; sgst_minor := 0; igst_minor := 0;
  if not p_registered then taxable_minor := p_paid_minor; return; end if;
  taxable_minor := round(p_paid_minor * 10000.0 / (10000 + p_rate_bp));
  tax := p_paid_minor - taxable_minor;
  if p_intra then cgst_minor := tax / 2; sgst_minor := tax - tax / 2;
  else igst_minor := tax; end if;
end $$;

-- Issues the invoice for a captured payment, or returns the one already issued.
create function geological_assistant.issue_invoice(
  p_payment_id text, p_order_id text, p_user_id uuid, p_course_id text,
  p_paid_minor int, p_email text, p_paid_at timestamptz default now())
returns geological_assistant.invoices
language plpgsql security definer set search_path = '' as $$
declare
  inv geological_assistant.invoices;
  s geological_assistant.invoice_settings;
  o geological_assistant.payment_orders;
  c geological_assistant.courses;
  pos text; fy text; g record; buyer text;
begin
  select * into inv from geological_assistant.invoices
   where provider_payment_id = p_payment_id and doc_type = 'invoice';
  if found then return inv; end if;

  select * into strict s from geological_assistant.invoice_settings;
  select * into strict c from geological_assistant.courses where id = p_course_id;
  select * into o from geological_assistant.payment_orders where provider_ref = p_order_id;

  -- Place of supply: the buyer's GSTIN state, else the state they gave, else the seller's
  -- (IGST Act s.12(2)(b): supplier location when the buyer's address is not on record).
  pos := coalesce(left(o.billing_gstin, 2), o.billing_state_code, s.state_code);
  fy := geological_assistant.fiscal_year_of(p_paid_at);
  select * into g from geological_assistant.split_gst(p_paid_minor, s.gst_rate_bp, s.gstin is not null, pos = s.state_code);
  buyer := coalesce(nullif(o.billing_name, ''),
    (select coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
       from auth.users u where u.id = p_user_id));

  insert into geological_assistant.invoices (
    doc_type, invoice_no, fiscal_year, issued_at, user_id, course_id,
    provider_payment_id, provider_order_id,
    seller_name, seller_address, seller_state_code, seller_gstin,
    buyer_name, buyer_email, buyer_gstin, place_of_supply,
    description, sac, gst_rate_bp, taxable_minor, cgst_minor, sgst_minor, igst_minor, total_minor)
  values (
    'invoice', geological_assistant.next_invoice_no('invoice', fy), fy, p_paid_at, p_user_id, p_course_id,
    p_payment_id, p_order_id,
    s.legal_name, s.address, s.state_code, s.gstin,
    buyer, p_email, o.billing_gstin, pos,
    c.name || ': online course, lifetime access', s.sac,
    case when s.gstin is null then 0 else s.gst_rate_bp end,
    g.taxable_minor, g.cgst_minor, g.sgst_minor, g.igst_minor, p_paid_minor)
  returning * into inv;
  return inv;
end $$;

-- Issues a credit note against the payment's invoice for a processed refund (full or partial),
-- with the tax reversed in proportion. Returns the existing note on a repeated webhook.
create function geological_assistant.issue_credit_note(
  p_refund_id text, p_payment_id text, p_refund_minor int, p_refunded_at timestamptz default now())
returns geological_assistant.invoices
language plpgsql security definer set search_path = '' as $$
declare
  cn geological_assistant.invoices;
  inv geological_assistant.invoices;
  fy text; g record;
begin
  select * into cn from geological_assistant.invoices where provider_refund_id = p_refund_id;
  if found then return cn; end if;

  select * into inv from geological_assistant.invoices
   where provider_payment_id = p_payment_id and doc_type = 'invoice';
  if not found then return null; end if;  -- paid before invoicing started: nothing to credit

  fy := geological_assistant.fiscal_year_of(p_refunded_at);
  select * into g from geological_assistant.split_gst(p_refund_minor, inv.gst_rate_bp,
    inv.seller_gstin is not null, inv.place_of_supply = inv.seller_state_code);

  insert into geological_assistant.invoices (
    doc_type, invoice_no, fiscal_year, issued_at, user_id, course_id,
    provider_payment_id, provider_order_id, provider_refund_id, original_invoice_id,
    seller_name, seller_address, seller_state_code, seller_gstin,
    buyer_name, buyer_email, buyer_gstin, place_of_supply,
    description, sac, gst_rate_bp, taxable_minor, cgst_minor, sgst_minor, igst_minor, total_minor)
  values (
    'credit_note', geological_assistant.next_invoice_no('credit_note', fy), fy, p_refunded_at,
    inv.user_id, inv.course_id, inv.provider_payment_id, inv.provider_order_id, p_refund_id, inv.id,
    inv.seller_name, inv.seller_address, inv.seller_state_code, inv.seller_gstin,
    inv.buyer_name, inv.buyer_email, inv.buyer_gstin, inv.place_of_supply,
    'Refund against invoice ' || inv.invoice_no, inv.sac, inv.gst_rate_bp,
    g.taxable_minor, g.cgst_minor, g.sgst_minor, g.igst_minor, p_refund_minor)
  returning * into cn;
  return cn;
end $$;

revoke all on function geological_assistant.next_invoice_no(text, text) from public, anon, authenticated;
revoke all on function geological_assistant.issue_invoice(text, text, uuid, text, int, text, timestamptz) from public, anon, authenticated;
revoke all on function geological_assistant.issue_credit_note(text, text, int, timestamptz) from public, anon, authenticated;
grant execute on function geological_assistant.issue_invoice(text, text, uuid, text, int, text, timestamptz) to service_role;
grant execute on function geological_assistant.issue_credit_note(text, text, int, timestamptz) to service_role;
