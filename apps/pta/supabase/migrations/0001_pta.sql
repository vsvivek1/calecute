-- Calecutech PTA: the shared backend for the web app and the Flutter app.
--
-- Everything lives in its own `pta` schema so it can share a Supabase project
-- with other Calecutech products. Add `pta` to Settings → API → Exposed
-- schemas, or neither app can reach it.
--
-- Identity is the signed-in email. A school office adds a student with the
-- guardians' email addresses; a parent who signs in with one of those
-- addresses sees that child and nothing else. Nobody self-registers into a
-- school, so there is no join code to leak.
--
-- Authorisation lives here, in row-level security. The apps draw what the
-- database returns; a modified client changes what it draws, not what it gets.

create schema if not exists pta;
grant usage on schema pta to authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table pta.schools (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  created_at  timestamptz not null default now()
);

-- Office staff and teachers. An admin can do everything in their school; a
-- teacher acts on the classes they are assigned to.
create table pta.staff (
  school_id   uuid not null references pta.schools on delete cascade,
  email       text not null check (email = lower(email)),
  name        text not null,
  role        text not null check (role in ('admin', 'teacher')),
  primary key (school_id, email)
);

create table pta.classes (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references pta.schools on delete cascade,
  name           text not null,                       -- "Grade 5 A"
  teacher_email  text check (teacher_email = lower(teacher_email)),
  unique (school_id, name)
);

create table pta.students (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references pta.schools on delete cascade,
  class_id    uuid references pta.classes on delete set null,
  name        text not null,
  roll_no     int,
  dob         date,
  created_at  timestamptz not null default now()
);
create index on pta.students (class_id);

create table pta.guardians (
  student_id  uuid not null references pta.students on delete cascade,
  email       text not null check (email = lower(email)),
  name        text,
  relation    text,                                   -- mother, father, guardian
  phone       text,
  primary key (student_id, email)
);
create index on pta.guardians (email);

-- One row per student per school day. Absence of a row means "not marked yet",
-- which the apps show as such rather than guessing present.
create table pta.attendance (
  student_id  uuid not null references pta.students on delete cascade,
  day         date not null,
  status      text not null check (status in ('present', 'absent', 'late', 'leave')),
  note        text,
  marked_by   text not null default lower(auth.jwt() ->> 'email'),
  marked_at   timestamptz not null default now(),
  primary key (student_id, day)
);

-- A parent tells the school in advance. Approval turns those days into
-- `leave` on the register.
create table pta.leave_requests (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references pta.students on delete cascade,
  from_day    date not null,
  to_day      date not null check (to_day >= from_day),
  reason      text not null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_by  text not null default lower(auth.jwt() ->> 'email'),
  created_at  timestamptz not null default now(),
  decided_by  text,
  decided_at  timestamptz
);

-- Money is integer paise everywhere.
create table pta.fee_items (
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references pta.students on delete cascade,
  title           text not null,                     -- "Term 2 tuition"
  amount_paise    bigint not null check (amount_paise > 0),
  due_date        date not null,
  late_fee_paise  bigint not null default 0 check (late_fee_paise >= 0),
  created_at      timestamptz not null default now()
);
create index on pta.fee_items (student_id);

-- Every payment gets a receipt number at insert time, so "where is my
-- receipt" always has an answer.
create sequence pta.receipt_seq start 1001;
create table pta.fee_payments (
  id            uuid primary key default gen_random_uuid(),
  fee_item_id   uuid not null references pta.fee_items on delete restrict,
  amount_paise  bigint not null check (amount_paise > 0),
  method        text not null check (method in ('cash', 'upi', 'card', 'bank', 'online')),
  reference     text,
  receipt_no    text not null unique default 'R' || nextval('pta.receipt_seq'),
  paid_at       timestamptz not null default now(),
  recorded_by   text not null default lower(auth.jwt() ->> 'email')
);
create index on pta.fee_payments (fee_item_id);

create table pta.homework (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references pta.classes on delete cascade,
  subject     text not null,
  title       text not null,
  details     text,
  link        text,
  due_date    date not null,
  created_by  text not null default lower(auth.jwt() ->> 'email'),
  created_at  timestamptz not null default now()
);
create index on pta.homework (class_id, due_date);

-- The teacher sees who has seen the homework and who has finished it, which
-- is the question no notice board answers.
create table pta.homework_status (
  homework_id  uuid not null references pta.homework on delete cascade,
  student_id   uuid not null references pta.students on delete cascade,
  seen_at      timestamptz,
  done_at      timestamptz,
  primary key (homework_id, student_id)
);

-- Events and activities. `class_id` null means the whole school.
create table pta.events (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references pta.schools on delete cascade,
  class_id        uuid references pta.classes on delete cascade,
  title           text not null,
  details         text,
  location        text,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  needs_consent   boolean not null default false,  -- permission slip
  fee_paise       bigint not null default 0 check (fee_paise >= 0),
  created_at      timestamptz not null default now()
);

create table pta.event_responses (
  event_id      uuid not null references pta.events on delete cascade,
  student_id    uuid not null references pta.students on delete cascade,
  response      text not null check (response in ('yes', 'no')),
  responded_by  text not null default lower(auth.jwt() ->> 'email'),
  responded_at  timestamptz not null default now(),
  primary key (event_id, student_id)
);

create table pta.exams (
  id        uuid primary key default gen_random_uuid(),
  class_id  uuid not null references pta.classes on delete cascade,
  name      text not null,                           -- "Mid-term"
  held_on   date not null,
  published boolean not null default false           -- parents see it once published
);

create table pta.marks (
  exam_id     uuid not null references pta.exams on delete cascade,
  student_id  uuid not null references pta.students on delete cascade,
  subject     text not null,
  score       numeric(6,2) not null check (score >= 0),
  max_score   numeric(6,2) not null check (max_score > 0),
  remark      text,
  primary key (exam_id, student_id, subject),
  check (score <= max_score)
);

-- Complaints are tickets, not messages. They have an owner, a status and a
-- history, and only the parent who raised one can mark it resolved.
create table pta.complaints (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references pta.schools on delete cascade,
  student_id      uuid references pta.students on delete set null,
  category        text not null check (category in ('academic', 'transport', 'fees', 'facilities', 'safety', 'bullying', 'staff', 'other')),
  subject         text not null,
  body            text not null,
  status          text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_by      text not null default lower(auth.jwt() ->> 'email'),
  assigned_to     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  first_reply_at  timestamptz,
  resolved_at     timestamptz
);
create index on pta.complaints (school_id, status);

create table pta.complaint_messages (
  id            uuid primary key default gen_random_uuid(),
  complaint_id  uuid not null references pta.complaints on delete cascade,
  author        text not null default lower(auth.jwt() ->> 'email'),
  body          text not null,
  created_at    timestamptz not null default now()
);

-- Sample tests, model papers and notes.
create table pta.resources (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references pta.classes on delete cascade,
  subject     text not null,
  title       text not null,
  kind        text not null default 'sample_test' check (kind in ('sample_test', 'model_paper', 'notes')),
  url         text not null,
  created_at  timestamptz not null default now()
);

create table pta.quizzes (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references pta.classes on delete cascade,
  subject     text not null,
  title       text not null,
  due_date    date,
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Questions are readable by families; answers are not. They live in a
-- separate table only staff can read, and grading happens inside
-- `pta.submit_quiz`, so the answer key never reaches a phone.
create table pta.quiz_questions (
  id        uuid primary key default gen_random_uuid(),
  quiz_id   uuid not null references pta.quizzes on delete cascade,
  position  int not null,
  prompt    text not null,
  options   text[] not null check (cardinality(options) between 2 and 6),
  unique (quiz_id, position)
);

create table pta.quiz_answers (
  question_id    uuid primary key references pta.quiz_questions on delete cascade,
  correct_index  int not null check (correct_index >= 0)
);

create table pta.quiz_attempts (
  quiz_id       uuid not null references pta.quizzes on delete cascade,
  student_id    uuid not null references pta.students on delete cascade,
  answers       int[] not null,
  score         int not null,
  total         int not null,
  submitted_at  timestamptz not null default now(),
  primary key (quiz_id, student_id)                  -- one attempt per child
);

-- Notices. `urgent` is the only level that should interrupt a parent; the
-- apps fold everything else into the daily digest.
create table pta.notices (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references pta.schools on delete cascade,
  class_id    uuid references pta.classes on delete cascade,
  title       text not null,
  body        text not null,
  priority    text not null default 'normal' check (priority in ('normal', 'urgent')),
  created_by  text not null default lower(auth.jwt() ->> 'email'),
  created_at  timestamptz not null default now()
);

create table pta.notice_reads (
  notice_id  uuid not null references pta.notices on delete cascade,
  email      text not null default lower(auth.jwt() ->> 'email'),
  read_at    timestamptz not null default now(),
  primary key (notice_id, email)
);

-- ---------------------------------------------------------------------------
-- Who is asking
-- ---------------------------------------------------------------------------
-- Security definer so the policies below can consult staff and guardian rows
-- without recursing into those tables' own policies.

create function pta.me() returns text
language sql stable as $$ select lower(auth.jwt() ->> 'email') $$;

create function pta.is_admin(s uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from pta.staff
                 where school_id = s and email = pta.me() and role = 'admin')
$$;

create function pta.is_staff(s uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from pta.staff where school_id = s and email = pta.me())
$$;

-- Admins act on every class; teachers on the classes they are assigned.
create function pta.teaches(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from pta.classes k
    where k.id = c
      and (k.teacher_email = pta.me() or pta.is_admin(k.school_id))
  )
$$;

create function pta.is_guardian(st uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from pta.guardians where student_id = st and email = pta.me())
$$;

create function pta.student_school(st uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from pta.students where id = st
$$;

create function pta.student_class(st uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select class_id from pta.students where id = st
$$;

-- Teacher of the child's class, or the school office.
create function pta.teaches_student(st uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select pta.teaches(pta.student_class(st)) or pta.is_admin(pta.student_school(st))
$$;

create function pta.can_see_student(st uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select pta.is_guardian(st) or pta.is_staff(pta.student_school(st))
$$;

create function pta.class_school(c uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select school_id from pta.classes where id = c
$$;

-- Staff of the school, or the parent of a child in the class.
create function pta.can_see_class(c uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select pta.is_staff(pta.class_school(c))
      or exists (select 1 from pta.students st
                 join pta.guardians g on g.student_id = st.id
                 where st.class_id = c and g.email = pta.me())
$$;

create function pta.in_school(s uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select pta.is_staff(s)
      or exists (select 1 from pta.students st
                 join pta.guardians g on g.student_id = st.id
                 where st.school_id = s and g.email = pta.me())
$$;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'schools','staff','classes','students','guardians','attendance',
    'leave_requests','fee_items','fee_payments','homework','homework_status',
    'events','event_responses','exams','marks','complaints',
    'complaint_messages','resources','quizzes','quiz_questions',
    'quiz_answers','quiz_attempts','notices','notice_reads'
  ] loop
    execute format('alter table pta.%I enable row level security', t);
    execute format('grant select, insert, update, delete on pta.%I to authenticated', t);
  end loop;
end $$;
grant usage on sequence pta.receipt_seq to authenticated;

create policy read on pta.schools for select using (pta.in_school(id));
create policy admin on pta.schools for update using (pta.is_admin(id));

create policy read on pta.staff for select using (pta.in_school(school_id));
create policy admin on pta.staff for all
  using (pta.is_admin(school_id)) with check (pta.is_admin(school_id));

create policy read on pta.classes for select using (pta.can_see_class(id));
create policy admin on pta.classes for all
  using (pta.is_admin(school_id)) with check (pta.is_admin(school_id));

create policy read on pta.students for select using (pta.can_see_student(id));
create policy admin on pta.students for all
  using (pta.is_admin(school_id)) with check (pta.is_admin(school_id));

-- A parent sees the other guardians of their own child (so both parents know
-- who else is receiving messages), and staff see all of them.
create policy read on pta.guardians for select using (pta.can_see_student(student_id));
create policy admin on pta.guardians for all
  using (pta.is_admin(pta.student_school(student_id)))
  with check (pta.is_admin(pta.student_school(student_id)));

create policy read on pta.attendance for select using (pta.can_see_student(student_id));
create policy mark on pta.attendance for all
  using (pta.teaches_student(student_id)) with check (pta.teaches_student(student_id));

create policy read on pta.leave_requests for select using (pta.can_see_student(student_id));
create policy ask on pta.leave_requests for insert
  with check (pta.is_guardian(student_id) and status = 'pending' and created_by = pta.me());
create policy decide on pta.leave_requests for update
  using (pta.teaches_student(student_id)) with check (pta.teaches_student(student_id));

-- Fees: only the office writes. Online payments arrive through a verified
-- payment webhook with the service role, never from a parent's device.
create policy read on pta.fee_items for select using (pta.can_see_student(student_id));
create policy admin on pta.fee_items for all
  using (pta.is_admin(pta.student_school(student_id)))
  with check (pta.is_admin(pta.student_school(student_id)));

create policy read on pta.fee_payments for select using (
  exists (select 1 from pta.fee_items f where f.id = fee_item_id and pta.can_see_student(f.student_id)));
create policy admin on pta.fee_payments for insert with check (
  exists (select 1 from pta.fee_items f where f.id = fee_item_id
          and pta.is_admin(pta.student_school(f.student_id))));

create policy read on pta.homework for select using (pta.can_see_class(class_id));
create policy teach on pta.homework for all
  using (pta.teaches(class_id)) with check (pta.teaches(class_id));

create policy read on pta.homework_status for select using (pta.can_see_student(student_id));
create policy parent on pta.homework_status for insert with check (pta.is_guardian(student_id));
create policy parent_update on pta.homework_status for update
  using (pta.is_guardian(student_id)) with check (pta.is_guardian(student_id));

create policy read on pta.events for select using (
  case when class_id is null then pta.in_school(school_id) else pta.can_see_class(class_id) end);
create policy admin on pta.events for all
  using (pta.is_admin(school_id) or (class_id is not null and pta.teaches(class_id)))
  with check (pta.is_admin(school_id) or (class_id is not null and pta.teaches(class_id)));

create policy read on pta.event_responses for select using (pta.can_see_student(student_id));
create policy parent on pta.event_responses for insert
  with check (pta.is_guardian(student_id) and responded_by = pta.me());
create policy parent_update on pta.event_responses for update
  using (pta.is_guardian(student_id)) with check (pta.is_guardian(student_id) and responded_by = pta.me());

-- Unpublished exams stay with staff while marks are being entered.
create policy read on pta.exams for select using (
  pta.is_staff(pta.class_school(class_id)) or (published and pta.can_see_class(class_id)));
create policy teach on pta.exams for all
  using (pta.teaches(class_id)) with check (pta.teaches(class_id));

create policy read on pta.marks for select using (
  exists (select 1 from pta.exams e where e.id = exam_id
          and (pta.is_staff(pta.class_school(e.class_id))
               or (e.published and pta.is_guardian(student_id)))));
create policy teach on pta.marks for all
  using (exists (select 1 from pta.exams e where e.id = exam_id and pta.teaches(e.class_id)))
  with check (exists (select 1 from pta.exams e where e.id = exam_id and pta.teaches(e.class_id)));

create policy read on pta.complaints for select using (
  created_by = pta.me() or pta.is_staff(school_id));
create policy raise on pta.complaints for insert with check (
  created_by = pta.me() and status = 'open'
  and (case when student_id is null then pta.in_school(school_id)
            else pta.is_guardian(student_id) and pta.student_school(student_id) = school_id end));
-- Status changes go through pta.set_complaint_status so the rules about who
-- may resolve what are in one place.
create policy staff on pta.complaints for update
  using (pta.is_admin(school_id)) with check (pta.is_admin(school_id));

create policy read on pta.complaint_messages for select using (
  exists (select 1 from pta.complaints c where c.id = complaint_id
          and (c.created_by = pta.me() or pta.is_staff(c.school_id))));
create policy write on pta.complaint_messages for insert with check (
  author = pta.me() and exists (select 1 from pta.complaints c where c.id = complaint_id
          and (c.created_by = pta.me() or pta.is_staff(c.school_id))));

create policy read on pta.resources for select using (pta.can_see_class(class_id));
create policy teach on pta.resources for all
  using (pta.teaches(class_id)) with check (pta.teaches(class_id));

create policy read on pta.quizzes for select using (
  pta.is_staff(pta.class_school(class_id)) or (published and pta.can_see_class(class_id)));
create policy teach on pta.quizzes for all
  using (pta.teaches(class_id)) with check (pta.teaches(class_id));

create policy read on pta.quiz_questions for select using (
  exists (select 1 from pta.quizzes q where q.id = quiz_id
          and (pta.is_staff(pta.class_school(q.class_id)) or (q.published and pta.can_see_class(q.class_id)))));
create policy teach on pta.quiz_questions for all
  using (exists (select 1 from pta.quizzes q where q.id = quiz_id and pta.teaches(q.class_id)))
  with check (exists (select 1 from pta.quizzes q where q.id = quiz_id and pta.teaches(q.class_id)));

create policy teach on pta.quiz_answers for all
  using (exists (select 1 from pta.quiz_questions qq join pta.quizzes q on q.id = qq.quiz_id
                 where qq.id = question_id and pta.teaches(q.class_id)))
  with check (exists (select 1 from pta.quiz_questions qq join pta.quizzes q on q.id = qq.quiz_id
                 where qq.id = question_id and pta.teaches(q.class_id)));

-- Attempts are written only by pta.submit_quiz.
create policy read on pta.quiz_attempts for select using (pta.can_see_student(student_id));

create policy read on pta.notices for select using (
  case when class_id is null then pta.in_school(school_id) else pta.can_see_class(class_id) end);
create policy post on pta.notices for all
  using (pta.is_admin(school_id) or (class_id is not null and pta.teaches(class_id)))
  with check (pta.is_admin(school_id) or (class_id is not null and pta.teaches(class_id)));

create policy own on pta.notice_reads for insert with check (email = pta.me());
create policy read on pta.notice_reads for select using (
  email = pta.me() or exists (select 1 from pta.notices n where n.id = notice_id and pta.is_staff(n.school_id)));

-- ---------------------------------------------------------------------------
-- Functions the apps call
-- ---------------------------------------------------------------------------

-- Grades a quiz without ever sending the answer key to the device.
create function pta.submit_quiz(p_quiz uuid, p_student uuid, p_answers int[])
returns pta.quiz_attempts
language plpgsql security definer set search_path = '' as $$
declare
  q pta.quizzes;
  n int;
  right_count int;
  result pta.quiz_attempts;
begin
  select * into q from pta.quizzes where id = p_quiz;
  if q.id is null or not q.published then raise exception 'Quiz not available'; end if;
  if not pta.is_guardian(p_student) then raise exception 'Not your child'; end if;
  if pta.student_class(p_student) is distinct from q.class_id then
    raise exception 'Quiz is for another class';
  end if;

  select count(*) into n from pta.quiz_questions where quiz_id = p_quiz;
  if cardinality(p_answers) <> n then
    raise exception 'Expected % answers, got %', n, cardinality(p_answers);
  end if;

  select count(*) into right_count
  from pta.quiz_questions qq
  join pta.quiz_answers a on a.question_id = qq.id
  where qq.quiz_id = p_quiz and p_answers[qq.position] = a.correct_index;

  insert into pta.quiz_attempts (quiz_id, student_id, answers, score, total)
  values (p_quiz, p_student, p_answers, right_count, n)
  returning * into result;
  return result;
end $$;

-- The parent who raised a complaint can resolve, close or reopen it; staff can
-- move it along but cannot close it on the parent's behalf. A complaint the
-- school "resolved" that the parent disagrees with goes back to open.
create function pta.set_complaint_status(p_id uuid, p_status text)
returns pta.complaints
language plpgsql security definer set search_path = '' as $$
declare
  c pta.complaints;
  owner boolean;
  staff boolean;
begin
  select * into c from pta.complaints where id = p_id;
  if c.id is null then raise exception 'No such complaint'; end if;
  owner := c.created_by = pta.me();
  staff := pta.is_staff(c.school_id);

  if p_status = 'closed' and not owner then
    raise exception 'Only the person who raised it can close a complaint';
  elsif p_status in ('in_progress', 'resolved') and not staff then
    raise exception 'Only school staff can change this status';
  elsif p_status = 'open' and not (owner or staff) then
    raise exception 'Not your complaint';
  elsif p_status not in ('open', 'in_progress', 'resolved', 'closed') then
    raise exception 'Unknown status %', p_status;
  end if;

  update pta.complaints
     set status = p_status,
         updated_at = now(),
         assigned_to = case when staff and assigned_to is null then pta.me() else assigned_to end,
         resolved_at = case when p_status in ('resolved', 'closed') then now() else null end
   where id = p_id
  returning * into c;
  return c;
end $$;

-- The first staff reply starts the clock that the office dashboard reports.
create function pta.on_complaint_message() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update pta.complaints
     set updated_at = now(),
         first_reply_at = coalesce(first_reply_at,
           case when pta.is_staff(school_id) and new.author <> created_by then now() end)
   where id = new.complaint_id;
  return new;
end $$;
create trigger complaint_message after insert on pta.complaint_messages
  for each row execute function pta.on_complaint_message();

-- Approving a leave request writes `leave` onto the register for each school
-- day it covers, without overwriting a day already marked.
create function pta.on_leave_decided() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'approved' and old.status <> 'approved' then
    insert into pta.attendance (student_id, day, status, note, marked_by)
    select new.student_id, d::date, 'leave', new.reason, pta.me()
    from generate_series(new.from_day, new.to_day, interval '1 day') d
    where extract(isodow from d) < 7
    on conflict (student_id, day) do nothing;
  end if;
  new.decided_by := pta.me();
  new.decided_at := now();
  return new;
end $$;
create trigger leave_decided before update of status on pta.leave_requests
  for each row execute function pta.on_leave_decided();

-- Fee balance per item, so every client computes "due" the same way.
create view pta.fee_balances with (security_invoker = true) as
-- The late fee applies once the due date has passed without the base amount
-- having been paid by then; paying on time never attracts it.
select f.*,
       coalesce(sum(p.amount_paise), 0)::bigint as paid_paise,
       (f.amount_paise
        + case when current_date > f.due_date
                and coalesce(sum(p.amount_paise) filter (where p.paid_at::date <= f.due_date), 0) < f.amount_paise
               then f.late_fee_paise else 0 end
        - coalesce(sum(p.amount_paise), 0))::bigint as due_paise
from pta.fee_items f
left join pta.fee_payments p on p.fee_item_id = f.id
group by f.id;
grant select on pta.fee_balances to authenticated;

grant execute on all functions in schema pta to authenticated;
