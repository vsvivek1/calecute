-- Recallio app (Flutter, Android + web): the engine runs on the device and
-- keeps its own FSRS state; these tables are the cloud copy so a learner's
-- progress follows them across devices. The web app's SM-2 tables (0001/0002)
-- are left as they are.

create table energy_manager.learners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- One row per learner and card: the device's CardProgress JSON. Card ids are
-- not foreign keys because the engine also rates its own topic-summary cards.
create table energy_manager.fsrs_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  data jsonb not null,
  updated_at timestamptz not null,
  primary key (user_id, card_id)
);
create index on energy_manager.fsrs_state (user_id, updated_at);

-- Append-only review log from the app.
create table energy_manager.study_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  rating smallint not null check (rating between 1 and 4),
  mode text not null,
  seconds integer not null default 0,
  at timestamptz not null,
  primary key (user_id, card_id, at)
);

alter table energy_manager.learners enable row level security;
alter table energy_manager.fsrs_state enable row level security;
alter table energy_manager.study_log enable row level security;

-- Push local changes and pull anything newer from other devices.
--   p_states:   [{"c": card id, "u": updated_at, ...CardProgress}]
--   p_logs:     [{"c","r","m","s","a"}]
--   p_settings: LearnerSettings JSON or null; p_settings_at its updated time
--   p_since:    the last server time this device synced at (null = everything)
create or replace function public.em_sync(
  p_states jsonb, p_logs jsonb, p_settings jsonb, p_settings_at timestamptz, p_since timestamptz)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  started timestamptz := clock_timestamp();
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  if jsonb_typeof(coalesce(p_states, '[]')) <> 'array' or jsonb_typeof(coalesce(p_logs, '[]')) <> 'array' then
    raise exception 'Bad payload' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(p_states, '[]')) > 5000 or jsonb_array_length(coalesce(p_logs, '[]')) > 5000 then
    raise exception 'Too many rows in one sync' using errcode = '22023';
  end if;

  insert into energy_manager.fsrs_state as f (user_id, card_id, data, updated_at)
  select uid, s->>'c', s, (s->>'u')::timestamptz
    from jsonb_array_elements(coalesce(p_states, '[]')) s
   where s ? 'c' and s ? 'u'
  on conflict (user_id, card_id) do update
     set data = excluded.data, updated_at = excluded.updated_at
   where f.updated_at < excluded.updated_at;

  insert into energy_manager.study_log (user_id, card_id, rating, mode, seconds, at)
  select uid, l->>'c', (l->>'r')::smallint, coalesce(l->>'m', 'recall'),
         coalesce((l->>'s')::int, 0), (l->>'a')::timestamptz
    from jsonb_array_elements(coalesce(p_logs, '[]')) l
   where l ? 'c' and l ? 'r' and l ? 'a'
  on conflict do nothing;

  if p_settings is not null then
    insert into energy_manager.learners as le (user_id, settings, updated_at)
    values (uid, p_settings, coalesce(p_settings_at, now()))
    on conflict (user_id) do update
       set settings = excluded.settings, updated_at = excluded.updated_at
     where le.updated_at < excluded.updated_at;
  end if;

  return jsonb_build_object(
    'serverTime', started,
    'states', coalesce((select jsonb_agg(f.data) from energy_manager.fsrs_state f
                         where f.user_id = uid and (p_since is null or f.updated_at > p_since - interval '5 minutes')), '[]'::jsonb),
    'settings', (select jsonb_build_object('data', le.settings, 'updatedAt', le.updated_at)
                   from energy_manager.learners le where le.user_id = uid));
end $$;

-- Delete everything this learner has in the course (in-app account deletion
-- covers the course data; deleting the sign-in itself is on the web page).
create or replace function public.em_delete_my_data() returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first' using errcode = '28000'; end if;
  delete from energy_manager.study_log where user_id = uid;
  delete from energy_manager.fsrs_state where user_id = uid;
  delete from energy_manager.learners where user_id = uid;
  delete from energy_manager.review_log where user_id = uid;
  delete from energy_manager.card_state where user_id = uid;
  delete from energy_manager.enrolments where user_id = uid;
  delete from energy_manager.profiles where user_id = uid;
end $$;

revoke all on function public.em_sync(jsonb, jsonb, jsonb, timestamptz, timestamptz),
  public.em_delete_my_data() from public, anon;
grant execute on function public.em_sync(jsonb, jsonb, jsonb, timestamptz, timestamptz),
  public.em_delete_my_data() to authenticated;
