-- Geological Assistant: admin tools (schema geological_assistant, USS project).
-- Needs 0004_coupons.sql first (admins table, is_admin, coupons). Additive only.
--
--   1. Admins see the whole course free (has_active_subscription is true for them).
--   2. admin_list_participants: everyone who signed in on the course page, and who paid.
--   3. admin_make_access_code: a one-use code for one signed-in user that unlocks
--      the course free; the user enters it on the buy page (claim_access_code).

-- 1. Admins can open the course without paying. Cards and questions RLS already
-- goes through this function, so nothing else changes.
create or replace function geological_assistant.has_active_subscription(p_course_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from geological_assistant.subscriptions s
    where s.user_id = auth.uid() and s.course_id = p_course_id and s.status = 'active'
      and (s.current_period_end is null or s.current_period_end > now())
  ) or exists (
    select 1 from geological_assistant.courses c where c.id = p_course_id and c.is_free_course
  ) or geological_assistant.is_admin();
$$;

-- 2. Participants: every account with a course profile or a subscription.
create or replace function geological_assistant.admin_list_participants(p_course_id text)
returns table (
  user_id uuid, email text, signed_up_at timestamptz,
  has_access boolean, paid_via text, amount_minor int, paid_at timestamptz,
  cards_studied int, last_studied_at timestamptz, tests_taken int, access_code text
)
language plpgsql stable security definer set search_path to '' as $$
begin
  if not geological_assistant.is_admin() then raise exception 'Admins only'; end if;
  return query
  with people as (
    select p.user_id from geological_assistant.user_profile p where p.course_id = p_course_id or p.course_id is null
    union
    select s.user_id from geological_assistant.subscriptions s where s.course_id = p_course_id
  )
  select
    x.user_id,
    coalesce(pr.email, u.email)::text,
    coalesce(pr.created_at, u.created_at),
    sub.id is not null,
    sub.provider,
    sub.amount_minor,
    sub.created_at,
    (select count(*)::int from geological_assistant.user_card_state ucs
       join geological_assistant.cards cd on cd.id = ucs.card_id
      where ucs.user_id = x.user_id and cd.course_id = p_course_id),
    (select max(ucs.last_reviewed_at) from geological_assistant.user_card_state ucs where ucs.user_id = x.user_id),
    (select count(*)::int from geological_assistant.quiz_attempts qa where qa.user_id = x.user_id and qa.course_id = p_course_id),
    (select k.code from geological_assistant.coupons k
      where k.kind = 'access' and k.user_id = x.user_id and k.course_id = p_course_id and k.active
      order by k.created_at desc limit 1)
  from people x
  left join geological_assistant.user_profile pr on pr.user_id = x.user_id
  left join auth.users u on u.id = x.user_id
  left join lateral (
    select s.id, s.provider, s.amount_minor, s.created_at from geological_assistant.subscriptions s
    where s.user_id = x.user_id and s.course_id = p_course_id and s.status = 'active'
      and (s.current_period_end is null or s.current_period_end > now())
    order by s.created_at desc limit 1
  ) sub on true
  order by coalesce(pr.created_at, u.created_at) desc
  limit 2000;
end $$;

-- 3a. Admin makes a free-access code for one signed-in user. Calling it again for
-- the same user returns their unused code instead of making a second one.
create or replace function geological_assistant.admin_make_access_code(p_course_id text, p_user_id uuid, p_note text default null)
returns text language plpgsql volatile security definer set search_path to '' as $$
declare existing text; new_code text;
begin
  if not geological_assistant.is_admin() then raise exception 'Admins only'; end if;
  if not exists (select 1 from auth.users where id = p_user_id) then raise exception 'No such account'; end if;
  if not exists (select 1 from geological_assistant.courses where id = p_course_id) then raise exception 'Unknown course'; end if;
  select k.code into existing from geological_assistant.coupons k
    where k.kind = 'access' and k.user_id = p_user_id and k.course_id = p_course_id
      and k.active and k.used_count < coalesce(k.max_uses, 1)
    order by k.created_at desc limit 1;
  if existing is not null then return existing; end if;
  new_code := 'FREE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into geological_assistant.coupons (code, course_id, kind, percent_off, user_id, max_uses, note, created_by)
    values (new_code, p_course_id, 'access', 100, p_user_id, 1, p_note, auth.jwt() ->> 'email');
  return new_code;
end $$;

-- 3b. The user enters their code on the buy page: the course unlocks for life, no payment.
create or replace function geological_assistant.claim_access_code(p_code text)
returns boolean language plpgsql volatile security definer set search_path to '' as $$
declare uid uuid := auth.uid(); c geological_assistant.coupons;
begin
  if uid is null then raise exception 'Sign in first'; end if;
  select * into c from geological_assistant.coupons k where k.code = upper(btrim(p_code)) for update;
  if not found or not c.active or c.kind <> 'access' then raise exception 'This code is not valid'; end if;
  if c.user_id is distinct from uid then raise exception 'This code belongs to another account'; end if;
  if c.expires_at is not null and c.expires_at <= now() then raise exception 'This code has expired'; end if;
  if c.used_count >= coalesce(c.max_uses, 1) then raise exception 'This code has been used up'; end if;
  insert into geological_assistant.subscriptions (user_id, course_id, provider, provider_ref, amount_minor, status, current_period_end)
    values (uid, c.course_id, 'coupon', 'coupon:' || c.code, 0, 'active', null)
    on conflict (provider_ref) do nothing;
  update geological_assistant.coupons set used_count = used_count + 1 where code = c.code;
  return true;
end $$;

revoke all on function geological_assistant.admin_list_participants(text) from public, anon;
grant execute on function geological_assistant.admin_list_participants(text) to authenticated;
revoke all on function geological_assistant.admin_make_access_code(text, uuid, text) from public, anon;
grant execute on function geological_assistant.admin_make_access_code(text, uuid, text) to authenticated;
revoke all on function geological_assistant.claim_access_code(text) from public, anon;
grant execute on function geological_assistant.claim_access_code(text) to authenticated;
