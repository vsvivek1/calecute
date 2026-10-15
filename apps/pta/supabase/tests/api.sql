-- Calls every screen function as the role that uses it, so a broken query
-- fails here rather than on a parent's phone. Rolled back.

begin;
create function pg_temp.as_user(email text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('email', email)::text, true);
$$;
create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAIL: %', what; end if;
  raise notice 'ok  %', what;
end $$;
set local role authenticated;

\set aditi '''00000000-0000-4000-a000-0000000000a1'''
\set fathima '''00000000-0000-4000-a000-0000000000a3'''
\set c5 '''00000000-0000-4000-a000-0000000000c5'''
\set school '''00000000-0000-4000-a000-000000000001'''
\set quiz '''00000000-0000-4000-a000-0000000000f1'''

select pg_temp.as_user('parent@example.com');
select pg_temp.check(jsonb_array_length(pta.whoami() -> 'children') = 2, 'whoami lists both children');
select pg_temp.check(jsonb_array_length(pta.whoami() -> 'staff') = 0, 'a parent is not staff');
select pg_temp.check((pta.child_today(:aditi) -> 'fees' ->> 'due_paise')::bigint > 0, 'today shows fees due');
select pg_temp.check(jsonb_array_length(pta.child_today(:aditi) -> 'homework_due') = 2, 'today shows two homework items due');
select pg_temp.check((pta.child_today(:aditi) ->> 'quizzes_open')::int = 1, 'today shows an open quiz');
select pg_temp.check(pta.child_today(:fathima) is null, 'today returns nothing for another child');
select pg_temp.check(jsonb_array_length(pta.child_attendance(:aditi, (current_date - 20)) -> 'days') > 0, 'attendance month has days');
select pg_temp.check(jsonb_array_length(pta.child_fees(:aditi)) = 3, 'fees list has three items');
select pg_temp.check(jsonb_array_length(pta.child_fees(:fathima)) = 0, 'fees empty for another child');
select pg_temp.check(pta.receipt((select id from pta.fee_payments limit 1)) ->> 'receipt_no' like 'R%', 'receipt opens');
select pg_temp.check(jsonb_array_length(pta.child_homework(:aditi)) = 2, 'homework list');
select pg_temp.check(jsonb_array_length(pta.child_homework(:fathima)) = 0, 'homework empty for another child');
select pg_temp.check(jsonb_array_length(pta.child_events(:aditi)) = 3, 'events include school and class events');
select pg_temp.check(jsonb_array_length(pta.child_grades(:aditi)) = 2, 'two published exams');
select pg_temp.check((pta.child_grades(:aditi) -> 0 ->> 'class_average') is not null, 'class average shown without exposing other marks');
select pg_temp.check((select count(*) from pta.marks) = 15, 'parent still cannot read other children''s marks');
select pg_temp.check(jsonb_array_length(pta.child_resources(:aditi)) = 2, 'sample tests for the class');
select pg_temp.check(jsonb_array_length(pta.child_quizzes(:aditi)) = 1, 'quiz list');
select pg_temp.check(jsonb_array_length(pta.quiz(:quiz) -> 'questions') = 3, 'quiz has questions');
select pg_temp.check(pta.quiz(:quiz)::text not like '%correct%', 'quiz payload has no answer key');
select pg_temp.check(pta.quiz_review(:quiz, :aditi) is null, 'no review before submitting');
select pta.submit_quiz(:quiz, :aditi, array[0,0,1]);
select pg_temp.check((pta.quiz_review(:quiz, :aditi) ->> 'score')::int = 2, 'review after submitting');
select pta.set_homework_done((select id from pta.homework where subject = 'Maths'), :aditi, true);
select pg_temp.check(jsonb_array_length(pta.child_today(:aditi) -> 'homework_due') = 1, 'done homework drops off today');
select pta.mark_homework_seen(:aditi);
select pta.request_leave(:aditi, current_date + 1, current_date + 1, 'Doctor');
select pta.respond_event((select id from pta.events where needs_consent), :aditi, 'yes');
select pta.respond_event((select id from pta.events where needs_consent), :aditi, 'no');
select pg_temp.check((select response from pta.event_responses limit 1) = 'no', 'consent can be changed');
select pta.raise_complaint(:aditi, 'academic', 'Too much homework on Mondays', 'Four subjects at once.');
select pta.reply_complaint((select id from pta.complaints where subject like 'Too much%'), 'Adding detail.');
select pg_temp.check(jsonb_array_length(pta.my_complaints()) = 2, 'my complaints');
select pg_temp.check((pta.complaint((select id from pta.complaints where subject like 'Too much%')) ->> 'mine')::boolean, 'complaint thread');
select pta.read_notice((select id from pta.notices where priority = 'urgent'));
select pg_temp.check(jsonb_array_length(pta.child_today(:aditi) -> 'notices_unread') = 1, 'read notice drops off today');
select pg_temp.check(jsonb_array_length(pta.my_notices()) = 2, 'notices list');
select pg_temp.check((pta.my_notices() -> 0 ->> 'reads') is null, 'parents do not see read counts');
select pg_temp.check(pta.office_today(:school) is null, 'parent cannot open the office dashboard');
select pg_temp.check(pta.exam_average('00000000-0000-4000-a000-0000000000e3') is not null, 'parent sees the average for their child''s class');
select pg_temp.check(jsonb_array_length(pta.school_fees(:school)) = 6, 'school fee list shows only own children for a parent');

select pg_temp.as_user('anitha@example.com');
select pg_temp.check(jsonb_array_length(pta.whoami() -> 'classes') = 1, 'teacher has one class');
select pg_temp.check(jsonb_array_length(pta.class_register(:c5) -> 'students') = 2, 'register lists the class');
select pg_temp.check(jsonb_array_length(pta.class_register(:c5) -> 'leave_pending') = 1, 'register shows pending leave');
select pg_temp.check(pta.save_register(:c5, current_date, jsonb_build_array(
  jsonb_build_object('student_id', :aditi, 'status', 'present'),
  jsonb_build_object('student_id', :fathima, 'status', 'absent', 'note', 'fever'),
  jsonb_build_object('student_id', '00000000-0000-4000-a000-0000000000a2', 'status', 'absent'))) = 2,
  'register saves only students of this class');
select pta.decide_leave((select id from pta.leave_requests where reason = 'Doctor'), true);
select pg_temp.check(pta.post_homework(:c5, 'Science', 'Collect leaves', '', current_date + 2) is not null, 'post homework');
select pg_temp.check((pta.class_homework(:c5) -> -1 ->> 'seen')::int >= 0, 'homework tracker');
select pg_temp.check(pta.create_exam(:c5, 'Unit test 2', current_date) is not null, 'create exam');
select pg_temp.check(pta.save_marks((select id from pta.exams where name = 'Unit test 2'), jsonb_build_array(
  jsonb_build_object('student_id', :aditi, 'subject', 'Maths', 'score', 45, 'max_score', 50),
  jsonb_build_object('student_id', :fathima, 'subject', 'Maths', 'score', '', 'max_score', 50)), true) = 1,
  'save marks skips blanks');
select pg_temp.check(jsonb_array_length(pta.exam_sheet((select id from pta.exams where name = 'Unit test 2')) -> 'students') = 2, 'exam sheet');
select pg_temp.check(jsonb_array_length(pta.class_exams(:c5)) = 3, 'class exams');
select pg_temp.check(pta.create_quiz(:c5, 'EVS', 'Plants', current_date + 5,
  '[{"prompt":"Plants make food by?","options":["Photosynthesis","Digestion"],"correct":0}]') is not null, 'create quiz');
do $$ begin
  perform pta.create_quiz('00000000-0000-4000-a000-0000000000c5', 'EVS', 'Bad', null,
    '[{"prompt":"x","options":["a","b"],"correct":5}]');
  raise exception 'FAIL: bad answer index accepted';
exception when raise_exception then
  if sqlerrm like 'FAIL%' then raise; end if;
  raise notice 'ok  quiz rejects an answer that is not an option';
end $$;
select pg_temp.check(jsonb_array_length(pta.class_quizzes(:c5)) = 2, 'class quizzes');
select pg_temp.check(pta.post_resource(:c5, 'Maths', 'Decimals test', 'sample_test', 'https://example.com/d.pdf') is not null, 'post sample test');
select pg_temp.check(jsonb_array_length(pta.class_resources(:c5)) = 3, 'class resources');
select pg_temp.check(jsonb_array_length(pta.staff_events(:school)) = 3, 'staff events');
select pg_temp.check(pta.post_notice(:school, :c5, 'Sports kit', 'Bring it Friday', 'normal') is not null, 'teacher posts a class notice');
do $$ begin
  perform pta.post_notice('00000000-0000-4000-a000-000000000001', null, 'x', 'y', 'urgent');
  raise exception 'FAIL: teacher posted to whole school';
exception when insufficient_privilege then raise notice 'ok  teacher cannot post a whole-school notice'; end $$;
select pg_temp.check((pta.my_notices() -> 0 ->> 'reads') is not null, 'staff see read counts');

select pg_temp.as_user('office@example.com');
select pg_temp.check((pta.office_today(:school) ->> 'students')::int = 3, 'office dashboard');
select pg_temp.check(jsonb_array_length(pta.school_complaints(:school)) = 2, 'office complaints');
select pg_temp.check(jsonb_array_length(pta.school_fees(:school)) = 9, 'office fee list');
select pg_temp.check(pta.record_payment((select id from pta.fee_items where title = 'Term 2 tuition' limit 1), 1850000, 'cash', '') ->> 'receipt_no' like 'R%', 'record payment');
select pg_temp.check(pta.bill(:school, :c5, null, 'Exam fee', 30000, current_date + 20, 0) = 2, 'bill a class');
select pg_temp.check(pta.add_student(:school, :c5, 'New Child', 9, 'NEW@Example.com ', 'New Parent', 'father') is not null, 'add student');
select pg_temp.check((select email from pta.guardians where name = 'New Parent') = 'new@example.com', 'guardian email normalised');
select pg_temp.check(jsonb_array_length(pta.school_students(:school) -> 'students') = 4, 'student list');
select pg_temp.check(pta.add_class(:school, 'Grade 6 A', 'rahul@example.com') is not null, 'add class');
select pta.add_staff(:school, 'new.teacher@example.com', 'New Teacher', 'teacher');
select pg_temp.check(pta.post_event(:school, null, 'Onam celebration', '', '', now() + interval '20 days', false) is not null, 'post event');
select pg_temp.check(jsonb_array_length(pta.event_responses_for((select id from pta.events where needs_consent)) -> 'students') = 3, 'consent tracker');

select pg_temp.as_user('stranger@example.com');
select pg_temp.check(pta.exam_average('00000000-0000-4000-a000-0000000000e2') is null, 'a stranger gets no class average');

select pg_temp.as_user('new@example.com');
select pg_temp.check(jsonb_array_length(pta.whoami() -> 'children') = 1, 'a newly added parent sees their child on first sign-in');

rollback;
