-- Paid papers for the Recallio app. A learner owns a paper (section 1-4)
-- after a verified Google Play purchase or a coupon. Ownership is kept when a
-- learner deletes their study data: it is a purchase record.
--
-- Tables are reachable only through the functions below (RLS on, no policies).

create table energy_manager.entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  section smallint not null check (section between 1 and 4),
  source text not null check (source in ('play', 'coupon', 'admin')),
  ref text,                      -- Play order id or coupon code
  created_at timestamptz not null default now(),
  primary key (user_id, section)
);

create table energy_manager.coupons (
  code text primary key check (code = upper(code) and length(code) between 6 and 40),
  sections smallint[] not null default '{1,2,3,4}',
  max_uses integer not null default 1 check (max_uses > 0),
  uses integer not null default 0,
  expires_at timestamptz,
  note text,                     -- who it was made for
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table energy_manager.coupon_redemptions (
  code text not null references energy_manager.coupons(code),
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now(),
  primary key (code, user_id)
);

-- Failed coupon tries, for a simple brute-force limit.
create table energy_manager.coupon_failures (
  user_id uuid not null references auth.users(id) on delete cascade,
  at timestamptz not null default now()
);
create index on energy_manager.coupon_failures (user_id, at);

-- Verified Play purchases (one row per purchase token).
create table energy_manager.play_purchases (
  purchase_token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  order_id text,
  purchase_time timestamptz,
  created_at timestamptz not null default now()
);

alter table energy_manager.entitlements enable row level security;
alter table energy_manager.coupons enable row level security;
alter table energy_manager.coupon_redemptions enable row level security;
alter table energy_manager.coupon_failures enable row level security;
alter table energy_manager.play_purchases enable row level security;

-- The papers the signed-in learner owns.
create or replace function public.em_my_papers()
returns smallint[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(section order by section), '{}')
    from energy_manager.entitlements
   where user_id = auth.uid();
$$;

-- Redeem a coupon. Returns the papers the learner owns afterwards.
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

revoke all on function public.em_my_papers() from public, anon;
revoke all on function public.em_redeem_coupon(text) from public, anon;
grant execute on function public.em_my_papers() to authenticated;
grant execute on function public.em_redeem_coupon(text) to authenticated;

-- Called only by the em-play-verify Edge Function (service role) after it has
-- checked the purchase with Google. Returns the learner's papers, or raises
-- if the token is already tied to another account.
create or replace function public.em_record_play_purchase(
  p_user uuid, p_token text, p_product text, p_section smallint, p_order text, p_time timestamptz)
returns smallint[]
language plpgsql security definer set search_path = '' as $$
declare
  owner uuid;
begin
  select user_id into owner from energy_manager.play_purchases where purchase_token = p_token;
  if owner is not null and owner <> p_user then
    raise exception 'This purchase belongs to another account' using errcode = 'P0001';
  end if;
  insert into energy_manager.play_purchases (purchase_token, user_id, product_id, order_id, purchase_time)
  values (p_token, p_user, p_product, p_order, p_time)
  on conflict (purchase_token) do nothing;
  insert into energy_manager.entitlements (user_id, section, source, ref)
  values (p_user, p_section, 'play', p_order)
  on conflict (user_id, section) do nothing;
  return (select coalesce(array_agg(section order by section), '{}')
            from energy_manager.entitlements where user_id = p_user);
end;
$$;

-- Lets the function refuse a token owned by someone else before calling Google.
create or replace function public.em_play_token_owner(p_token text)
returns uuid
language sql stable security definer set search_path = '' as $$
  select user_id from energy_manager.play_purchases where purchase_token = p_token;
$$;

revoke all on function public.em_record_play_purchase(uuid, text, text, smallint, text, timestamptz) from public, anon, authenticated;
revoke all on function public.em_play_token_owner(text) from public, anon, authenticated;
grant execute on function public.em_record_play_purchase(uuid, text, text, smallint, text, timestamptz) to service_role;
grant execute on function public.em_play_token_owner(text) to service_role;
