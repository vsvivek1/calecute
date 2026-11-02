-- Geological Assistant: referral codes for paid learners (schema geological_assistant, USS project).
-- Needs 0004 (coupons, quote_price) and 0005 (has_active_subscription). Additive: nothing in public or auth is touched.
--
-- How it works:
--   * An admin picks which learners can refer (admin_set_referral_partner). Only those see the option.
--   * A picked learner who has paid creates their own code (create_my_referral_code). The admin sets the
--     discount the buyer gets (capped by settings) and an optional use limit.
--   * A buyer who pays with the code: the webhook records a commission for the referrer (settle_referral).
--     Commission is a percentage of what the buyer actually paid, shown as income on the referrer's dashboard.
--     A refund removes that commission.
--   * Payouts are not automatic. The admin list shows what each referrer has earned.

-- 1. A new kind of coupon: 'referral' (owned by the referrer; any other paid-up learner may use it).
alter table geological_assistant.coupons drop constraint if exists coupons_kind_check;
alter table geological_assistant.coupons add constraint coupons_kind_check
  check (kind in ('admin', 'spin', 'access', 'referral'));
alter table geological_assistant.coupons drop constraint if exists coupons_check;
alter table geological_assistant.coupons add constraint coupons_check check (
      (kind = 'admin' and percent_off between 1 and 99)
   or (kind = 'spin' and user_id is not null and percent_off between 10 and 30)
   or (kind = 'access' and user_id is not null and percent_off = 100)
   or (kind = 'referral' and user_id is not null and percent_off between 1 and 50)
);

-- 2. Settings the admin edits (one row per course).
create table if not exists geological_assistant.referral_settings (
  course_id text primary key references geological_assistant.courses(id),
  max_discount_percent int not null default 20 check (max_discount_percent between 1 and 50),
  commission_percent int not null default 10 check (commission_percent between 1 and 50),
  updated_at timestamptz not null default now()
);
alter table geological_assistant.referral_settings enable row level security;
grant all on geological_assistant.referral_settings to service_role;

-- 3. Who may refer: one row per learner per course. The code lives in coupons.
create table if not exists geological_assistant.referral_partners (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references geological_assistant.courses(id),
  enabled boolean not null default false,
  percent_off int not null default 10 check (percent_off between 1 and 50),
  max_uses int check (max_uses is null or max_uses > 0),
  code text unique references geological_assistant.coupons(code),
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);
alter table geological_assistant.referral_partners enable row level security;
grant all on geological_assistant.referral_partners to service_role;

-- 4. One row per paid order that used a referral code. Removed again if the order is refunded.
create table if not exists geological_assistant.referral_commissions (
  order_id uuid primary key references geological_assistant.payment_orders(id) on delete cascade,
  referrer_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references geological_assistant.courses(id),
  paid_minor int not null,
  commission_minor int not null,
  created_at timestamptz not null default now()
);
create index if not exists referral_commissions_referrer on geological_assistant.referral_commissions (referrer_id, course_id);
alter table geological_assistant.referral_commissions enable row level security;
grant all on geological_assistant.referral_commissions to service_role;

-- Nobody reads these tables directly from the browser: the functions below do it.

-- 5. quote_price with one new rule: a referral code cannot be used by its own owner.
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
  if c.kind in ('spin', 'access') and c.user_id is distinct from uid then raise exception 'This code belongs to another account'; end if;
  if c.kind = 'referral' and c.user_id = uid then raise exception 'You cannot use your own referral code'; end if;
  -- A free-access code costs nothing (no payment: the page calls claim_access_code).
  if c.kind = 'access' then
    return query select c.code, 100, list, 0, c.expires_at; return;
  end if;
  -- Never below ₹1 (Razorpay's minimum).
  return query select c.code, c.percent_off, list, greatest(100, round(list * (100 - c.percent_off) / 100.0)::int), c.expires_at;
end $$;

-- 6. Admin: the discount cap and the commission rate for a course.
create or replace function geological_assistant.admin_set_referral_settings(p_course_id text, p_max_discount int, p_commission int)
returns void language plpgsql volatile security definer set search_path to '' as $$
begin
  if not geological_assistant.is_admin() then raise exception 'Admins only'; end if;
  if p_max_discount is null or p_max_discount < 1 or p_max_discount > 50 then raise exception 'Discount cap must be 1 to 50'; end if;
  if p_commission is null or p_commission < 1 or p_commission > 50 then raise exception 'Commission must be 1 to 50'; end if;
  insert into geological_assistant.referral_settings (course_id, max_discount_percent, commission_percent, updated_at)
  values (p_course_id, p_max_discount, p_commission, now())
  on conflict (course_id) do update set max_discount_percent = excluded.max_discount_percent,
    commission_percent = excluded.commission_percent, updated_at = now();
end $$;

create or replace function geological_assistant.admin_get_referral_settings(p_course_id text)
returns json language plpgsql stable security definer set search_path to '' as $$
begin
  if not geological_assistant.is_admin() then raise exception 'Admins only'; end if;
  -- Defaults (20% cap, 10% commission) until the admin saves settings.
  return (select json_build_object('max_discount_percent', coalesce(s.max_discount_percent, 20), 'commission_percent', coalesce(s.commission_percent, 10))
          from (select 1) d left join geological_assistant.referral_settings s on s.course_id = p_course_id);
end $$;

-- 7. Admin: pick (or un-pick) a learner as a referral partner, and set their discount and use limit.
-- Changing the discount or limit updates their code too. Turning it off switches the code off.
create or replace function geological_assistant.admin_set_referral_partner(
  p_course_id text, p_user_id uuid, p_enabled boolean, p_percent int, p_max_uses int default null)
returns void language plpgsql volatile security definer set search_path to '' as $$
declare
  cap int;
begin
  if not geological_assistant.is_admin() then raise exception 'Admins only'; end if;
  select coalesce((select s.max_discount_percent from geological_assistant.referral_settings s where s.course_id = p_course_id), 20)
    into cap;
  if p_percent is null or p_percent < 1 or p_percent > cap then
    raise exception 'Discount must be 1 to %', cap;
  end if;
  insert into geological_assistant.referral_partners (user_id, course_id, enabled, percent_off, max_uses)
  values (p_user_id, p_course_id, p_enabled, p_percent, p_max_uses)
  on conflict (user_id, course_id) do update set enabled = excluded.enabled,
    percent_off = excluded.percent_off, max_uses = excluded.max_uses;
  update geological_assistant.coupons k
     set percent_off = p_percent, max_uses = p_max_uses, active = p_enabled
   where k.kind = 'referral' and k.user_id = p_user_id and k.course_id = p_course_id;
end $$;

-- 8. The learner who paid creates their own code, once. Only works for a learner the admin picked.
create or replace function geological_assistant.create_my_referral_code(p_course_id text)
returns text language plpgsql volatile security definer set search_path to '' as $$
declare
  uid uuid := auth.uid();
  rp geological_assistant.referral_partners;
  existing text;
  new_code text;
begin
  if uid is null then raise exception 'Sign in first'; end if;
  select * into rp from geological_assistant.referral_partners p where p.user_id = uid and p.course_id = p_course_id;
  if not found or not rp.enabled then raise exception 'Referrals are not open on your account'; end if;
  if not geological_assistant.has_active_subscription(p_course_id) then
    raise exception 'Buy the course first, then you can refer friends';
  end if;
  if rp.code is not null then return rp.code; end if;
  -- A readable random code, e.g. REF-7K3QXA.
  loop
    new_code := 'REF-' || upper(substr(md5(random()::text || clock_timestamp()::text || uid::text), 1, 6));
    exit when not exists (select 1 from geological_assistant.coupons k where k.code = new_code);
  end loop;
  insert into geological_assistant.coupons (code, course_id, kind, percent_off, user_id, max_uses, note, active, created_by)
  values (new_code, p_course_id, 'referral', rp.percent_off, uid, rp.max_uses, 'Referral', true, 'referral');
  update geological_assistant.referral_partners set code = new_code where user_id = uid and course_id = p_course_id;
  return new_code;
end $$;

-- 9. The learner's own referral dashboard. Buyers are shown masked (a***@gmail.com).
create or replace function geological_assistant.my_referral(p_course_id text)
returns json language plpgsql stable security definer set search_path to '' as $$
declare
  uid uuid := auth.uid();
  rp geological_assistant.referral_partners;
  s_comm int;
  s_max int;
  coupon geological_assistant.coupons;
begin
  if uid is null then return json_build_object('enabled', false); end if;
  select * into rp from geological_assistant.referral_partners p where p.user_id = uid and p.course_id = p_course_id;
  if not found or not rp.enabled then return json_build_object('enabled', false); end if;
  select coalesce(s.commission_percent, 10), coalesce(s.max_discount_percent, 20) into s_comm, s_max
    from (select 1) d left join geological_assistant.referral_settings s on s.course_id = p_course_id;
  select * into coupon from geological_assistant.coupons k where k.code = rp.code;
  return json_build_object(
    'enabled', true,
    'paid', geological_assistant.has_active_subscription(p_course_id),
    'code', rp.code,
    'percent_off', rp.percent_off,
    'max_uses', rp.max_uses,
    'used_count', coalesce(coupon.used_count, 0),
    'commission_percent', s_comm,
    'max_discount_percent', s_max,
    'earned_minor', coalesce((select sum(c.commission_minor) from geological_assistant.referral_commissions c
                              where c.referrer_id = uid and c.course_id = p_course_id), 0),
    'sales', coalesce((select json_agg(x order by x.created_at desc) from (
        select c.created_at, c.paid_minor, c.commission_minor,
               case when u.email is null then 'a learner'
                    else left(split_part(u.email, '@', 1), 1) || '***@' || split_part(u.email, '@', 2) end as buyer
        from geological_assistant.referral_commissions c
        join auth.users u on u.id = c.buyer_id
        where c.referrer_id = uid and c.course_id = p_course_id
        order by c.created_at desc limit 100) x), '[]'::json)
  );
end $$;

-- 10. Admin: the referral list for the course, with what each referrer has earned.
create or replace function geological_assistant.admin_list_referral_partners(p_course_id text)
returns table (
  user_id uuid, email text, enabled boolean, code text, percent_off int, max_uses int,
  used_count int, sales_count int, earned_minor bigint
)
language plpgsql stable security definer set search_path to '' as $$
begin
  if not geological_assistant.is_admin() then raise exception 'Admins only'; end if;
  return query
  select p.user_id,
         coalesce(pr.email, u.email)::text,
         p.enabled, p.code, p.percent_off, p.max_uses,
         coalesce(k.used_count, 0),
         (select count(*)::int from geological_assistant.referral_commissions c
           where c.referrer_id = p.user_id and c.course_id = p_course_id),
         coalesce((select sum(c.commission_minor) from geological_assistant.referral_commissions c
           where c.referrer_id = p.user_id and c.course_id = p_course_id), 0)
  from geological_assistant.referral_partners p
  left join auth.users u on u.id = p.user_id
  left join geological_assistant.user_profile pr on pr.user_id = p.user_id
  left join geological_assistant.coupons k on k.code = p.code
  where p.course_id = p_course_id
  order by p.enabled desc, p.created_at desc;
end $$;

-- 11. Webhook (service role): after a payment, record the referrer's commission; after a refund, remove it.
create or replace function geological_assistant.settle_referral(p_order_id uuid, p_paid boolean)
returns void language plpgsql volatile security definer set search_path to '' as $$
declare
  o geological_assistant.payment_orders;
  k geological_assistant.coupons;
  pct int;
begin
  select * into o from geological_assistant.payment_orders where id = p_order_id;
  if not found or o.coupon_code is null then return; end if;
  if not p_paid then
    delete from geological_assistant.referral_commissions where order_id = p_order_id;
    return;
  end if;
  select * into k from geological_assistant.coupons where code = o.coupon_code;
  if not found or k.kind <> 'referral' then return; end if;
  select coalesce(s.commission_percent, 10) into pct
    from (select 1) d left join geological_assistant.referral_settings s on s.course_id = o.course_id;
  insert into geological_assistant.referral_commissions
    (order_id, referrer_id, buyer_id, course_id, paid_minor, commission_minor)
  values (o.id, k.user_id, o.user_id, o.course_id, o.amount_minor, round(o.amount_minor * pct / 100.0)::int)
  on conflict (order_id) do nothing;
end $$;

-- Grants: the browser may call the learner and admin functions; the webhook uses the service role.
revoke all on function geological_assistant.admin_set_referral_settings(text, int, int) from public, anon;
revoke all on function geological_assistant.admin_get_referral_settings(text) from public, anon;
revoke all on function geological_assistant.admin_set_referral_partner(text, uuid, boolean, int, int) from public, anon;
revoke all on function geological_assistant.create_my_referral_code(text) from public, anon;
revoke all on function geological_assistant.my_referral(text) from public, anon;
revoke all on function geological_assistant.admin_list_referral_partners(text) from public, anon;
revoke all on function geological_assistant.settle_referral(uuid, boolean) from public, anon, authenticated;
grant execute on function geological_assistant.admin_set_referral_settings(text, int, int) to authenticated;
grant execute on function geological_assistant.admin_get_referral_settings(text) to authenticated;
grant execute on function geological_assistant.admin_set_referral_partner(text, uuid, boolean, int, int) to authenticated;
grant execute on function geological_assistant.create_my_referral_code(text) to authenticated;
grant execute on function geological_assistant.my_referral(text) to authenticated;
grant execute on function geological_assistant.admin_list_referral_partners(text) to authenticated;
grant execute on function geological_assistant.settle_referral(uuid, boolean) to service_role;
