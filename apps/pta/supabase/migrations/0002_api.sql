-- The API both apps call.
--
-- The web app and the Flutter app read and write only through these
-- functions, so a screen shows the same numbers on either. Every function is
-- SECURITY INVOKER: it runs as the signed-in user and row-level security from
-- 0001 decides what it can see. A function cannot show a parent something a
-- plain select would not.
--
-- Each returns jsonb shaped for one screen, so a phone on a slow connection
-- makes one round trip per screen rather than one per table.

-- School days are counted in Indian time, not UTC: at 5 a.m. in Kozhikode it
-- is still yesterday on the server.
create function pta.today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Kolkata')::date $$;

-- ---------------------------------------------------------------------------
-- Who am I
-- ---------------------------------------------------------------------------

create function pta.whoami() returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'email', pta.me(),
    'staff', coalesce((
      select jsonb_agg(jsonb_build_object(
               'school_id', s.school_id, 'school', sc.name, 'name', s.name, 'role', s.role)
             order by sc.name)
      from pta.staff s join pta.schools sc on sc.id = s.school_id
      where s.email = pta.me()), '[]'),
    'children', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', st.id, 'name', st.name, 'roll_no', st.roll_no,
               'class_id', st.class_id, 'class', k.name,
               'school_id', st.school_id, 'school', sc.name)
             order by st.name)
      from pta.students st
      join pta.guardians g on g.student_id = st.id and g.email = pta.me()
      left join pta.classes k on k.id = st.class_id
      join pta.schools sc on sc.id = st.school_id), '[]'),
    'classes', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', k.id, 'name', k.name, 'school_id', k.school_id,
               'students', (select count(*) from pta.students where class_id = k.id))
             order by k.name)
      from pta.classes k where pta.teaches(k.id)), '[]')
  )
$$;

-- ---------------------------------------------------------------------------
-- Parent screens. Each takes the child, and RLS returns nothing for a child
-- the caller is not a guardian (or staff member) of.
-- ---------------------------------------------------------------------------

-- The one screen a parent opens every day: everything that needs them, and
-- nothing that does not.
create function pta.child_today(p_student uuid) returns jsonb
language sql stable as $$
  with st as (select * from pta.students where id = p_student),
  month_att as (
    select status from pta.attendance
    where student_id = p_student and day >= date_trunc('month', pta.today())::date
  )
  select case when not exists (select 1 from st) then null else jsonb_build_object(
    'student', (select jsonb_build_object('id', st.id, 'name', st.name, 'class',
                  (select name from pta.classes where id = st.class_id)) from st),
    'attendance_today', (select status from pta.attendance
                         where student_id = p_student and day = pta.today()),
    'attendance_month', jsonb_build_object(
      'present', (select count(*) from month_att where status in ('present', 'late')),
      'absent',  (select count(*) from month_att where status = 'absent'),
      'leave',   (select count(*) from month_att where status = 'leave'),
      'marked',  (select count(*) from month_att)),
    'homework_due', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', h.id, 'subject', h.subject, 'title', h.title, 'due_date', h.due_date,
               'done', hs.done_at is not null) order by h.due_date)
      from pta.homework h
      left join pta.homework_status hs on hs.homework_id = h.id and hs.student_id = p_student
      where h.class_id = (select class_id from st)
        and h.due_date between pta.today() and pta.today() + 7
        and hs.done_at is null), '[]'),
    'fees', (select jsonb_build_object(
               'due_paise', coalesce(sum(due_paise) filter (where due_paise > 0), 0),
               'overdue_paise', coalesce(sum(due_paise) filter (where due_paise > 0 and due_date < pta.today()), 0),
               'next_due_date', min(due_date) filter (where due_paise > 0))
             from pta.fee_balances where student_id = p_student),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', e.id, 'title', e.title, 'starts_at', e.starts_at,
               'needs_consent', e.needs_consent,
               'response', (select response from pta.event_responses
                            where event_id = e.id and student_id = p_student))
             order by e.starts_at)
      from pta.events e
      where e.school_id = (select school_id from st)
        and (e.class_id is null or e.class_id = (select class_id from st))
        and e.starts_at >= now() and e.starts_at < now() + interval '14 days'), '[]'),
    'notices_unread', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', n.id, 'title', n.title, 'priority', n.priority, 'created_at', n.created_at)
             order by n.priority desc, n.created_at desc)
      from pta.notices n
      where n.school_id = (select school_id from st)
        and (n.class_id is null or n.class_id = (select class_id from st))
        and n.created_at > now() - interval '30 days'
        and not exists (select 1 from pta.notice_reads r where r.notice_id = n.id and r.email = pta.me())), '[]'),
    'quizzes_open', (
      select count(*) from pta.quizzes q
      where q.class_id = (select class_id from st) and q.published
        and (q.due_date is null or q.due_date >= pta.today())
        and not exists (select 1 from pta.quiz_attempts a where a.quiz_id = q.id and a.student_id = p_student)),
    'latest_exam', (
      select jsonb_build_object('name', e.name, 'held_on', e.held_on,
               'percent', round(100 * sum(m.score) / nullif(sum(m.max_score), 0)))
      from pta.exams e join pta.marks m on m.exam_id = e.id and m.student_id = p_student
      where e.published
      group by e.id order by e.held_on desc limit 1),
    'complaints_open', (
      select count(*) from pta.complaints
      where student_id = p_student and status in ('open', 'in_progress', 'resolved')
        and created_by = pta.me())
  ) end
$$;

create function pta.child_attendance(p_student uuid, p_month date default null) returns jsonb
language sql stable as $$
  with bounds as (
    select date_trunc('month', coalesce(p_month, pta.today()))::date as first,
           (date_trunc('month', coalesce(p_month, pta.today())) + interval '1 month - 1 day')::date as last
  )
  select jsonb_build_object(
    'month', (select first from bounds),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('day', a.day, 'status', a.status, 'note', a.note) order by a.day)
      from pta.attendance a, bounds b
      where a.student_id = p_student and a.day between b.first and b.last), '[]'),
    'year', (
      select jsonb_build_object(
        'present', count(*) filter (where status in ('present', 'late')),
        'marked', count(*))
      from pta.attendance
      where student_id = p_student and day > pta.today() - 365),
    'leave_requests', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', id, 'from_day', from_day, 'to_day', to_day, 'reason', reason, 'status', status)
             order by from_day desc)
      from pta.leave_requests where student_id = p_student and to_day > pta.today() - 60), '[]')
  )
$$;

create function pta.child_fees(p_student uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', f.id, 'title', f.title, 'amount_paise', f.amount_paise,
           'due_date', f.due_date, 'late_fee_paise', f.late_fee_paise,
           'paid_paise', f.paid_paise, 'due_paise', f.due_paise,
           'overdue', f.due_paise > 0 and f.due_date < pta.today(),
           'payments', coalesce((
             select jsonb_agg(jsonb_build_object(
                      'id', p.id, 'receipt_no', p.receipt_no, 'amount_paise', p.amount_paise,
                      'method', p.method, 'reference', p.reference, 'paid_at', p.paid_at)
                    order by p.paid_at)
             from pta.fee_payments p where p.fee_item_id = f.id), '[]'))
         order by (f.due_paise > 0) desc, f.due_date), '[]')
  from pta.fee_balances f where f.student_id = p_student
$$;

create function pta.receipt(p_payment uuid) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'receipt_no', p.receipt_no, 'amount_paise', p.amount_paise, 'method', p.method,
    'reference', p.reference, 'paid_at', p.paid_at, 'fee', f.title,
    'student', st.name, 'class', k.name, 'school', sc.name, 'city', sc.city)
  from pta.fee_payments p
  join pta.fee_items f on f.id = p.fee_item_id
  join pta.students st on st.id = f.student_id
  left join pta.classes k on k.id = st.class_id
  join pta.schools sc on sc.id = st.school_id
  where p.id = p_payment
$$;

create function pta.child_homework(p_student uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', h.id, 'subject', h.subject, 'title', h.title, 'details', h.details,
           'link', h.link, 'due_date', h.due_date, 'created_at', h.created_at,
           'seen', hs.seen_at is not null, 'done', hs.done_at is not null)
         order by h.due_date desc, h.subject), '[]')
  from pta.homework h
  left join pta.homework_status hs on hs.homework_id = h.id and hs.student_id = p_student
  where h.class_id = pta.student_class(p_student)
    and pta.can_see_student(p_student)
    and h.due_date > pta.today() - 30
$$;

create function pta.child_events(p_student uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', e.id, 'title', e.title, 'details', e.details, 'location', e.location,
           'starts_at', e.starts_at, 'ends_at', e.ends_at, 'whole_school', e.class_id is null,
           'needs_consent', e.needs_consent, 'fee_paise', e.fee_paise,
           'response', r.response)
         order by e.starts_at), '[]')
  from pta.events e
  left join pta.event_responses r on r.event_id = e.id and r.student_id = p_student
  where pta.can_see_student(p_student)
    and e.school_id = pta.student_school(p_student)
    and (e.class_id is null or e.class_id = pta.student_class(p_student))
    and e.starts_at > now() - interval '60 days'
$$;

-- The class average reads every mark in the exam, which a parent's RLS does
-- not allow. It runs as definer and returns one number, never a row.
create function pta.exam_average(p_exam uuid) returns numeric
language sql stable security definer set search_path = '' as $$
  select round(100 * sum(m.score) / nullif(sum(m.max_score), 0))
  from pta.marks m join pta.exams e on e.id = m.exam_id
  where m.exam_id = p_exam
    and (pta.is_staff(pta.class_school(e.class_id)) or (e.published and pta.can_see_class(e.class_id)))
$$;
create function pta.child_grades(p_student uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(x order by (x ->> 'held_on') desc), '[]') from (
    select jsonb_build_object(
      'id', e.id, 'name', e.name, 'held_on', e.held_on,
      'percent', round(100 * sum(m.score) / nullif(sum(m.max_score), 0)),
      'class_average', pta.exam_average(e.id),
      'subjects', jsonb_agg(jsonb_build_object(
        'subject', m.subject, 'score', m.score, 'max_score', m.max_score, 'remark', m.remark)
        order by m.subject)) x
    from pta.exams e
    join pta.marks m on m.exam_id = e.id and m.student_id = p_student
    where e.published
    group by e.id
  ) t
$$;

create function pta.child_resources(p_student uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'subject', subject, 'title', title, 'kind', kind, 'url', url,
           'created_at', created_at) order by subject, created_at desc), '[]')
  from pta.resources where class_id = pta.student_class(p_student)
$$;

create function pta.child_quizzes(p_student uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', q.id, 'subject', q.subject, 'title', q.title, 'due_date', q.due_date,
           'questions', (select count(*) from pta.quiz_questions where quiz_id = q.id),
           'score', a.score, 'total', a.total, 'submitted_at', a.submitted_at)
         order by a.submitted_at nulls first, q.due_date), '[]')
  from pta.quizzes q
  left join pta.quiz_attempts a on a.quiz_id = q.id and a.student_id = p_student
  where q.class_id = pta.student_class(p_student) and q.published
$$;

-- Questions without answers. Used by both families and staff; staff get the
-- key separately through pta.quiz_key.
create function pta.quiz(p_quiz uuid) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'id', q.id, 'subject', q.subject, 'title', q.title, 'due_date', q.due_date,
    'published', q.published,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object('id', qq.id, 'position', qq.position,
               'prompt', qq.prompt, 'options', to_jsonb(qq.options)) order by qq.position)
      from pta.quiz_questions qq where qq.quiz_id = q.id), '[]'))
  from pta.quizzes q where q.id = p_quiz
$$;

-- After an attempt, show the parent which answers were right. The key for
-- that one quiz is released only once this child has submitted.
create function pta.quiz_review(p_quiz uuid, p_student uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when pta.can_see_student(p_student) then (
    select jsonb_build_object(
      'score', a.score, 'total', a.total, 'answers', to_jsonb(a.answers),
      'correct', (select jsonb_agg(k.correct_index order by qq.position)
                  from pta.quiz_questions qq join pta.quiz_answers k on k.question_id = qq.id
                  where qq.quiz_id = p_quiz))
    from pta.quiz_attempts a where a.quiz_id = p_quiz and a.student_id = p_student)
  end
$$;

create function pta.my_notices() returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', n.id, 'title', n.title, 'body', n.body, 'priority', n.priority,
           'class', k.name, 'created_at', n.created_at,
           'read', exists (select 1 from pta.notice_reads r where r.notice_id = n.id and r.email = pta.me()),
           'reads', case when pta.is_staff(n.school_id)
                         then (select count(*) from pta.notice_reads r where r.notice_id = n.id) end)
         order by n.created_at desc), '[]')
  from pta.notices n left join pta.classes k on k.id = n.class_id
  where n.created_at > now() - interval '90 days'
$$;

create function pta.my_complaints() returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id, 'subject', c.subject, 'category', c.category, 'status', c.status,
           'student', st.name, 'created_by', c.created_by, 'assigned_to', c.assigned_to,
           'created_at', c.created_at, 'updated_at', c.updated_at,
           'first_reply_at', c.first_reply_at, 'resolved_at', c.resolved_at,
           'messages', (select count(*) from pta.complaint_messages where complaint_id = c.id))
         order by (c.status in ('open', 'in_progress')) desc, c.updated_at desc), '[]')
  from pta.complaints c left join pta.students st on st.id = c.student_id
$$;

create function pta.complaint(p_id uuid) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'id', c.id, 'subject', c.subject, 'body', c.body, 'category', c.category,
    'status', c.status, 'student', st.name, 'created_by', c.created_by,
    'assigned_to', c.assigned_to, 'created_at', c.created_at,
    'first_reply_at', c.first_reply_at, 'resolved_at', c.resolved_at,
    'mine', c.created_by = pta.me(), 'staff', pta.is_staff(c.school_id),
    'messages', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', m.id, 'author', m.author, 'body', m.body, 'created_at', m.created_at,
               'from_school', m.author <> c.created_by) order by m.created_at)
      from pta.complaint_messages m where m.complaint_id = c.id), '[]'))
  from pta.complaints c left join pta.students st on st.id = c.student_id
  where c.id = p_id
$$;

-- ---------------------------------------------------------------------------
-- Parent actions
-- ---------------------------------------------------------------------------

create function pta.set_homework_done(p_homework uuid, p_student uuid, p_done boolean)
returns void language sql as $$
  insert into pta.homework_status (homework_id, student_id, seen_at, done_at)
  values (p_homework, p_student, now(), case when p_done then now() end)
  on conflict (homework_id, student_id) do update
    set seen_at = coalesce(pta.homework_status.seen_at, now()),
        done_at = case when p_done then coalesce(pta.homework_status.done_at, now()) end
$$;

create function pta.mark_homework_seen(p_student uuid) returns void
language sql as $$
  insert into pta.homework_status (homework_id, student_id, seen_at)
  select h.id, p_student, now() from pta.homework h
  where h.class_id = pta.student_class(p_student) and pta.is_guardian(p_student)
  on conflict (homework_id, student_id) do nothing
$$;

create function pta.request_leave(p_student uuid, p_from date, p_to date, p_reason text)
returns uuid language sql as $$
  insert into pta.leave_requests (student_id, from_day, to_day, reason)
  values (p_student, p_from, p_to, p_reason) returning id
$$;

create function pta.respond_event(p_event uuid, p_student uuid, p_response text)
returns void language sql as $$
  insert into pta.event_responses (event_id, student_id, response)
  values (p_event, p_student, p_response)
  on conflict (event_id, student_id) do update
    set response = excluded.response, responded_by = pta.me(), responded_at = now()
$$;

create function pta.raise_complaint(p_student uuid, p_category text, p_subject text, p_body text)
returns uuid language sql as $$
  insert into pta.complaints (school_id, student_id, category, subject, body)
  values (pta.student_school(p_student), p_student, p_category, p_subject, p_body)
  returning id
$$;

create function pta.reply_complaint(p_id uuid, p_body text) returns void
language sql as $$
  insert into pta.complaint_messages (complaint_id, body) values (p_id, p_body)
$$;

create function pta.read_notice(p_notice uuid) returns void
language sql as $$
  insert into pta.notice_reads (notice_id) values (p_notice) on conflict do nothing
$$;

-- ---------------------------------------------------------------------------
-- Teacher screens and actions
-- ---------------------------------------------------------------------------

-- The roll for one class on one day. Unmarked students come back as null so
-- the screen can default them to present with one tap, which is how a real
-- register is taken.
create function pta.class_register(p_class uuid, p_day date default null) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'class', (select name from pta.classes where id = p_class),
    'day', coalesce(p_day, pta.today()),
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', st.id, 'name', st.name, 'roll_no', st.roll_no,
               'status', a.status, 'note', a.note,
               'on_leave', exists (select 1 from pta.leave_requests l
                                   where l.student_id = st.id and l.status = 'approved'
                                     and coalesce(p_day, pta.today()) between l.from_day and l.to_day))
             order by st.roll_no nulls last, st.name)
      from pta.students st
      left join pta.attendance a on a.student_id = st.id and a.day = coalesce(p_day, pta.today())
      where st.class_id = p_class and pta.teaches(p_class)), '[]'),
    'leave_pending', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', l.id, 'student', st.name, 'from_day', l.from_day, 'to_day', l.to_day,
               'reason', l.reason) order by l.from_day)
      from pta.leave_requests l join pta.students st on st.id = l.student_id
      where st.class_id = p_class and l.status = 'pending' and pta.teaches(p_class)), '[]'))
$$;

-- p_entries: [{"student_id": "...", "status": "absent", "note": "..."}]
create function pta.save_register(p_class uuid, p_day date, p_entries jsonb) returns int
language sql as $$
  with rows as (
    insert into pta.attendance (student_id, day, status, note)
    select (e ->> 'student_id')::uuid, p_day, e ->> 'status', nullif(e ->> 'note', '')
    from jsonb_array_elements(p_entries) e
    join pta.students st on st.id = (e ->> 'student_id')::uuid and st.class_id = p_class
    on conflict (student_id, day) do update
      set status = excluded.status, note = excluded.note,
          marked_by = pta.me(), marked_at = now()
    returning 1)
  select count(*)::int from rows
$$;

create function pta.decide_leave(p_id uuid, p_approve boolean) returns void
language sql as $$
  update pta.leave_requests
     set status = case when p_approve then 'approved' else 'declined' end
   where id = p_id and status = 'pending'
$$;

create function pta.post_homework(p_class uuid, p_subject text, p_title text,
                                  p_details text, p_due date, p_link text default null)
returns uuid language sql as $$
  insert into pta.homework (class_id, subject, title, details, due_date, link)
  values (p_class, p_subject, p_title, nullif(p_details, ''), p_due, nullif(p_link, ''))
  returning id
$$;

-- Per homework: how many families have seen it and how many children are done.
create function pta.class_homework(p_class uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', h.id, 'subject', h.subject, 'title', h.title, 'details', h.details,
           'due_date', h.due_date, 'link', h.link,
           'students', (select count(*) from pta.students where class_id = p_class),
           'seen', (select count(*) from pta.homework_status s where s.homework_id = h.id and s.seen_at is not null),
           'done', (select count(*) from pta.homework_status s where s.homework_id = h.id and s.done_at is not null))
         order by h.due_date desc), '[]')
  from pta.homework h where h.class_id = p_class and h.due_date > pta.today() - 30
$$;

create function pta.class_exams(p_class uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', e.id, 'name', e.name, 'held_on', e.held_on, 'published', e.published,
           'average', pta.exam_average(e.id),
           'entered', (select count(distinct student_id) from pta.marks where exam_id = e.id))
         order by e.held_on desc), '[]')
  from pta.exams e where e.class_id = p_class
$$;

create function pta.create_exam(p_class uuid, p_name text, p_held_on date) returns uuid
language sql as $$
  insert into pta.exams (class_id, name, held_on) values (p_class, p_name, p_held_on) returning id
$$;

-- p_marks: [{"student_id": "...", "subject": "Maths", "score": 42, "max_score": 50}]
create function pta.save_marks(p_exam uuid, p_marks jsonb, p_publish boolean default false)
returns int language plpgsql as $$
declare n int;
begin
  insert into pta.marks (exam_id, student_id, subject, score, max_score, remark)
  select p_exam, (m ->> 'student_id')::uuid, m ->> 'subject',
         (m ->> 'score')::numeric, (m ->> 'max_score')::numeric, nullif(m ->> 'remark', '')
  from jsonb_array_elements(p_marks) m
  where m ->> 'score' is not null and m ->> 'score' <> ''
  on conflict (exam_id, student_id, subject) do update
    set score = excluded.score, max_score = excluded.max_score, remark = excluded.remark;
  get diagnostics n = row_count;
  if p_publish then update pta.exams set published = true where id = p_exam; end if;
  return n;
end $$;

create function pta.exam_sheet(p_exam uuid) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'id', e.id, 'name', e.name, 'held_on', e.held_on, 'published', e.published,
    'class', k.name,
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', st.id, 'name', st.name, 'roll_no', st.roll_no,
               'marks', coalesce((select jsonb_object_agg(m.subject, jsonb_build_object(
                                    'score', m.score, 'max_score', m.max_score))
                                  from pta.marks m where m.exam_id = e.id and m.student_id = st.id), '{}'))
             order by st.roll_no nulls last, st.name)
      from pta.students st where st.class_id = e.class_id), '[]'))
  from pta.exams e join pta.classes k on k.id = e.class_id
  where e.id = p_exam and pta.teaches(e.class_id)
$$;

-- p_questions: [{"prompt": "...", "options": ["a","b"], "correct": 0}]
create function pta.create_quiz(p_class uuid, p_subject text, p_title text, p_due date,
                                p_questions jsonb, p_publish boolean default true)
returns uuid language plpgsql as $$
declare qid uuid; q jsonb; i int := 0; qq uuid;
begin
  insert into pta.quizzes (class_id, subject, title, due_date, published)
  values (p_class, p_subject, p_title, p_due, p_publish) returning id into qid;
  for q in select * from jsonb_array_elements(p_questions) loop
    i := i + 1;
    if (q ->> 'correct')::int >= jsonb_array_length(q -> 'options') then
      raise exception 'Question %: the correct answer is not one of the options', i;
    end if;
    insert into pta.quiz_questions (quiz_id, position, prompt, options)
    values (qid, i, q ->> 'prompt', array(select jsonb_array_elements_text(q -> 'options')))
    returning id into qq;
    insert into pta.quiz_answers (question_id, correct_index) values (qq, (q ->> 'correct')::int);
  end loop;
  if i = 0 then raise exception 'A quiz needs at least one question'; end if;
  return qid;
end $$;

create function pta.class_quizzes(p_class uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', q.id, 'subject', q.subject, 'title', q.title, 'due_date', q.due_date,
           'published', q.published,
           'questions', (select count(*) from pta.quiz_questions where quiz_id = q.id),
           'attempts', (select count(*) from pta.quiz_attempts where quiz_id = q.id),
           'students', (select count(*) from pta.students where class_id = p_class),
           'average', (select round(100.0 * sum(score) / nullif(sum(total), 0))
                       from pta.quiz_attempts where quiz_id = q.id))
         order by q.created_at desc), '[]')
  from pta.quizzes q where q.class_id = p_class
$$;

create function pta.post_resource(p_class uuid, p_subject text, p_title text, p_kind text, p_url text)
returns uuid language sql as $$
  insert into pta.resources (class_id, subject, title, kind, url)
  values (p_class, p_subject, p_title, p_kind, p_url) returning id
$$;

create function pta.class_resources(p_class uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'subject', subject, 'title', title, 'kind', kind, 'url', url,
           'created_at', created_at) order by subject, created_at desc), '[]')
  from pta.resources where class_id = p_class
$$;

-- Upcoming events a staff member can see, with how many permission slips are
-- still unanswered.
create function pta.staff_events(p_school uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', e.id, 'title', e.title, 'starts_at', e.starts_at, 'class', k.name,
           'needs_consent', e.needs_consent,
           'yes', (select count(*) from pta.event_responses r where r.event_id = e.id and r.response = 'yes'),
           'no', (select count(*) from pta.event_responses r where r.event_id = e.id and r.response = 'no'),
           'students', (select count(*) from pta.students st
                        where st.school_id = e.school_id and (e.class_id is null or st.class_id = e.class_id)))
         order by e.starts_at), '[]')
  from pta.events e left join pta.classes k on k.id = e.class_id
  where e.school_id = p_school and e.starts_at > now() - interval '1 day' and pta.is_staff(p_school)
$$;

-- p_class null posts to the whole school (office only, by RLS).
create function pta.post_notice(p_school uuid, p_class uuid, p_title text, p_body text, p_priority text)
returns uuid language sql as $$
  insert into pta.notices (school_id, class_id, title, body, priority)
  values (p_school, p_class, p_title, p_body, p_priority) returning id
$$;

create function pta.post_event(p_school uuid, p_class uuid, p_title text, p_details text,
                               p_location text, p_starts timestamptz, p_needs_consent boolean,
                               p_fee_paise bigint default 0)
returns uuid language sql as $$
  insert into pta.events (school_id, class_id, title, details, location, starts_at, needs_consent, fee_paise)
  values (p_school, p_class, p_title, nullif(p_details, ''), nullif(p_location, ''), p_starts,
          p_needs_consent, coalesce(p_fee_paise, 0))
  returning id
$$;

-- Who has and has not answered a permission slip.
create function pta.event_responses_for(p_event uuid) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'title', e.title,
    'students', coalesce((
      select jsonb_agg(jsonb_build_object('name', st.name, 'class', k.name, 'response', r.response)
             order by k.name, st.roll_no)
      from pta.students st
      join pta.classes k on k.id = st.class_id
      left join pta.event_responses r on r.event_id = e.id and r.student_id = st.id
      where st.school_id = e.school_id and (e.class_id is null or st.class_id = e.class_id)
        and pta.is_staff(e.school_id)), '[]'))
  from pta.events e where e.id = p_event
$$;

-- ---------------------------------------------------------------------------
-- Office
-- ---------------------------------------------------------------------------

create function pta.office_today(p_school uuid) returns jsonb
language sql stable as $$
  select case when pta.is_staff(p_school) then jsonb_build_object(
    'school', (select name from pta.schools where id = p_school),
    'students', (select count(*) from pta.students where school_id = p_school),
    'attendance', (
      select jsonb_build_object(
        'present', count(*) filter (where a.status in ('present', 'late')),
        'absent', count(*) filter (where a.status = 'absent'),
        'leave', count(*) filter (where a.status = 'leave'),
        'marked', count(*))
      from pta.attendance a join pta.students st on st.id = a.student_id
      where st.school_id = p_school and a.day = pta.today()),
    'classes_unmarked', coalesce((
      select jsonb_agg(k.name order by k.name) from pta.classes k
      where k.school_id = p_school
        and exists (select 1 from pta.students where class_id = k.id)
        and not exists (select 1 from pta.attendance a join pta.students st on st.id = a.student_id
                        where st.class_id = k.id and a.day = pta.today())), '[]'),
    'fees', (
      select jsonb_build_object(
        'billed_paise', coalesce(sum(f.amount_paise), 0),
        'collected_paise', coalesce(sum(f.paid_paise), 0),
        'overdue_paise', coalesce(sum(f.due_paise) filter (where f.due_paise > 0 and f.due_date < pta.today()), 0),
        'overdue_families', count(distinct f.student_id) filter (where f.due_paise > 0 and f.due_date < pta.today()))
      from pta.fee_balances f join pta.students st on st.id = f.student_id
      where st.school_id = p_school),
    'complaints', (
      select jsonb_build_object(
        'open', count(*) filter (where status = 'open'),
        'in_progress', count(*) filter (where status = 'in_progress'),
        'unanswered_48h', count(*) filter (where status = 'open' and first_reply_at is null
                                           and created_at < now() - interval '48 hours'),
        'median_first_reply_hours', round((percentile_cont(0.5) within group (
            order by extract(epoch from first_reply_at - created_at) / 3600))::numeric, 1))
      from pta.complaints where school_id = p_school)
  ) end
$$;

create function pta.school_complaints(p_school uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', c.id, 'subject', c.subject, 'category', c.category, 'status', c.status,
           'student', st.name, 'class', k.name, 'created_by', c.created_by,
           'assigned_to', c.assigned_to, 'created_at', c.created_at,
           'first_reply_at', c.first_reply_at, 'updated_at', c.updated_at)
         order by case c.status when 'open' then 0 when 'in_progress' then 1 else 2 end, c.created_at), '[]')
  from pta.complaints c
  left join pta.students st on st.id = c.student_id
  left join pta.classes k on k.id = st.class_id
  where c.school_id = p_school and pta.is_staff(p_school)
$$;

create function pta.school_fees(p_school uuid) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', f.id, 'student_id', st.id, 'student', st.name, 'class', k.name,
           'title', f.title, 'amount_paise', f.amount_paise, 'due_date', f.due_date,
           'paid_paise', f.paid_paise, 'due_paise', f.due_paise,
           'overdue', f.due_paise > 0 and f.due_date < pta.today())
         order by (f.due_paise > 0) desc, f.due_date, k.name, st.name), '[]')
  from pta.fee_balances f
  join pta.students st on st.id = f.student_id
  left join pta.classes k on k.id = st.class_id
  where st.school_id = p_school
$$;

create function pta.record_payment(p_fee uuid, p_amount_paise bigint, p_method text, p_reference text)
returns jsonb language sql as $$
  insert into pta.fee_payments (fee_item_id, amount_paise, method, reference)
  values (p_fee, p_amount_paise, p_method, nullif(p_reference, ''))
  returning jsonb_build_object('id', id, 'receipt_no', receipt_no)
$$;

-- Bill a whole class (or one student) in one go.
create function pta.bill(p_school uuid, p_class uuid, p_student uuid, p_title text,
                         p_amount_paise bigint, p_due date, p_late_fee_paise bigint default 0)
returns int language sql as $$
  with rows as (
    insert into pta.fee_items (student_id, title, amount_paise, due_date, late_fee_paise)
    select id, p_title, p_amount_paise, p_due, coalesce(p_late_fee_paise, 0)
    from pta.students
    where school_id = p_school
      and (p_student is null or id = p_student)
      and (p_class is null or class_id = p_class)
    returning 1)
  select count(*)::int from rows
$$;

create function pta.school_students(p_school uuid) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'classes', coalesce((select jsonb_agg(jsonb_build_object(
                  'id', id, 'name', name, 'teacher_email', teacher_email) order by name)
                from pta.classes where school_id = p_school), '[]'),
    'students', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', st.id, 'name', st.name, 'roll_no', st.roll_no, 'class_id', st.class_id,
               'class', k.name,
               'guardians', coalesce((select jsonb_agg(jsonb_build_object(
                                        'email', g.email, 'name', g.name, 'relation', g.relation))
                                      from pta.guardians g where g.student_id = st.id), '[]'))
             order by k.name, st.roll_no nulls last, st.name)
      from pta.students st left join pta.classes k on k.id = st.class_id
      where st.school_id = p_school and pta.is_staff(p_school)), '[]'))
$$;

create function pta.add_student(p_school uuid, p_class uuid, p_name text, p_roll int,
                                p_guardian_email text, p_guardian_name text, p_relation text)
returns uuid language plpgsql as $$
declare sid uuid;
begin
  insert into pta.students (school_id, class_id, name, roll_no)
  values (p_school, p_class, p_name, p_roll) returning id into sid;
  if coalesce(p_guardian_email, '') <> '' then
    insert into pta.guardians (student_id, email, name, relation)
    values (sid, lower(trim(p_guardian_email)), nullif(p_guardian_name, ''), nullif(p_relation, ''));
  end if;
  return sid;
end $$;

create function pta.add_guardian(p_student uuid, p_email text, p_name text, p_relation text)
returns void language sql as $$
  insert into pta.guardians (student_id, email, name, relation)
  values (p_student, lower(trim(p_email)), nullif(p_name, ''), nullif(p_relation, ''))
  on conflict (student_id, email) do update set name = excluded.name, relation = excluded.relation
$$;

create function pta.add_class(p_school uuid, p_name text, p_teacher_email text) returns uuid
language sql as $$
  insert into pta.classes (school_id, name, teacher_email)
  values (p_school, p_name, nullif(lower(trim(p_teacher_email)), '')) returning id
$$;

create function pta.add_staff(p_school uuid, p_email text, p_name text, p_role text) returns void
language sql as $$
  insert into pta.staff (school_id, email, name, role)
  values (p_school, lower(trim(p_email)), p_name, p_role)
  on conflict (school_id, email) do update set name = excluded.name, role = excluded.role
$$;

grant execute on all functions in schema pta to authenticated;
