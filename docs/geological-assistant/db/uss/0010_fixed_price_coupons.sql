-- Geological Assistant: fixed-price coupons with time-limited access (schema geological_assistant, USS project).
-- Needs 0004, 0005 and 0009. Additive: nothing in public or auth is touched.
--
-- A new kind of coupon, 'fixed': the buyer pays a set price (for example ₹499) instead of a
-- percentage off, and gets access for a set number of days (for example 30) instead of for life.
-- First one: CRASH30 = ₹499 for 30 days of access, usable until the 2 Dec 2026 exam day.
--
--   * coupons.price_minor:  the fixed price in paise (kind 'fixed' only).
--   * coupons.access_days:  days of access from the payment (null = lifetime).
--   * payment_orders.access_days: copied from the coupon when the order is made, so the webhook
--     knows how long to unlock for (subscriptions.current_period_end = paid time + days).
--   * has_active_subscription() already ends access at current_period_end.

alter table geological_assistant.coupons
  add column if not exists price_minor int check (price_minor is null or price_minor >= 100),
  add column if not exists access_days int check (access_days is null or access_days between 1 and 3650);

alter table geological_assistant.coupons drop constraint if exists coupons_kind_check;
alter table geological_assistant.coupons add constraint coupons_kind_check
  check (kind in ('admin', 'spin', 'access', 'referral', 'fixed'));
alter table geological_assistant.coupons drop constraint if exists coupons_check;
alter table geological_assistant.coupons add constraint coupons_check check (
      (kind = 'admin' and percent_off between 1 and 99)
   or (kind = 'spin' and user_id is not null and percent_off between 10 and 30)
   or (kind = 'access' and user_id is not null and percent_off = 100)
   or (kind = 'referral' and user_id is not null and percent_off between 1 and 50)
   -- percent_off is kept for display only (rounded saving against the list price).
   or (kind = 'fixed' and price_minor is not null and percent_off between 1 and 99)
);

alter table geological_assistant.payment_orders
  add column if not exists access_days int;

-- quote_price gains access_days (null = lifetime). Return type changes, so drop and recreate.
drop function if exists geological_assistant.quote_price(text, text, uuid);
create function geological_assistant.quote_price(p_course_id text, p_code text, p_user_id uuid default null)
returns table (code text, percent_off int, list_price_minor int, price_minor int, expires_at timestamptz, access_days int)
language plpgsql stable security definer set search_path to '' as $$
declare
  c geological_assistant.coupons;
  uid uuid := coalesce(auth.uid(), case when auth.role() = 'service_role' then p_user_id end);
  list int;
begin
  select co.price_minor into list from geological_assistant.courses co where co.id = p_course_id;
  if list is null then raise exception 'Unknown course'; end if;
  if p_code is null or btrim(p_code) = '' then
    return query select null::text, 0, list, list, null::timestamptz, null::int; return;
  end if;
  select * into c from geological_assistant.coupons k where k.code = upper(btrim(p_code)) and k.course_id = p_course_id;
  if not found or not c.active then raise exception 'This code is not valid'; end if;
  if c.expires_at is not null and c.expires_at <= now() then raise exception 'This code has expired'; end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then raise exception 'This code has been used up'; end if;
  if c.kind in ('spin', 'access') and c.user_id is distinct from uid then raise exception 'This code belongs to another account'; end if;
  if c.kind = 'referral' and c.user_id = uid then raise exception 'You cannot use your own referral code'; end if;
  -- A free-access code costs nothing (no payment: the page calls claim_access_code).
  if c.kind = 'access' then
    return query select c.code, 100, list, 0, c.expires_at, null::int; return;
  end if;
  -- A fixed price, never more than the list price.
  if c.kind = 'fixed' then
    return query select c.code, greatest(0, round(100 - c.price_minor * 100.0 / list))::int, list,
      least(c.price_minor, list), c.expires_at, c.access_days; return;
  end if;
  -- Never below ₹1 (Razorpay's minimum).
  return query select c.code, c.percent_off, list, greatest(100, round(list * (100 - c.percent_off) / 100.0)::int), c.expires_at, null::int;
end $$;
revoke all on function geological_assistant.quote_price(text, text, uuid) from public, anon;
grant execute on function geological_assistant.quote_price(text, text, uuid) to authenticated, service_role;

-- Admin: make or change a fixed-price coupon from the study page's #/admin screen.
create or replace function geological_assistant.admin_save_fixed_coupon(
  p_course_id text, p_code text, p_price_minor int, p_access_days int default null, p_max_uses int default null,
  p_expires_at timestamptz default null, p_note text default null, p_active boolean default true)
returns geological_assistant.coupons language plpgsql volatile security definer set search_path to '' as $$
declare c geological_assistant.coupons; list int;
begin
  if not geological_assistant.is_admin() then raise exception 'Admins only'; end if;
  select price_minor into list from geological_assistant.courses where id = p_course_id;
  if list is null then raise exception 'Unknown course'; end if;
  if p_price_minor is null or p_price_minor < 100 or p_price_minor >= list then
    raise exception 'Price must be at least ₹1 and less than the full price';
  end if;
  if p_access_days is not null and p_access_days not between 1 and 3650 then raise exception 'Days must be 1 to 3650'; end if;
  insert into geological_assistant.coupons (code, course_id, kind, percent_off, price_minor, access_days, max_uses, expires_at, note, active, created_by)
    values (upper(btrim(p_code)), p_course_id, 'fixed', greatest(1, least(99, round(100 - p_price_minor * 100.0 / list)))::int,
            p_price_minor, p_access_days, p_max_uses, p_expires_at, p_note, p_active, auth.jwt() ->> 'email')
    on conflict (code) do update set percent_off = excluded.percent_off, price_minor = excluded.price_minor,
      access_days = excluded.access_days, max_uses = excluded.max_uses, expires_at = excluded.expires_at,
      note = excluded.note, active = excluded.active
      where geological_assistant.coupons.kind = 'fixed'
    returning * into c;
  if c.code is null then raise exception 'That code is already taken'; end if;
  return c;
end $$;
revoke all on function geological_assistant.admin_save_fixed_coupon(text, text, int, int, int, timestamptz, text, boolean) from public, anon;
grant execute on function geological_assistant.admin_save_fixed_coupon(text, text, int, int, int, timestamptz, text, boolean) to authenticated;

-- CRASH30: ₹499 for 30 days of access, usable until the end of exam day (2 Dec 2026, IST).
-- Typed in any case on the buy page ("crash30" works: codes are matched in upper case).
insert into geological_assistant.coupons (code, course_id, kind, percent_off, price_minor, access_days, expires_at, note, created_by)
values ('CRASH30', 'geological-assistant', 'fixed', 83, 49900, 30, '2026-12-02 23:59:59+05:30',
        'Crash offer: ₹499 for 30 days till the 2 Dec exam', 'vs.vivek1@gmail.com')
on conflict (code) do nothing;
