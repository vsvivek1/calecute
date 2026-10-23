-- Geological Assistant: discount coupons and the spin wheel (schema geological_assistant, USS project).
-- Additive only. Nothing in public or auth is touched.
--
-- Two kinds of coupon share one table:
--   admin: made by an admin, 1% to 99% off, optional use limit and expiry.
--   spin:  won on the spin wheel, 10% to 30% off, one per user per course,
--          usable only by the user who spun, valid 7 days.
-- The price is always worked out on the server (ga-razorpay-create-order calls
-- quote_price); the browser only sends the code.

create table geological_assistant.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table geological_assistant.admins enable row level security;
grant all on geological_assistant.admins to service_role;
insert into geological_assistant.admins (email) values ('vs.vivek1@gmail.com') on conflict do nothing;

create table geological_assistant.coupons (
  code text primary key check (code = upper(code) and code ~ '^[A-Z0-9-]{3,32}$'),
  course_id text not null references geological_assistant.courses(id),
  kind text not null check (kind in ('admin', 'spin')),
  percent_off int not null check (percent_off between 1 and 99),
  user_id uuid references auth.users(id) on delete cascade,
  max_uses int check (max_uses is null or max_uses > 0),
  used_count int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  note text,
  created_by text,
  created_at timestamptz not null default now(),
  check (kind = 'admin' or (user_id is not null and percent_off between 10 and 30))
);
-- One spin per user per course.
create unique index coupons_one_spin on geological_assistant.coupons (user_id, course_id) where kind = 'spin';

alter table geological_assistant.coupons enable row level security;
-- A user may see the coupon they won; admin coupons are never listed to the public.
create policy coupons_own_spin_read on geological_assistant.coupons for select to authenticated
  using (kind = 'spin' and user_id = (select auth.uid()));
grant select on geological_assistant.coupons to authenticated;
grant all on geological_assistant.coupons to service_role;

alter table geological_assistant.payment_orders
  add column if not exists coupon_code text references geological_assistant.coupons(code),
  add column if not exists list_price_minor int;

create or replace function geological_assistant.is_admin()
returns boolean language sql stable security definer set search_path to '' as $$
  select exists (select 1 from geological_assistant.admins a
                 where a.email = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- The price a user pays for a course with a code. Raises a readable message if
-- the code cannot be used. Also used by the create-order function (service role,
-- with p_user_id), so the browser's word on the price never counts.
create or replace function geological_assistant.quote_price(p_course_id text, p_code text, p_user_id uuid default null)
returns table (code text, percent_off int, list_price_minor int, price_minor int, expires_at timestamptz)
language plpgsql stable security definer set search_path to '' as $$
declare
  c geological_assistant.coupons;
  uid uuid := coalesce(auth.uid(), case when auth.role() = 'service_role' then p_user_id end);
  list int;
begin
  select co.price_minor into list from geological_assistant.courses co where co.id = p_course_id;
  if list is null then raise exception 'Unknown course'; end if;
  if p_code is null or btrim(p_code) = '' then
    return query select null::text, 0, list, list, null::timestamptz; return;
  end if;
  select * into c from geological_assistant.coupons k where k.code = upper(btrim(p_code)) and k.course_id = p_course_id;
  if not found or not c.active then raise exception 'This code is not valid'; end if;
  if c.expires_at is not null and c.expires_at <= now() then raise exception 'This code has expired'; end if;
  if c.max_uses is not null and c.used_count >= c.max_uses then raise exception 'This code has been used up'; end if;
  if c.kind = 'spin' and c.user_id is distinct from uid then raise exception 'This code belongs to another account'; end if;
  -- Never below ₹1 (Razorpay's minimum).
  return query select c.code, c.percent_off, list, greatest(100, round(list * (100 - c.percent_off) / 100.0)::int), c.expires_at;
end $$;

-- Spin the wheel once. Returns the same coupon on every later call.
-- Odds: 10% (40%), 15% (30%), 20% (18%), 25% (9%), 30% (3%).
create or replace function geological_assistant.spin_wheel(p_course_id text)
returns table (code text, percent_off int, expires_at timestamptz, already_spun boolean)
language plpgsql volatile security definer set search_path to '' as $$
declare
  uid uuid := auth.uid();
  r float8 := random();
  pct int;
  new_code text;
begin
  if uid is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from geological_assistant.courses where id = p_course_id) then raise exception 'Unknown course'; end if;
  return query select k.code, k.percent_off, k.expires_at, true from geological_assistant.coupons k
    where k.kind = 'spin' and k.user_id = uid and k.course_id = p_course_id;
  if found then return; end if;
  pct := case when r < 0.40 then 10 when r < 0.70 then 15 when r < 0.88 then 20 when r < 0.97 then 25 else 30 end;
  new_code := 'SPIN' || pct || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into geological_assistant.coupons (code, course_id, kind, percent_off, user_id, max_uses, expires_at, note)
    values (new_code, p_course_id, 'spin', pct, uid, 1, now() + interval '7 days', 'spin wheel')
    on conflict do nothing;
  return query select k.code, k.percent_off, k.expires_at, false from geological_assistant.coupons k
    where k.kind = 'spin' and k.user_id = uid and k.course_id = p_course_id;
end $$;

-- Called by the webhook (service role) once per paid order.
create or replace function geological_assistant.redeem_coupon(p_code text)
returns void language sql volatile security definer set search_path to '' as $$
  update geological_assistant.coupons set used_count = used_count + 1 where code = p_code;
$$;

-- Admin tools for the study page's #/admin screen.
create or replace function geological_assistant.admin_save_coupon(
  p_course_id text, p_code text, p_percent_off int, p_max_uses int default null,
  p_expires_at timestamptz default null, p_note text default null, p_active boolean default true)
returns geological_assistant.coupons language plpgsql volatile security definer set search_path to '' as $$
declare c geological_assistant.coupons;
begin
  if not geological_assistant.is_admin() then raise exception 'Admins only'; end if;
  if p_percent_off is null or p_percent_off not between 1 and 99 then raise exception 'Discount must be 1 to 99 percent'; end if;
  insert into geological_assistant.coupons (code, course_id, kind, percent_off, max_uses, expires_at, note, active, created_by)
    values (upper(btrim(p_code)), p_course_id, 'admin', p_percent_off, p_max_uses, p_expires_at, p_note, p_active, auth.jwt() ->> 'email')
    on conflict (code) do update set percent_off = excluded.percent_off, max_uses = excluded.max_uses,
      expires_at = excluded.expires_at, note = excluded.note, active = excluded.active
      where geological_assistant.coupons.kind = 'admin'
    returning * into c;
  if c.code is null then raise exception 'That code is already taken'; end if;
  return c;
end $$;

create or replace function geological_assistant.admin_list_coupons(p_course_id text)
returns setof geological_assistant.coupons language plpgsql stable security definer set search_path to '' as $$
begin
  if not geological_assistant.is_admin() then raise exception 'Admins only'; end if;
  return query select * from geological_assistant.coupons where course_id = p_course_id
    order by (kind = 'admin') desc, created_at desc limit 500;
end $$;

revoke all on function geological_assistant.redeem_coupon(text) from public, anon, authenticated;
grant execute on function geological_assistant.redeem_coupon(text) to service_role;
revoke all on function geological_assistant.spin_wheel(text) from public, anon;
grant execute on function geological_assistant.spin_wheel(text) to authenticated;
revoke all on function geological_assistant.quote_price(text, text, uuid) from public, anon;
grant execute on function geological_assistant.quote_price(text, text, uuid) to authenticated, service_role;
revoke all on function geological_assistant.is_admin() from public, anon;
grant execute on function geological_assistant.is_admin() to authenticated;
revoke all on function geological_assistant.admin_save_coupon(text, text, int, int, timestamptz, text, boolean) from public, anon;
grant execute on function geological_assistant.admin_save_coupon(text, text, int, int, timestamptz, text, boolean) to authenticated;
revoke all on function geological_assistant.admin_list_coupons(text) from public, anon;
grant execute on function geological_assistant.admin_list_coupons(text) to authenticated;
