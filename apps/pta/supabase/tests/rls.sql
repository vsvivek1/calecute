-- Row-level security assertions. Each runs as `authenticated` with a given
-- email in the JWT, inside one transaction that is rolled back.
--
--   ./tests/run.sh

begin;

create function pg_temp.as_user(email text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('email', email)::text, true);
$$;
create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if not ok then raise exception 'FAIL: %', what; end if;
  raise notice 'ok  %', what;
end $$;

set local role authenticated;

-- Parent of Aditi (5 A) and Arjun (8 B)
select pg_temp.as_user('parent@example.com');
select pg_temp.check((select count(*) from pta.students) = 2, 'parent sees only their two children');
select pg_temp.check((select count(*) from pta.attendance where student_id = '00000000-0000-4000-a000-0000000000a3') = 0, 'parent cannot see another child''s attendance');
select pg_temp.check((select count(*) from pta.homework) = 3, 'parent sees homework for both children''s classes');
select pg_temp.check((select count(*) from pta.fee_balances) = 6, 'parent sees six fee items');
select pg_temp.check((select count(*) from pta.quiz_questions) = 3, 'parent can read quiz questions');
select pg_temp.check((select count(*) from pta.quiz_answers) = 0, 'parent cannot read the answer key');
select pg_temp.check((select count(*) from pta.complaints) = 1, 'parent sees their own complaint');
select pg_temp.check((select count(*) from pta.notices) = 2, 'parent sees school and class notices');

-- Cannot mark attendance or pay fees from a phone
do $$ begin
  insert into pta.attendance (student_id, day, status) values ('00000000-0000-4000-a000-0000000000a1', current_date, 'present');
  raise exception 'FAIL: parent marked attendance';
exception when insufficient_privilege then raise notice 'ok  parent cannot mark attendance'; end $$;
do $$ begin
  insert into pta.fee_payments (fee_item_id, amount_paise, method)
  select id, 100, 'cash' from pta.fee_items limit 1;
  raise exception 'FAIL: parent recorded a payment';
exception when insufficient_privilege then raise notice 'ok  parent cannot record a payment'; end $$;

-- Quiz: graded on the server
select pg_temp.check((pta.submit_quiz('00000000-0000-4000-a000-0000000000f1', '00000000-0000-4000-a000-0000000000a1', array[0,1,0])).score = 2, 'quiz graded server-side: 2 of 3');
do $$ begin
  perform pta.submit_quiz('00000000-0000-4000-a000-0000000000f1', '00000000-0000-4000-a000-0000000000a3', array[0,0,0]);
  raise exception 'FAIL: submitted for another child';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok  cannot submit a quiz for someone else''s child';
end $$;

-- Homework acknowledgement, leave request, consent
insert into pta.homework_status (homework_id, student_id, seen_at)
select id, '00000000-0000-4000-a000-0000000000a1', now() from pta.homework where subject = 'Maths';
select pg_temp.check(true, 'parent can mark homework seen');
insert into pta.leave_requests (student_id, from_day, to_day, reason)
values ('00000000-0000-4000-a000-0000000000a1', current_date + 1, current_date + 2, 'Family wedding');
select pg_temp.check(true, 'parent can request leave');
insert into pta.event_responses (event_id, student_id, response)
select id, '00000000-0000-4000-a000-0000000000a1', 'yes' from pta.events where needs_consent;
select pg_temp.check(true, 'parent can give consent');

-- Complaint flow
insert into pta.complaints (school_id, student_id, category, subject, body)
values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-0000000000a1', 'facilities', 'Broken fan in 5 A', 'Third fan from the door.');
do $$ begin
  perform pta.set_complaint_status((select id from pta.complaints where subject = 'Broken fan in 5 A'), 'resolved');
  raise exception 'FAIL: parent resolved';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok  parent cannot mark their complaint resolved for the school';
end $$;
do $$ begin
  insert into pta.complaints (school_id, student_id, category, subject, body)
  values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-0000000000a3', 'other', 'x', 'y');
  raise exception 'FAIL: complaint about another child';
exception when insufficient_privilege then raise notice 'ok  cannot raise a complaint against another child'; end $$;

-- Other parent
select pg_temp.as_user('rasheed@example.com');
select pg_temp.check((select count(*) from pta.complaints) = 0, 'another parent cannot see someone else''s complaints');
select pg_temp.check((select count(*) from pta.homework) = 2, 'another parent sees only their class''s homework');
select pg_temp.check((select count(*) from pta.quiz_attempts) = 0, 'another parent cannot see someone else''s quiz score');

-- Stranger
select pg_temp.as_user('stranger@example.com');
select pg_temp.check((select count(*) from pta.students) = 0, 'a stranger sees no students');
select pg_temp.check((select count(*) from pta.notices) = 0, 'a stranger sees no notices');
select pg_temp.check((select count(*) from pta.schools) = 0, 'a stranger sees no schools');

-- Teacher of 5 A
select pg_temp.as_user('anitha@example.com');
select pg_temp.check((select count(*) from pta.students) = 3, 'teacher sees students of the school');
insert into pta.attendance (student_id, day, status) values ('00000000-0000-4000-a000-0000000000a1', current_date, 'present');
select pg_temp.check(true, 'teacher marks their own class');
do $$ begin
  insert into pta.attendance (student_id, day, status) values ('00000000-0000-4000-a000-0000000000a2', current_date, 'present');
  raise exception 'FAIL: teacher marked another class';
exception when insufficient_privilege then raise notice 'ok  teacher cannot mark another class'; end $$;
select pg_temp.check((select count(*) from pta.quiz_answers) = 3, 'teacher can read the answer key');
select pg_temp.check((select count(*) from pta.homework_status where seen_at is not null) = 1, 'teacher sees who has seen homework');
update pta.leave_requests set status = 'approved' where reason = 'Family wedding';
select pg_temp.check((select count(*) from pta.attendance where student_id = '00000000-0000-4000-a000-0000000000a1' and status = 'leave') >= 1, 'approved leave lands on the register');

-- Office
select pg_temp.as_user('office@example.com');
insert into pta.fee_payments (fee_item_id, amount_paise, method)
select id, 120000, 'cash' from pta.fee_items where title = 'Bus fee, October' and student_id = '00000000-0000-4000-a000-0000000000a1';
select pg_temp.check((select receipt_no from pta.fee_payments where method = 'cash') like 'R%', 'office payment gets a receipt number');
select pg_temp.check((select due_paise from pta.fee_balances where title = 'Bus fee, October' and student_id = '00000000-0000-4000-a000-0000000000a1') = 5000, 'late fee stays due after paying the base amount');
select pg_temp.check((select due_paise from pta.fee_balances where title = 'Term 1 tuition' and student_id = '00000000-0000-4000-a000-0000000000a1') = 0, 'paying before the due date never attracts the late fee');
select pg_temp.check((pta.set_complaint_status((select id from pta.complaints where subject = 'Broken fan in 5 A'), 'resolved')).status = 'resolved', 'office resolves a complaint');
do $$ begin
  perform pta.set_complaint_status((select id from pta.complaints where subject = 'Broken fan in 5 A'), 'closed');
  raise exception 'FAIL: office closed';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok  only the parent can close a complaint';
end $$;

select pg_temp.as_user('parent@example.com');
select pg_temp.check((pta.set_complaint_status((select id from pta.complaints where subject = 'Broken fan in 5 A'), 'open')).status = 'open', 'parent can reopen a complaint they disagree with');

rollback;
