-- Energy Manager course: lives in the USS Supabase project as its own schema.
-- USS's own tables (public.*) are untouched.
create schema if not exists energy_manager;
-- Nothing in this schema is reachable over the REST API directly; the app uses
-- the public.em_* functions (0002), which check auth.uid() themselves.
revoke all on schema energy_manager from public, anon, authenticated;

create table energy_manager.papers (
  id smallint primary key,
  code text not null unique,
  name text not null,
  short_name text not null
);
insert into energy_manager.papers values
 (1,'P1','General Aspects of Energy Management and Energy Audit','General Aspects'),
 (2,'P2','Energy Efficiency in Thermal Utilities','Thermal'),
 (3,'P3','Energy Efficiency in Electrical Utilities','Electrical'),
 (4,'P4','Energy Performance Assessment for Equipment and Utility Systems','Performance Assessment');

create table energy_manager.cards (
  id text primary key,
  paper_id smallint not null references energy_manager.papers(id),
  topic text not null,
  kind text not null check (kind in ('fact','problem')),
  front text not null,
  back text not null,
  explain text,
  steps jsonb,
  flash boolean not null default false,
  source text,
  order_index integer not null default 0,
  active boolean not null default true
);
create index on energy_manager.cards (paper_id, order_index);

create table energy_manager.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  new_per_paper_per_day smallint not null default 8,
  created_at timestamptz not null default now()
);

create table energy_manager.enrolments (
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id smallint not null references energy_manager.papers(id),
  enrolled_at timestamptz not null default now(),
  -- Dropping a paper turns this off rather than removing the row.
  active boolean not null default true,
  primary key (user_id, paper_id)
);

create table energy_manager.card_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null references energy_manager.cards(id) on delete cascade,
  ease real not null default 2.5,
  interval_days real not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  due_at timestamptz not null default now(),
  introduced_on date not null default (now() at time zone 'Asia/Kolkata')::date,
  last_reviewed_at timestamptz,
  primary key (user_id, card_id)
);
create index on energy_manager.card_state (user_id, due_at);

create table energy_manager.review_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null references energy_manager.cards(id) on delete cascade,
  grade smallint not null check (grade between 1 and 4),
  reviewed_at timestamptz not null default now()
);
create index on energy_manager.review_log (user_id, reviewed_at);

alter table energy_manager.papers enable row level security;
alter table energy_manager.cards enable row level security;
alter table energy_manager.profiles enable row level security;
alter table energy_manager.enrolments enable row level security;
alter table energy_manager.card_state enable row level security;
alter table energy_manager.review_log enable row level security;
