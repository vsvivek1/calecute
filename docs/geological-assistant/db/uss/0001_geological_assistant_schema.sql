-- Geological Assistant course as its own schema inside the USS Supabase project (vspbbwpehvenmxddgbhm).
-- Purely additive: creates schema geological_assistant and objects inside it. Touches nothing in
-- public, auth or any other existing schema (only foreign keys pointing at auth.users).
-- Table and column names mirror the Recallio engine so the app and edge functions only need
-- the schema name changed (supabase-js: { db: { schema: 'geological_assistant' } }).
begin;

create schema if not exists geological_assistant;

-- Content -------------------------------------------------------------------------------------

create table geological_assistant.courses (
  id text primary key,
  code text not null,
  name text not null,
  department text,
  total_marks int not null default 100,
  mock_question_count int not null default 100,
  mock_duration_minutes int not null default 75,
  negative_mark_fraction numeric(5,4) not null default 0.3333,
  default_plan_days int not null default 60,
  is_free_course boolean not null default false,
  price_minor int not null,
  price_currency text not null default 'INR',
  created_at timestamptz not null default now()
);

create table geological_assistant.modules (
  id text primary key,
  course_id text not null references geological_assistant.courses(id) on delete cascade,
  module_no int not null,
  name text not null,
  marks int not null default 20,
  unique (course_id, module_no)
);

create table geological_assistant.cards (
  id text primary key,
  course_id text not null references geological_assistant.courses(id) on delete cascade,
  module_id text not null references geological_assistant.modules(id) on delete cascade,
  subtopic text,
  statement text not null,
  statement_ml text,
  reasoning text,
  source_ref text,
  verified boolean not null default true,
  frequency smallint not null default 1,
  tier smallint not null default 2,
  order_index int not null default 0
);
create index on geological_assistant.cards (module_id, order_index);

create table geological_assistant.questions (
  id text primary key,
  course_id text not null references geological_assistant.courses(id) on delete cascade,
  paper_code text,
  stem text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  official_answer char(1) not null check (official_answer in ('a','b','c','d')),
  verified_answer char(1) check (verified_answer in ('a','b','c','d'))
);
create index on geological_assistant.questions (course_id);

create table geological_assistant.question_cards (
  question_id text not null references geological_assistant.questions(id) on delete cascade,
  card_id text not null references geological_assistant.cards(id) on delete cascade,
  primary key (question_id, card_id)
);
create index on geological_assistant.question_cards (card_id);

-- Per-user ------------------------------------------------------------------------------------

create table geological_assistant.user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  course_id text references geological_assistant.courses(id),
  free_card_limit int not null default 0,
  free_tier_unlimited boolean not null default false,
  created_at timestamptz not null default now()
);

-- Written only by the razorpay-webhook edge function (service role). current_period_end null = lifetime.
create table geological_assistant.subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references geological_assistant.courses(id),
  provider text not null default 'razorpay',
  provider_ref text unique,
  amount_minor int,
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);
create index on geological_assistant.subscriptions (user_id, course_id);

create table geological_assistant.user_card_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null references geological_assistant.cards(id) on delete cascade,
  ease real not null default 2.5,
  interval_days real not null default 0,
  reps int not null default 0,
  lapses int not null default 0,
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  primary key (user_id, card_id)
);

create table geological_assistant.quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references geological_assistant.courses(id),
  kind text not null check (kind in ('unit','mock')),
  module_id text references geological_assistant.modules(id),
  total int not null,
  correct int not null,
  wrong int not null,
  score numeric(6,2) not null,
  answers jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on geological_assistant.quiz_attempts (user_id, started_at desc);

-- Access check --------------------------------------------------------------------------------

create function geological_assistant.has_active_subscription(p_course_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from geological_assistant.subscriptions s
    where s.user_id = auth.uid() and s.course_id = p_course_id and s.status = 'active'
      and (s.current_period_end is null or s.current_period_end > now())
  ) or exists (
    select 1 from geological_assistant.courses c where c.id = p_course_id and c.is_free_course
  );
$$;

-- RLS: content readable only by paying users; course + unit list public for the shop page. --------

alter table geological_assistant.courses enable row level security;
alter table geological_assistant.modules enable row level security;
alter table geological_assistant.cards enable row level security;
alter table geological_assistant.questions enable row level security;
alter table geological_assistant.question_cards enable row level security;
alter table geological_assistant.user_profile enable row level security;
alter table geological_assistant.subscriptions enable row level security;
alter table geological_assistant.user_card_state enable row level security;
alter table geological_assistant.quiz_attempts enable row level security;

create policy courses_read on geological_assistant.courses for select to anon, authenticated using (true);
create policy modules_read on geological_assistant.modules for select to anon, authenticated using (true);
create policy cards_read on geological_assistant.cards for select to authenticated
  using (geological_assistant.has_active_subscription(course_id));
create policy questions_read on geological_assistant.questions for select to authenticated
  using (geological_assistant.has_active_subscription(course_id));
create policy question_cards_read on geological_assistant.question_cards for select to authenticated
  using (exists (select 1 from geological_assistant.questions q where q.id = question_id
                 and geological_assistant.has_active_subscription(q.course_id)));

create policy profile_own_read on geological_assistant.user_profile for select to authenticated
  using (user_id = (select auth.uid()));
create policy profile_own_insert on geological_assistant.user_profile for insert to authenticated
  with check (user_id = (select auth.uid()) and free_card_limit = 0 and not free_tier_unlimited);
create policy subs_own_read on geological_assistant.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
create policy ucs_own_all on geological_assistant.user_card_state for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy attempts_own_all on geological_assistant.quiz_attempts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Grants (RLS still applies to anon/authenticated). ---------------------------------------------

grant usage on schema geological_assistant to anon, authenticated, service_role;
grant select on all tables in schema geological_assistant to anon, authenticated;
grant insert on geological_assistant.user_profile to authenticated;
grant insert, update, delete on geological_assistant.user_card_state, geological_assistant.quiz_attempts to authenticated;
grant all on all tables in schema geological_assistant to service_role;
grant usage on all sequences in schema geological_assistant to authenticated, service_role;
grant execute on function geological_assistant.has_active_subscription(text) to anon, authenticated, service_role;

-- Course row + units -----------------------------------------------------------------------------

insert into geological_assistant.courses (
  id, code, name, department, total_marks, mock_question_count, mock_duration_minutes,
  negative_mark_fraction, default_plan_days, is_free_course, price_minor, price_currency
) values (
  'geological-assistant', '46/2011', 'Geological Assistant',
  'Ground Water Department, Kerala', 100, 100, 75, 0.3333, 60, false, 300000, 'INR'
) on conflict (id) do update set
  name = excluded.name, price_minor = excluded.price_minor, price_currency = excluded.price_currency;

commit;
