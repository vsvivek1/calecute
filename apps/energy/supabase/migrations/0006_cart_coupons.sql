-- Discount coupons and checkout (2026-10-23, vivek): every paper costs ₹1,000
-- and opens only after a paid checkout. Coupons now give a discount at
-- checkout (10% to 99%) instead of opening papers for free. A coupon with no
-- discount_pct still opens papers outright; it is kept only for Play review
-- and admin use.
--
-- On Android the discount is a separate Play product per tier
-- (paper_N_offPP). The server accepts a discounted purchase only from a
-- learner who applied a coupon of that tier in the last 24 hours.

alter table energy_manager.coupons
  add column discount_pct smallint
    check (discount_pct in (10, 25, 50, 75, 90, 99));

comment on column energy_manager.coupons.discount_pct is
  'Percent off at checkout. NULL = opens the papers outright (reviewer/admin codes only).';

-- The coupon a learner applied to their cart (one at a time).
create table energy_manager.coupon_claims (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null references energy_manager.coupons(code),
  pct smallint not null,
  claimed_at timestamptz not null default now(),
  counted boolean not null default false   -- a use was charged to the coupon
);
alter table energy_manager.coupon_claims enable row level security;

alter table energy_manager.play_purchases add column discount_pct smallint not null default 0;
alter table energy_manager.play_purchases add column coupon text;

-- Apply a coupon. Returns {"kind":"discount","pct":N,"code":...} for a
-- discount code, or {"kind":"unlock","papers":[...]} for an opening code.
create or replace function public.em_apply_coupon(p_code text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  c energy_manager.coupons;
  k text := upper(btrim(coalesce(p_code, '')));
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  if (select count(*) from energy_manager.coupon_failures
       where user_id = uid and at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many tries. Please wait an hour.' using errcode = 'P0001';
  end if;

  select * into c from energy_manager.coupons where code = k;
  if not found or not c.active or (c.expires_at is not null and c.expires_at < now()) then
    insert into energy_manager.coupon_failures (user_id) values (uid);
    raise exception 'That code is not valid.' using errcode = 'P0001';
  end if;

  if c.discount_pct is null then
    return jsonb_build_object('kind', 'unlock', 'papers', to_jsonb(public.em_redeem_coupon(k)));
  end if;

  if c.uses >= c.max_uses
     and not exists (select 1 from energy_manager.coupon_redemptions where code = k and user_id = uid) then
    raise exception 'That code has already been used.' using errcode = 'P0001';
  end if;

  insert into energy_manager.coupon_claims (user_id, code, pct)
  values (uid, k, c.discount_pct)
  on conflict (user_id) do update
    set code = excluded.code, pct = excluded.pct, claimed_at = now(), counted = false;

  return jsonb_build_object('kind', 'discount', 'pct', c.discount_pct, 'code', k);
end;
$$;

-- The old direct redeem now refuses discount codes (they belong at checkout).
create or replace function public.em_redeem_coupon(p_code text)
returns smallint[]
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  c energy_manager.coupons;
  k text := upper(btrim(coalesce(p_code, '')));
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  if (select count(*) from energy_manager.coupon_failures
       where user_id = uid and at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many tries. Please wait an hour.' using errcode = 'P0001';
  end if;

  select * into c from energy_manager.coupons where code = k for update;
  if not found or not c.active or (c.expires_at is not null and c.expires_at < now()) then
    insert into energy_manager.coupon_failures (user_id) values (uid);
    raise exception 'That code is not valid.' using errcode = 'P0001';
  end if;
  if c.discount_pct is not null then
    raise exception 'This code gives % off at checkout. Update the app to use it.', c.discount_pct || '%'
      using errcode = 'P0001';
  end if;

  if not exists (select 1 from energy_manager.coupon_redemptions where code = k and user_id = uid) then
    if c.uses >= c.max_uses then
      raise exception 'That code has already been used.' using errcode = 'P0001';
    end if;
    insert into energy_manager.coupon_redemptions (code, user_id) values (k, uid);
    update energy_manager.coupons set uses = uses + 1 where code = k;
  end if;

  insert into energy_manager.entitlements (user_id, section, source, ref)
  select uid, s, 'coupon', k from unnest(c.sections) s
  on conflict (user_id, section) do nothing;

  return public.em_my_papers();
end;
$$;

-- Service-role only: record a Google-verified purchase. p_pct > 0 means a
-- discounted product, accepted only against a fresh coupon claim of that tier
-- (or a token this learner already recorded, e.g. a restore).
-- A 7-argument overload; the old 6-argument one (full price only) stays so
-- nothing breaks mid-deploy. The Edge Function always passes p_pct.
create or replace function public.em_record_play_purchase(
  p_user uuid, p_token text, p_product text, p_section smallint, p_order text, p_time timestamptz,
  p_pct smallint)
returns smallint[]
language plpgsql security definer set search_path = '' as $$
declare
  owner uuid;
  cl energy_manager.coupon_claims;
begin
  select user_id into owner from energy_manager.play_purchases where purchase_token = p_token;
  if owner is not null and owner <> p_user then
    raise exception 'This purchase belongs to another account' using errcode = 'P0001';
  end if;

  if owner is null and p_pct > 0 then
    select * into cl from energy_manager.coupon_claims where user_id = p_user for update;
    if not found or cl.pct <> p_pct or cl.claimed_at < now() - interval '24 hours' then
      raise exception 'Discount not found for this account. Apply the coupon again.' using errcode = 'P0001';
    end if;
    if not cl.counted then
      update energy_manager.coupons set uses = uses + 1 where code = cl.code;
      insert into energy_manager.coupon_redemptions (code, user_id) values (cl.code, p_user)
      on conflict do nothing;
      update energy_manager.coupon_claims set counted = true where user_id = p_user;
    end if;
  end if;

  insert into energy_manager.play_purchases
    (purchase_token, user_id, product_id, order_id, purchase_time, discount_pct, coupon)
  values (p_token, p_user, p_product, p_order, p_time, p_pct, case when p_pct > 0 then cl.code end)
  on conflict (purchase_token) do nothing;
  insert into energy_manager.entitlements (user_id, section, source, ref)
  values (p_user, p_section, 'play', p_order)
  on conflict (user_id, section) do nothing;
  return (select coalesce(array_agg(section order by section), '{}')
            from energy_manager.entitlements where user_id = p_user);
end;
$$;

revoke all on function public.em_apply_coupon(text) from public, anon;
grant execute on function public.em_apply_coupon(text) to authenticated;
revoke all on function public.em_record_play_purchase(uuid, text, text, smallint, text, timestamptz, smallint)
  from public, anon, authenticated;
grant execute on function public.em_record_play_purchase(uuid, text, text, smallint, text, timestamptz, smallint)
  to service_role;
