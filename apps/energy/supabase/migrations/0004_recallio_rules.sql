-- Recallio rules for the Energy Manager course (see docs/UPGRADE_PLAN.md).
--
-- What changes:
--  * FSRS-5 replaces SM-2 (ratings: 1 Didn't get it, 2 Tough, 3 Understood, 4 So simple).
--  * The exam date drives the daily plan; intervals are capped before exam day.
--  * Study happens in saved sittings of at most 10 slots, at set study times.
--  * Revision window and 2-day cram mode switch on by themselves.
--
-- The old em_today / em_review functions stay for now so the deployed app keeps
-- working until the new front end ships; a later migration drops them.

-- ---------------------------------------------------------------- tables

create table if not exists energy_manager.exam_info (
  id smallint primary key,
  name text not null,
  exam_date date not null,
  status text not null check (status in ('official', 'estimated')),
  source text not null,
  checked_on date not null
);
-- 26th NCE: 25 to 27 September 2026 (prospectus, nceexam.in). The 27th is not
-- announced; estimate from the same pattern. Update this row when BEE publishes it.
insert into energy_manager.exam_info values
 (1, '27th National Certification Examination for Energy Managers and Energy Auditors',
  '2027-09-24', 'estimated',
  'Estimated from the 26th exam (25 to 27 Sep 2026, prospectus at nceexam.in). Not yet announced by BEE.',
  '2026-10-22')
on conflict (id) do nothing;

-- Tunable numbers. Change a value here; no deploy needed.
create table if not exists energy_manager.config (
  key text primary key,
  value jsonb not null
);
insert into energy_manager.config values
 ('sitting_slots', '10'),
 ('again_extra', '2'),
 ('quota_break_min', '10'),
 ('bonus_gap_min', '90'),
 ('bonus_max', '2'),
 ('bonus_new', '5'),
 ('cram_days', '2'),
 ('cram_break_min', '5'),
 ('exam_cap_days', '3'),
 ('quiet_start', '"21:30"'),
 ('quiet_end', '"06:30"'),
 ('fact_seconds', '35'),
 ('problem_seconds', '200'),
 ('review_seconds', '25'),
 ('retention', '0.9'),
 -- FSRS-5 default parameters w0..w18.
 ('fsrs_w', '[0.40255,1.18385,3.173,15.69105,7.1949,0.5345,1.4604,0.0046,1.54575,0.1192,1.01925,1.9395,0.11,0.29605,2.2698,0.2315,2.9898,0.51655,0.6621]')
on conflict (key) do nothing;

alter table energy_manager.profiles
  add column if not exists exam_date date,
  add column if not exists study_times time[] not null default '{07:00,13:00,20:00}',
  add column if not exists minutes_per_day smallint not null default 30,
  add column if not exists updated_at timestamptz not null default now();

alter table energy_manager.card_state
  add column if not exists stability real,
  add column if not exists difficulty real,
  -- 0 new, 1 learning, 2 review, 3 relearning
  add column if not exists fsrs_state smallint not null default 0,
  add column if not exists last_rating smallint,
  add column if not exists ever_tough boolean not null default false,
  add column if not exists recent smallint[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();

-- Convert any SM-2 progress: the interval becomes the stability, ease maps to difficulty.
update energy_manager.card_state set
  stability = greatest(0.5, interval_days),
  difficulty = least(10, greatest(1, 5 + (2.5 - ease) * 3.3)),
  fsrs_state = case when reps > 0 then 2 else 1 end,
  ever_tough = lapses > 0
where stability is null;

alter table energy_manager.review_log
  add column if not exists mode text,
  add column if not exists seconds integer,
  add column if not exists sitting_id bigint;

-- One row per learner per IST day: how much today's quota holds.
create table if not exists energy_manager.day_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  mode text not null,
  new_quota integer not null,
  review_quota integer not null,
  behind boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- A sitting is a saved list of cards and a position. Reloading resumes it;
-- the only way forward is a rating.
create table if not exists energy_manager.sittings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('quota', 'bonus', 'cram', 'exam')),
  cards text[] not null,
  pos integer not null default 0,
  new_count integer not null default 0,
  review_count integer not null default 0,
  again_ids text[] not null default '{}',
  requeued text[] not null default '{}',
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists sittings_user_day on energy_manager.sittings (user_id, day);
create unique index if not exists sittings_one_open on energy_manager.sittings (user_id) where finished_at is null;

alter table energy_manager.exam_info enable row level security;
alter table energy_manager.config enable row level security;
alter table energy_manager.day_plans enable row level security;
alter table energy_manager.sittings enable row level security;

-- ---------------------------------------------------------------- helpers

create or replace function energy_manager.cfg(k text) returns jsonb
language sql stable set search_path = '' as $$
  select value from energy_manager.config where key = k
$$;

create or replace function energy_manager.cfg_int(k text) returns int
language sql stable set search_path = '' as $$
  select (value #>> '{}')::int from energy_manager.config where key = k
$$;

create or replace function energy_manager.ist(d date, t time) returns timestamptz
language sql immutable set search_path = '' as $$
  select (d + t) at time zone 'Asia/Kolkata'
$$;

-- Predicted chance of recalling a card now (FSRS forgetting curve).
create or replace function energy_manager.recall_p(s real, last timestamptz, at timestamptz default now())
returns real language sql stable set search_path = '' as $$
  select case when s is null or s <= 0 or last is null then 0
              else power(1 + (19.0 / 81.0) * greatest(0, extract(epoch from at - last) / 86400) / s, -0.5)
         end::real
$$;

-- FSRS-5 step. Returns stability, difficulty and the interval in days for the
-- desired retention (0 means "again in a few minutes").
create or replace function energy_manager.fsrs_next(
  s real, d real, state smallint, last timestamptz, rating int, at timestamptz default now(),
  out new_s real, out new_d real, out days real)
language plpgsql stable set search_path = '' as $$
declare
  w real[];
  t real;
  r real;
  ret real := coalesce((energy_manager.cfg('retention') #>> '{}')::real, 0.9);
  d0_easy real;
begin
  select array_agg(x::real order by i) into w
    from jsonb_array_elements_text(energy_manager.cfg('fsrs_w')) with ordinality as e(x, i);
  -- w[1] is FSRS w0.
  if s is null or state = 0 or last is null then
    new_s := w[rating];
    new_d := w[5] - exp(w[6] * (rating - 1)) + 1;
  else
    t := greatest(0, extract(epoch from at - last) / 86400);
    r := power(1 + (19.0 / 81.0) * t / s, -0.5);
    if t < 1 then
      new_s := s * exp(w[18] * (rating - 3 + w[19]));
    elsif rating = 1 then
      new_s := least(s, w[12] * power(d, -w[13]) * (power(s + 1, w[14]) - 1) * exp(w[15] * (1 - r)));
    else
      new_s := s * (1 + exp(w[9]) * (11 - d) * power(s, -w[10]) * (exp(w[11] * (1 - r)) - 1)
                    * case when rating = 2 then w[16] else 1 end
                    * case when rating = 4 then w[17] else 1 end);
    end if;
    new_d := d + (-w[7] * (rating - 3)) * (10 - d) / 9;
    d0_easy := w[5] - exp(w[6] * 3) + 1;
    new_d := w[8] * d0_easy + (1 - w[8]) * new_d;
  end if;
  new_s := greatest(0.1, new_s);
  new_d := least(10, greatest(1, new_d));
  if rating = 1 then
    days := 0;
  else
    days := new_s * (81.0 / 19.0) * (power(ret, -2) - 1);
  end if;
end $$;

-- Payload the feed needs for one card. view: learn (first showing) or recall.
create or replace function energy_manager.feed_card(uid uuid, cid text) returns jsonb
language sql stable set search_path = '' as $$
  select energy_manager.card_json(c) || jsonb_build_object(
           'view', case when s.card_id is null then 'learn' else 'recall' end,
           'mode', case when s.card_id is null then 'new' else 'review' end,
           'flash', c.flash,
           'stillTough', coalesce((select count(*) from unnest(s.recent) x where x <= 2) >= 2, false))
    from energy_manager.cards c
    left join energy_manager.card_state s on s.user_id = uid and s.card_id = c.id
   where c.id = cid
$$;

-- The exam the learner is working towards: their own date, else the official one.
create or replace function energy_manager.exam_for(uid uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'name', x.name,
    'date', coalesce(p.exam_date, x.exam_date),
    'official', x.exam_date,
    'status', x.status,
    'source', x.source,
    'mine', p.exam_date is not null,
    'daysLeft', coalesce(p.exam_date, x.exam_date) - energy_manager.today_ist())
  from energy_manager.exam_info x
  left join energy_manager.profiles p on p.user_id = uid
  where x.id = 1
$$;

-- Today's plan for one learner, made once per IST day.
create or replace function energy_manager.day_plan(uid uuid) returns energy_manager.day_plans
language plpgsql set search_path = '' as $$
declare
  d date := energy_manager.today_ist();
  day_end timestamptz := energy_manager.ist(d + 1, '00:00');
  p energy_manager.day_plans;
  prof energy_manager.profiles;
  exam date;
  days_left int;
  rev_window int;
  learn_days int;
  new_left int;
  flash_left int;
  new_per_day int;
  due_count int;
  review_q int;
  budget int;
  avg_new int;
  m text;
begin
  select * into p from energy_manager.day_plans where user_id = uid and day = d;
  if found then return p; end if;

  select * into prof from energy_manager.profiles where user_id = uid;
  exam := ((energy_manager.exam_for(uid))->>'date')::date;
  days_left := exam - d;

  select count(*) filter (where true), count(*) filter (where c.flash)
    into new_left, flash_left
    from energy_manager.cards c
    join energy_manager.enrolments e on e.user_id = uid and e.paper_id = c.paper_id and e.active
   where c.active
     and not exists (select 1 from energy_manager.card_state s where s.user_id = uid and s.card_id = c.id);

  select count(*) into due_count
    from energy_manager.card_state s
    join energy_manager.cards c on c.id = s.card_id and c.active
    join energy_manager.enrolments e on e.user_id = uid and e.paper_id = c.paper_id and e.active
   where s.user_id = uid and s.due_at < day_end;

  -- The revision window is fixed from the whole run-up (enrolment to exam), so it
  -- does not shrink as the exam gets closer.
  rev_window := least(14, round(greatest(exam - (coalesce(prof.created_at, now()) at time zone 'Asia/Kolkata')::date, 0) * 0.15));
  if days_left < 0 then
    m := 'after';
    new_per_day := ceil(new_left / 60.0);
  elsif days_left = 0 then
    m := 'exam';
    new_per_day := 0;
  elsif days_left <= energy_manager.cfg_int('cram_days') then
    m := 'cram';
    new_per_day := least(flash_left, 20);
  elsif days_left - energy_manager.cfg_int('cram_days') <= rev_window then
    m := 'revision';
    new_per_day := ceil(flash_left / greatest(1.0, days_left - energy_manager.cfg_int('cram_days')));
  else
    m := 'learn';
    learn_days := greatest(1, days_left - rev_window - energy_manager.cfg_int('cram_days'));
    new_per_day := ceil(new_left::numeric / learn_days);
  end if;

  if m = 'exam' then
    review_q := 10;
  elsif m = 'cram' then
    review_q := least(due_count + 40, 80);
  else
    review_q := least(due_count, 2 * new_per_day + 20);
  end if;

  -- Fit the learner's free time: drop new cards before reviews.
  budget := coalesce(prof.minutes_per_day, 30) * 60 - review_q * energy_manager.cfg_int('review_seconds');
  avg_new := (energy_manager.cfg_int('fact_seconds') * 3 + energy_manager.cfg_int('problem_seconds')) / 4;
  p.behind := false;
  if m in ('learn', 'revision', 'after') and new_per_day * avg_new > greatest(budget, 0) then
    p.behind := true;
    new_per_day := greatest(least(new_per_day, 3), floor(greatest(budget, 0)::numeric / avg_new)::int);
  end if;

  insert into energy_manager.day_plans (user_id, day, mode, new_quota, review_quota, behind)
  values (uid, d, m, least(new_per_day, new_left), review_q, p.behind)
  on conflict (user_id, day) do nothing;
  select * into p from energy_manager.day_plans where user_id = uid and day = d;
  return p;
end $$;

-- Where the learner stands today: quota, the open sitting, when the next opens.
create or replace function energy_manager.plan_state(uid uuid) returns jsonb
language plpgsql set search_path = '' as $$
declare
  d date := energy_manager.today_ist();
  day_end timestamptz := energy_manager.ist(d + 1, '00:00');
  p energy_manager.day_plans := energy_manager.day_plan(uid);
  prof energy_manager.profiles;
  quota_kind text;
  new_used int;
  rev_used int;
  quota_n int;
  bonus_n int;
  last_done timestamptz;
  open_s bigint;
  new_avail boolean;
  rev_avail boolean;
  new_pool int;
  rev_pool int;
  new_rem int;
  rev_rem int;
  open_rem int;
  complete boolean;
  next_kind text;
  opens timestamptz;
  qs time := (energy_manager.cfg('quiet_start') #>> '{}')::time;
  qe time := (energy_manager.cfg('quiet_end') #>> '{}')::time;
  now_t time := (now() at time zone 'Asia/Kolkata')::time;
  done int;
begin
  select * into prof from energy_manager.profiles where user_id = uid;
  quota_kind := case p.mode when 'cram' then 'cram' when 'exam' then 'exam' else 'quota' end;

  select coalesce(sum(new_count), 0), coalesce(sum(review_count), 0), count(*)
    into new_used, rev_used, quota_n
    from energy_manager.sittings where user_id = uid and day = d and kind = quota_kind;
  select count(*) into bonus_n from energy_manager.sittings
   where user_id = uid and day = d and kind = 'bonus';
  select max(finished_at) into last_done from energy_manager.sittings where user_id = uid;
  select id into open_s from energy_manager.sittings where user_id = uid and finished_at is null;

  select count(distinct l.card_id) into done
    from energy_manager.review_log l
    join energy_manager.sittings s on s.id = l.sitting_id
   where s.user_id = uid and s.day = d and s.kind = quota_kind
     and not (l.card_id = any (s.again_ids));

  select count(*) into new_pool from energy_manager.cards c
    join energy_manager.enrolments e on e.user_id = uid and e.paper_id = c.paper_id and e.active
   where c.active and (p.mode not in ('revision', 'cram') or c.flash)
     and not exists (select 1 from energy_manager.card_state s where s.user_id = uid and s.card_id = c.id);
  select count(*) into rev_pool from energy_manager.card_state s
    join energy_manager.cards c on c.id = s.card_id and c.active
    join energy_manager.enrolments e on e.user_id = uid and e.paper_id = c.paper_id and e.active
   where s.user_id = uid
     and (s.last_reviewed_at is null or s.last_reviewed_at < energy_manager.ist(d, '00:00'))
     and (p.mode in ('cram', 'exam') or s.due_at < day_end);
  new_rem := greatest(0, least(p.new_quota - new_used, new_pool));
  rev_rem := greatest(0, least(p.review_quota - rev_used, rev_pool));
  if p.mode = 'exam' then new_rem := 0; end if;
  new_avail := new_rem > 0;
  rev_avail := rev_rem > 0;
  -- Quota cards still ahead in the open sitting (not repeats, not "again" extras).
  select coalesce(sum((select count(*) from generate_series(s.pos + 1, cardinality(s.cards) - cardinality(s.requeued)) i
                        where not (s.cards[i] = any (s.again_ids)))), 0)
    into open_rem
    from energy_manager.sittings s where s.id = open_s and s.kind = quota_kind;
  complete := not new_avail and not rev_avail;

  if open_s is not null then
    next_kind := null;
  elsif not complete then
    next_kind := quota_kind;
    if quota_kind in ('cram', 'exam') then
      opens := coalesce(last_done + make_interval(mins => energy_manager.cfg_int('cram_break_min')), now());
    elsif not exists (select 1 from energy_manager.review_log where user_id = uid) then
      -- The very first sitting starts straight after enrolment.
      opens := now();
    elsif quota_n < coalesce(cardinality(prof.study_times), 0) then
      opens := energy_manager.ist(d, prof.study_times[quota_n + 1]);
      if last_done is not null then
        opens := greatest(opens, last_done + make_interval(mins => energy_manager.cfg_int('quota_break_min')));
      end if;
    else
      opens := coalesce(last_done + make_interval(mins => energy_manager.cfg_int('quota_break_min')), now());
    end if;
  elsif p.mode = 'cram' then
    -- Cram: keep going in sittings of 10 with short breaks while cards remain.
    next_kind := 'cram';
    opens := coalesce(last_done + make_interval(mins => energy_manager.cfg_int('cram_break_min')), now());
  elsif p.mode <> 'exam' and bonus_n < energy_manager.cfg_int('bonus_max') then
    next_kind := 'bonus';
    opens := coalesce(last_done, now()) + make_interval(mins => energy_manager.cfg_int('bonus_gap_min'));
    -- Never in quiet hours: tonight's bonus is dropped.
    if (opens at time zone 'Asia/Kolkata')::time >= qs or (opens at time zone 'Asia/Kolkata')::date > d
       or (opens at time zone 'Asia/Kolkata')::time < qe then
      next_kind := null;
      opens := null;
    end if;
  end if;

  -- When nothing more today: the first study time tomorrow.
  if next_kind is null and open_s is null then
    opens := energy_manager.ist(d + 1, coalesce(prof.study_times[1], '07:00'));
  end if;

  return jsonb_build_object(
    'mode', p.mode,
    'behind', p.behind,
    'quota', jsonb_build_object('total', done + new_rem + rev_rem + open_rem,
                                'done', done,
                                'complete', complete and open_s is null),
    'openSitting', open_s,
    'next', case when next_kind is null then jsonb_build_object('kind', null, 'opensAt', opens)
                 else jsonb_build_object('kind', next_kind, 'opensAt', greatest(opens, now()),
                                         'openNow', opens <= now(),
                                         'number', case when next_kind = 'bonus' then bonus_n + 1 else quota_n + 1 end) end,
    'quietNow', now_t >= qs or now_t < qe);
end $$;

-- Pick and arrange the cards for a new sitting. See learning engine §4.
create or replace function energy_manager.build_sitting(uid uuid, k text) returns bigint
language plpgsql set search_path = '' as $$
declare
  d date := energy_manager.today_ist();
  day_start timestamptz := energy_manager.ist(d, '00:00');
  day_end timestamptz := energy_manager.ist(d + 1, '00:00');
  p energy_manager.day_plans := energy_manager.day_plan(uid);
  slots int := energy_manager.cfg_int('sitting_slots');
  rev_cap int;
  new_left int;
  rev_left int;
  used int := 0;
  rec record;
  ids text[] := '{}';
  scores real[] := '{}';
  topics text[] := '{}';
  probs boolean[] := '{}';
  papers int[] := '{}';
  isnew boolean[] := '{}';
  again text[] := '{}';
  n_new int := 0;
  n_rev int := 0;
  wgt int;
  ord int[];
  out_ids text[] := '{}';
  remaining int[];
  prev_topic text;
  prev_prob boolean := false;
  pick int;
  last_i int;
  i int;
  sid bigint;
  welcome boolean;
begin
  -- The first sitting ever, and the first after two or more days away, are short.
  welcome := not exists (select 1 from energy_manager.review_log
                          where user_id = uid and reviewed_at >= energy_manager.ist(d - 2, '00:00'));
  if welcome then slots := 5; end if;

  if k = 'bonus' then
    new_left := energy_manager.cfg_int('bonus_new');
    rev_left := slots;
  else
    select greatest(0, p.new_quota - coalesce(sum(s.new_count), 0)),
           greatest(0, p.review_quota - coalesce(sum(s.review_count), 0))
      into new_left, rev_left
      from energy_manager.sittings s where s.user_id = uid and s.day = d and s.kind = k;
  end if;
  if k = 'exam' then new_left := 0; end if;
  if k = 'cram' and new_left = 0 and rev_left = 0 then
    -- Extra cram sittings after the quota.
    rev_left := slots;
  end if;

  -- 1. "Didn't get it" earlier today: up to 2, as extra room.
  for rec in
    select s.card_id, c.topic, c.kind = 'problem' as prob, c.paper_id
      from energy_manager.card_state s
      join energy_manager.cards c on c.id = s.card_id and c.active
      join energy_manager.enrolments e on e.user_id = uid and e.paper_id = c.paper_id and e.active
     where s.user_id = uid and s.last_rating = 1 and s.last_reviewed_at >= day_start
       and k <> 'exam'
     order by s.last_reviewed_at
     limit energy_manager.cfg_int('again_extra')
  loop
    ids := ids || rec.card_id; scores := scores || 0.05::real; topics := topics || rec.topic;
    probs := probs || rec.prob; again := again || rec.card_id;
    papers := papers || rec.paper_id::int; isnew := isnew || false;
  end loop;

  -- 2. Due reviews, weakest and toughest first, up to 60% of the slots while new cards wait.
  rev_cap := case when new_left > 0 then ceil(slots * 0.6) else slots end;
  for rec in
    select s.card_id, c.topic, c.kind = 'problem' as prob, c.paper_id,
           energy_manager.recall_p(s.stability, s.last_reviewed_at) as r
      from energy_manager.card_state s
      join energy_manager.cards c on c.id = s.card_id and c.active
      join energy_manager.enrolments e on e.user_id = uid and e.paper_id = c.paper_id and e.active
     where s.user_id = uid
       and (s.last_reviewed_at is null or s.last_reviewed_at < day_start)
       and case k when 'quota' then s.due_at < day_end
                  when 'bonus' then s.due_at < day_end + interval '2 days'
                  else true end
     order by
       case when k = 'exam' then -energy_manager.recall_p(s.stability, s.last_reviewed_at) else 0 end,
       case when k = 'cram' then (select count(*) from unnest(s.recent) x where x <= 2) >= 2 end desc nulls last,
       case when k = 'cram' then c.flash end desc nulls last,
       s.ever_tough desc,
       energy_manager.recall_p(s.stability, s.last_reviewed_at)
     limit 60
  loop
    wgt := case when rec.prob then 2 else 1 end;
    exit when n_rev >= rev_left;
    continue when used + wgt > rev_cap;
    ids := ids || rec.card_id; scores := scores || rec.r; topics := topics || rec.topic;
    probs := probs || rec.prob; used := used + wgt; n_rev := n_rev + 1;
    papers := papers || rec.paper_id::int; isnew := isnew || false;
  end loop;

  -- 3. New cards from today's plan, all enrolled papers moving forward together.
  for rec in
    with pool as (
      select c.id, c.topic, c.kind = 'problem' as prob, c.paper_id,
             row_number() over (partition by c.paper_id order by c.order_index, c.id) as rn,
             count(*) over (partition by c.paper_id) as total
        from energy_manager.cards c
        join energy_manager.enrolments e on e.user_id = uid and e.paper_id = c.paper_id and e.active
       where c.active
         and (p.mode not in ('revision', 'cram') or c.flash)
         and not exists (select 1 from energy_manager.card_state s where s.user_id = uid and s.card_id = c.id)
    )
    select id, topic, prob, paper_id from pool order by rn::real / total, paper_id limit 40
  loop
    exit when n_new >= new_left or used >= slots;
    wgt := case when rec.prob then 2 else 1 end;
    continue when used + wgt > slots;
    ids := ids || rec.id; scores := scores || case when rec.prob then 0.3 else 0.6 end::real;
    topics := topics || rec.topic; probs := probs || rec.prob;
    papers := papers || rec.paper_id::int; isnew := isnew || true;
    used := used + wgt; n_new := n_new + 1;
  end loop;

  -- 4. Room left and no new cards: more reviews.
  if used < slots and n_rev < rev_left then
    for rec in
      select s.card_id, c.topic, c.kind = 'problem' as prob, c.paper_id,
             energy_manager.recall_p(s.stability, s.last_reviewed_at) as r
        from energy_manager.card_state s
        join energy_manager.cards c on c.id = s.card_id and c.active
        join energy_manager.enrolments e on e.user_id = uid and e.paper_id = c.paper_id and e.active
       where s.user_id = uid
         and (s.last_reviewed_at is null or s.last_reviewed_at < day_start)
         and case k when 'quota' then s.due_at < day_end
                    when 'bonus' then s.due_at < day_end + interval '2 days'
                    else true end
         and not (s.card_id = any (ids))
       order by s.ever_tough desc, energy_manager.recall_p(s.stability, s.last_reviewed_at)
       limit 40
    loop
      exit when n_rev >= rev_left or used >= slots;
      wgt := case when rec.prob then 2 else 1 end;
      continue when used + wgt > slots;
      ids := ids || rec.card_id; scores := scores || rec.r; topics := topics || rec.topic;
      probs := probs || rec.prob; used := used + wgt; n_rev := n_rev + 1;
    papers := papers || rec.paper_id::int; isnew := isnew || false;
    end loop;
  end if;

  if cardinality(ids) = 0 then return null; end if;

  -- Arrange: a likely win first and last; no same topic or two problems back
  -- to back; new cards of a paper stay in book order.
  select array_agg(i0 order by scores[i0] desc, i0) into ord from generate_subscripts(ids, 1) as i0;
  remaining := ord;
  last_i := null;
  foreach i in array ord[2:] loop
    if not isnew[i] and scores[i] >= 0.6 then last_i := i; exit; end if;
  end loop;
  if last_i is not null then remaining := array_remove(remaining, last_i); end if;
  prev_topic := null;
  while cardinality(remaining) > 0 loop
    pick := null;
    foreach i in array remaining loop
      continue when isnew[i] and exists (
        select 1 from unnest(remaining) j where j < i and isnew[j] and papers[j] = papers[i]);
      if pick is null then pick := i; end if;
      if topics[i] is distinct from prev_topic and not (probs[i] and prev_prob) then pick := i; exit; end if;
    end loop;
    out_ids := out_ids || ids[pick];
    prev_topic := topics[pick]; prev_prob := probs[pick];
    remaining := array_remove(remaining, pick);
  end loop;
  if last_i is not null then out_ids := out_ids || ids[last_i]; end if;

  insert into energy_manager.sittings (user_id, day, kind, cards, new_count, review_count, again_ids)
  values (uid, d, k, out_ids, n_new, n_rev, again)
  returning id into sid;
  return sid;
end $$;

-- ---------------------------------------------------------------- API

-- Everything the feed screen shows.
create or replace function public.em_feed() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  d date := energy_manager.today_ist();
  st jsonb;
  s energy_manager.sittings;
  streak int := 0;
  probe date;
  prof energy_manager.profiles;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  perform public.em_me();
  select * into prof from energy_manager.profiles where user_id = uid;
  st := energy_manager.plan_state(uid);
  select * into s from energy_manager.sittings where user_id = uid and finished_at is null;

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

  return st || jsonb_build_object(
    'date', d,
    'exam', energy_manager.exam_for(uid),
    'settings', jsonb_build_object(
       'studyTimes', (select coalesce(jsonb_agg(to_char(t, 'HH24:MI') order by t), '[]'::jsonb)
                        from unnest(prof.study_times) t),
       'minutesPerDay', prof.minutes_per_day,
       'examDate', prof.exam_date),
    'sitting', case when s.id is null then null else jsonb_build_object(
       'id', s.id, 'kind', s.kind, 'pos', s.pos,
       'cards', (select coalesce(jsonb_agg(energy_manager.feed_card(uid, x.cid) order by x.n), '[]'::jsonb)
                   from unnest(s.cards) with ordinality as x(cid, n))) end,
    'streak', streak,
    'tough', (select jsonb_build_object(
        'becameEasy', count(*) filter (where cs.ever_tough and cardinality(cs.recent) >= 2
                                        and cs.recent[cardinality(cs.recent)] >= 3
                                        and cs.recent[cardinality(cs.recent) - 1] >= 3),
        'stillTough', count(*) filter (where (select count(*) from unnest(cs.recent) x where x <= 2) >= 2))
        from energy_manager.card_state cs where cs.user_id = uid),
    'progress', (select coalesce(jsonb_agg(jsonb_build_object(
        'paper', e.paper_id,
        'total', (select count(*) from energy_manager.cards c where c.paper_id = e.paper_id and c.active),
        'seen', (select count(*) from energy_manager.card_state cs
                   join energy_manager.cards c on c.id = cs.card_id
                  where cs.user_id = uid and c.paper_id = e.paper_id),
        'strong', (select count(*) from energy_manager.card_state cs
                   join energy_manager.cards c on c.id = cs.card_id
                  where cs.user_id = uid and c.paper_id = e.paper_id and cs.stability >= 21)
      ) order by e.paper_id), '[]'::jsonb)
      from energy_manager.enrolments e where e.user_id = uid and e.active));
end $$;

-- Open the next sitting if its time has come; returns the feed.
create or replace function public.em_start_sitting() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  st jsonb;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 42));
  st := energy_manager.plan_state(uid);
  if st->>'openSitting' is not null then return public.em_feed(); end if;
  if st->'next'->>'kind' is null then
    raise exception 'Nothing more today' using errcode = '22023';
  end if;
  if (st->'next'->>'opensAt')::timestamptz > now() + interval '1 minute' then
    raise exception 'The next sitting opens at %',
      to_char((st->'next'->>'opensAt')::timestamptz at time zone 'Asia/Kolkata', 'HH12:MI AM')
      using errcode = '22023';
  end if;
  perform energy_manager.build_sitting(uid, st->'next'->>'kind');
  return public.em_feed();
end $$;

-- Rate the current card of the open sitting and move on.
-- 1 Didn't get it, 2 Tough, 3 Understood, 4 So simple.
create or replace function public.em_rate(p_sitting bigint, p_card text, p_rating int, p_seconds int default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  d date := energy_manager.today_ist();
  s energy_manager.sittings;
  cs energy_manager.card_state;
  nx record;
  exam date;
  cap date;
  due timestamptz;
  ndays int;
  tough boolean;
  view text;
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  if p_rating is null or p_rating not between 1 and 4 then
    raise exception 'Bad rating' using errcode = '22023';
  end if;
  select * into s from energy_manager.sittings
   where id = p_sitting and user_id = uid and finished_at is null for update;
  if not found then raise exception 'This sitting is closed' using errcode = '22023'; end if;
  if s.cards[s.pos + 1] is distinct from p_card then
    -- Already rated (double tap or second tab): just report where we are.
    return jsonb_build_object('pos', s.pos, 'cards', to_jsonb(s.cards), 'finished', false);
  end if;

  select * into cs from energy_manager.card_state where user_id = uid and card_id = p_card for update;
  view := case when cs.card_id is null then 'learn' else 'recall' end;
  tough := cs.card_id is not null and (select count(*) from unnest(cs.recent) x where x <= 2) >= 2;

  select * into nx from energy_manager.fsrs_next(cs.stability, cs.difficulty, coalesce(cs.fsrs_state, 0::smallint),
                                                cs.last_reviewed_at, p_rating);
  if p_rating = 1 then
    due := now() + interval '10 minutes';
  else
    ndays := greatest(1, round(nx.days))::int;
    -- Still tough: shorten the next gap once (Tough counts as Didn't get it).
    if tough and p_rating = 2 then ndays := 1; end if;
    ndays := least(ndays, 365);
    exam := ((energy_manager.exam_for(uid))->>'date')::date;
    cap := exam - energy_manager.cfg_int('exam_cap_days');
    if d < cap and d + ndays > cap then ndays := cap - d; end if;
    due := energy_manager.ist(d + ndays, '00:00');
  end if;

  insert into energy_manager.card_state as t
    (user_id, card_id, ease, interval_days, reps, lapses, due_at, introduced_on, last_reviewed_at,
     stability, difficulty, fsrs_state, last_rating, ever_tough, recent, updated_at)
  values (uid, p_card, 2.5, coalesce(ndays, 0), case when p_rating > 1 then 1 else 0 end, 0, due, d, now(),
          nx.new_s, nx.new_d, case when p_rating = 1 then 1 else 2 end, p_rating, p_rating <= 2,
          array[p_rating]::smallint[], now())
  on conflict (user_id, card_id) do update set
    interval_days = coalesce(ndays, 0),
    reps = case when p_rating > 1 then t.reps + 1 else 0 end,
    lapses = t.lapses + case when p_rating = 1 and t.fsrs_state = 2 then 1 else 0 end,
    due_at = due, last_reviewed_at = now(),
    stability = nx.new_s, difficulty = nx.new_d,
    fsrs_state = case when p_rating = 1 then (case when t.fsrs_state = 0 then 1 else 3 end) else 2 end,
    last_rating = p_rating,
    ever_tough = t.ever_tough or p_rating <= 2,
    recent = (t.recent || p_rating::smallint)[greatest(1, cardinality(t.recent) - 1):],
    updated_at = now();

  insert into energy_manager.review_log (user_id, card_id, grade, mode, seconds, sitting_id)
  values (uid, p_card, p_rating, view, least(greatest(coalesce(p_seconds, 0), 0), 3600), s.id);

  -- "Didn't get it" returns once at the end of this sitting.
  if p_rating = 1 and not (p_card = any (s.requeued))
     and cardinality(s.requeued) < energy_manager.cfg_int('again_extra') then
    s.cards := s.cards || p_card;
    s.requeued := s.requeued || p_card;
  end if;
  s.pos := s.pos + 1;
  update energy_manager.sittings set
    cards = s.cards, requeued = s.requeued, pos = s.pos,
    finished_at = case when s.pos >= cardinality(s.cards) then now() end
   where id = s.id;

  return jsonb_build_object('pos', s.pos, 'cards', to_jsonb(s.cards),
                            'finished', s.pos >= cardinality(s.cards));
end $$;

-- Profile settings. Today's plan is remade if no sitting has started yet today.
create or replace function public.em_settings(p_exam_date date, p_study_times text[], p_minutes int)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  times time[];
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  perform public.em_me();
  select array_agg(distinct t::time order by t::time) into times from unnest(p_study_times) t where t <> '';
  if times is null or cardinality(times) not between 1 and 6 then
    raise exception 'Choose 1 to 6 study times' using errcode = '22023';
  end if;
  if p_minutes is null or p_minutes not between 5 and 480 then
    raise exception 'Minutes per day must be 5 to 480' using errcode = '22023';
  end if;
  if p_exam_date is not null and p_exam_date < energy_manager.today_ist() then
    raise exception 'The exam date is in the past' using errcode = '22023';
  end if;
  update energy_manager.profiles set
    exam_date = p_exam_date, study_times = times, minutes_per_day = p_minutes, updated_at = now()
   where user_id = uid;
  delete from energy_manager.day_plans dp
   where dp.user_id = uid and dp.day = energy_manager.today_ist()
     and not exists (select 1 from energy_manager.sittings s where s.user_id = uid and s.day = dp.day);
  return public.em_feed();
end $$;

-- Delete this learner's Energy Manager data. The Google sign-in is shared with
-- other USS apps, so the login itself is not removed here.
create or replace function public.em_delete_me() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  delete from energy_manager.review_log where user_id = uid;
  delete from energy_manager.sittings where user_id = uid;
  delete from energy_manager.day_plans where user_id = uid;
  delete from energy_manager.card_state where user_id = uid;
  delete from energy_manager.enrolments where user_id = uid;
  delete from energy_manager.profiles where user_id = uid;
  return jsonb_build_object('deleted', true);
end $$;

-- The official exam record, for the signed-out page.
create or replace function public.em_exam() returns jsonb
language sql stable security definer set search_path = '' as $$
  select energy_manager.exam_for(null)
$$;

revoke all on function
  energy_manager.cfg(text), energy_manager.cfg_int(text), energy_manager.ist(date, time),
  energy_manager.recall_p(real, timestamptz, timestamptz),
  energy_manager.fsrs_next(real, real, smallint, timestamptz, int, timestamptz),
  energy_manager.feed_card(uuid, text), energy_manager.exam_for(uuid),
  energy_manager.day_plan(uuid), energy_manager.plan_state(uuid), energy_manager.build_sitting(uuid, text)
  from public;
revoke all on function public.em_feed(), public.em_start_sitting(), public.em_rate(bigint, text, int, int),
  public.em_settings(date, text[], int), public.em_delete_me(), public.em_exam()
  from public, anon, authenticated;
grant execute on function public.em_exam() to anon, authenticated;
grant execute on function public.em_feed(), public.em_start_sitting(), public.em_rate(bigint, text, int, int),
  public.em_settings(date, text[], int), public.em_delete_me() to authenticated;
