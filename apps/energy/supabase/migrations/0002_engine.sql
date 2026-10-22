-- Recallio engine for the Energy Manager course.
-- The software plans the day; the student only chooses which papers to enrol in.
-- Every function the app calls lives in public (the schema the REST API
-- exposes) and is SECURITY DEFINER, checking auth.uid() itself, so the
-- energy_manager schema never needs to be exposed.

create or replace function energy_manager.today_ist() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'Asia/Kolkata')::date
$$;

create or replace function energy_manager.card_json(c energy_manager.cards) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'paper', c.paper_id, 'topic', c.topic, 'kind', c.kind,
    'front', c.front, 'back', c.back, 'explain', c.explain,
    'steps', coalesce(c.steps, '[]'::jsonb), 'source', c.source)
$$;

-- Papers and how much is in each. Open to everyone: the enrol screen shows it.
create or replace function public.em_catalog() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'code', p.code, 'name', p.name, 'short', p.short_name,
    'facts', (select count(*) from energy_manager.cards c where c.paper_id = p.id and c.active and c.kind = 'fact'),
    'problems', (select count(*) from energy_manager.cards c where c.paper_id = p.id and c.active and c.kind = 'problem')
  ) order by p.id), '[]'::jsonb)
  from energy_manager.papers p
$$;

-- The signed-in student and the papers they are enrolled in.
create or replace function public.em_me() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return jsonb_build_object('signedIn', false);
  end if;
  insert into energy_manager.profiles (user_id, email, name)
  select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
  from auth.users u where u.id = uid
  on conflict (user_id) do nothing;
  return jsonb_build_object(
    'signedIn', true,
    'enrolled', coalesce((select jsonb_agg(e.paper_id order by e.paper_id)
                          from energy_manager.enrolments e where e.user_id = uid and e.active), '[]'::jsonb));
end $$;

-- Enrol in exactly this set of papers. Progress on a dropped paper is kept (its row is switched off),
-- so re-enrolling later picks up where the student left off.
create or replace function public.em_enrol(p_papers smallint[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  if p_papers is null or cardinality(p_papers) = 0 then
    raise exception 'Choose at least one paper' using errcode = '22023';
  end if;
  perform public.em_me();
  update energy_manager.enrolments set active = (paper_id = any (p_papers))
   where user_id = uid;
  insert into energy_manager.enrolments (user_id, paper_id)
  select uid, p.id from energy_manager.papers p where p.id = any (p_papers)
  on conflict (user_id, paper_id) do update set active = true;
  return public.em_me();
end $$;

-- Today's plan: revision that is due, then new material, both chosen by the
-- engine. New material is a fixed quota per enrolled paper per IST day.
create or replace function public.em_today() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  d date := energy_manager.today_ist();
  day_end timestamptz := ((d + 1)::timestamp at time zone 'Asia/Kolkata');
  per_paper int;
  due jsonb;
  fresh jsonb;
  streak int := 0;
  probe date;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  select p.new_per_paper_per_day into per_paper from energy_manager.profiles p where p.user_id = uid;
  per_paper := coalesce(per_paper, 8);

  select coalesce(jsonb_agg(energy_manager.card_json(c) || jsonb_build_object('mode', 'review')
                            order by s.due_at), '[]'::jsonb)
    into due
    from energy_manager.card_state s
    join energy_manager.cards c on c.id = s.card_id and c.active
    join energy_manager.enrolments e on e.user_id = uid and e.paper_id = c.paper_id and e.active
   where s.user_id = uid and s.due_at < day_end;

  with quota as (
    select e.paper_id,
           greatest(0, per_paper - (select count(*) from energy_manager.card_state s
                                      join energy_manager.cards c on c.id = s.card_id
                                     where s.user_id = uid and s.introduced_on = d
                                       and c.paper_id = e.paper_id)) as left_today
      from energy_manager.enrolments e where e.user_id = uid and e.active
  ), ranked as (
    select c.id, c.paper_id,
           row_number() over (partition by c.paper_id order by c.order_index, c.id) as rn
      from energy_manager.cards c
      join quota q on q.paper_id = c.paper_id
     where c.active
       and not exists (select 1 from energy_manager.card_state s
                        where s.user_id = uid and s.card_id = c.id)
  )
  select coalesce(jsonb_agg(energy_manager.card_json(c) || jsonb_build_object('mode', 'new')
                            order by r.rn, r.paper_id), '[]'::jsonb)
    into fresh
    from ranked r
    join quota q on q.paper_id = r.paper_id
    join energy_manager.cards c on c.id = r.id
   where r.rn <= q.left_today;

  -- Streak: consecutive IST days with at least one review, ending today or yesterday.
  probe := d;
  if not exists (select 1 from energy_manager.review_log l where l.user_id = uid
                  and (l.reviewed_at at time zone 'Asia/Kolkata')::date = d) then
    probe := d - 1;
  end if;
  while exists (select 1 from energy_manager.review_log l where l.user_id = uid
                 and (l.reviewed_at at time zone 'Asia/Kolkata')::date = probe) loop
    streak := streak + 1;
    probe := probe - 1;
  end loop;

  return jsonb_build_object(
    'date', d,
    'review', due,
    'new', fresh,
    'doneToday', (select count(distinct l.card_id) from energy_manager.review_log l
                   where l.user_id = uid and (l.reviewed_at at time zone 'Asia/Kolkata')::date = d),
    'streak', streak,
    'progress', (select coalesce(jsonb_agg(jsonb_build_object(
                    'paper', e.paper_id,
                    'total', (select count(*) from energy_manager.cards c
                               where c.paper_id = e.paper_id and c.active),
                    'seen', (select count(*) from energy_manager.card_state s
                               join energy_manager.cards c on c.id = s.card_id
                              where s.user_id = uid and c.paper_id = e.paper_id),
                    'mastered', (select count(*) from energy_manager.card_state s
                               join energy_manager.cards c on c.id = s.card_id
                              where s.user_id = uid and c.paper_id = e.paper_id
                                and s.interval_days >= 21)
                  ) order by e.paper_id), '[]'::jsonb)
                  from energy_manager.enrolments e where e.user_id = uid and e.active));
end $$;

-- Grade one card: 1 Again, 2 Hard, 3 Good, 4 Easy (SM-2 style).
create or replace function public.em_review(p_card text, p_grade int) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  d date := energy_manager.today_ist();
  s energy_manager.card_state;
  new_ease real;
  new_int real;
  new_reps int;
  new_lapses int;
  next_due timestamptz;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  if p_grade is null or p_grade not between 1 and 4 then
    raise exception 'Bad grade' using errcode = '22023';
  end if;
  if not exists (select 1 from energy_manager.cards c
                   join energy_manager.enrolments e on e.paper_id = c.paper_id and e.user_id = uid and e.active
                  where c.id = p_card and c.active) then
    raise exception 'Card not in your papers' using errcode = '42501';
  end if;

  select * into s from energy_manager.card_state cs
   where cs.user_id = uid and cs.card_id = p_card for update;
  if not found then
    s.ease := 2.5; s.interval_days := 0; s.reps := 0; s.lapses := 0;
  end if;

  new_ease := s.ease; new_reps := s.reps; new_lapses := s.lapses;
  if p_grade = 1 then
    if s.reps > 0 then new_lapses := s.lapses + 1; end if;
    new_reps := 0; new_int := 0;
    new_ease := greatest(1.3, s.ease - 0.2);
  elsif p_grade = 2 then
    new_int := case when s.reps = 0 then 1 else greatest(1, s.interval_days * 1.2) end;
    new_ease := greatest(1.3, s.ease - 0.15);
    new_reps := s.reps + 1;
  elsif p_grade = 3 then
    new_int := case when s.reps = 0 then 1 when s.reps = 1 then 3
                    else greatest(4, s.interval_days * s.ease) end;
    new_reps := s.reps + 1;
  else
    new_int := case when s.reps = 0 then 3 when s.reps = 1 then 6
                    else greatest(7, s.interval_days * s.ease * 1.3) end;
    new_ease := s.ease + 0.15;
    new_reps := s.reps + 1;
  end if;
  new_int := least(365, round(new_int::numeric, 1));

  if new_int = 0 then
    next_due := now() + interval '10 minutes';
  else
    next_due := ((d + ceil(new_int)::int)::timestamp at time zone 'Asia/Kolkata');
  end if;

  insert into energy_manager.card_state
    (user_id, card_id, ease, interval_days, reps, lapses, due_at, introduced_on, last_reviewed_at)
  values (uid, p_card, new_ease, new_int, new_reps, new_lapses, next_due, d, now())
  on conflict (user_id, card_id) do update set
    ease = excluded.ease, interval_days = excluded.interval_days, reps = excluded.reps,
    lapses = excluded.lapses, due_at = excluded.due_at,
    last_reviewed_at = excluded.last_reviewed_at;

  insert into energy_manager.review_log (user_id, card_id, grade) values (uid, p_card, p_grade);

  return jsonb_build_object('card', p_card, 'intervalDays', new_int, 'dueAt', next_due);
end $$;

-- Noon flash: one or two high-yield facts per enrolled paper; the same all
-- day, different every day. Signed-out visitors get one per paper.
create or replace function public.em_flash() returns jsonb
language sql stable security definer set search_path = '' as $$
  with papers as (
    select e.paper_id, 2 as n from energy_manager.enrolments e where e.user_id = auth.uid() and e.active
    union all
    select p.id, 1 from energy_manager.papers p
     where not exists (select 1 from energy_manager.enrolments e where e.user_id = auth.uid() and e.active)
  ), picked as (
    select c.id, c.paper_id, c.topic, c.front, c.back, p.n,
           row_number() over (partition by c.paper_id
                              order by md5(c.id || energy_manager.today_ist()::text)) as rn
      from energy_manager.cards c join papers p on p.paper_id = c.paper_id
     where c.active and c.flash
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'paper', paper_id, 'topic', topic,
                                               'question', front, 'answer', back)
                            order by paper_id, rn), '[]'::jsonb)
    from picked where rn <= n
$$;

revoke all on function energy_manager.today_ist(), energy_manager.card_json(energy_manager.cards) from public;
revoke all on function public.em_catalog(), public.em_me(), public.em_enrol(smallint[]),
  public.em_today(), public.em_review(text, int), public.em_flash() from public, anon, authenticated;
grant execute on function public.em_catalog(), public.em_flash() to anon, authenticated;
grant execute on function public.em_me(), public.em_enrol(smallint[]), public.em_today(),
  public.em_review(text, int) to authenticated;
