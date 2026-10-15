-- Demo school for a fresh project. Replace the email addresses with real ones
-- before inviting anyone: a guardian row is what gives a parent access.
--
--   psql "$DATABASE_URL" -f apps/pta/supabase/seed.sql

insert into pta.schools (id, name, city) values
  ('00000000-0000-4000-a000-000000000001', 'Calecutech Demo School', 'Kozhikode');

insert into pta.staff (school_id, email, name, role) values
  ('00000000-0000-4000-a000-000000000001', 'office@example.com',  'School Office', 'admin'),
  ('00000000-0000-4000-a000-000000000001', 'anitha@example.com',  'Anitha K',      'teacher'),
  ('00000000-0000-4000-a000-000000000001', 'rahul@example.com',   'Rahul M',       'teacher');

insert into pta.classes (id, school_id, name, teacher_email) values
  ('00000000-0000-4000-a000-0000000000c5', '00000000-0000-4000-a000-000000000001', 'Grade 5 A', 'anitha@example.com'),
  ('00000000-0000-4000-a000-0000000000c8', '00000000-0000-4000-a000-000000000001', 'Grade 8 B', 'rahul@example.com');

insert into pta.students (id, school_id, class_id, name, roll_no) values
  ('00000000-0000-4000-a000-0000000000a1', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-0000000000c5', 'Aditi Nair',  4),
  ('00000000-0000-4000-a000-0000000000a2', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-0000000000c8', 'Arjun Nair',  11),
  ('00000000-0000-4000-a000-0000000000a3', '00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-0000000000c5', 'Fathima Rasheed', 7);

insert into pta.guardians (student_id, email, name, relation) values
  ('00000000-0000-4000-a000-0000000000a1', 'parent@example.com', 'Meera Nair', 'mother'),
  ('00000000-0000-4000-a000-0000000000a2', 'parent@example.com', 'Meera Nair', 'mother'),
  ('00000000-0000-4000-a000-0000000000a3', 'rasheed@example.com', 'Rasheed P', 'father');

insert into pta.attendance (student_id, day, status, marked_by)
select s.id, d::date,
       case when (extract(day from d)::int + s.roll_no) % 13 = 0 then 'absent'
            when (extract(day from d)::int + s.roll_no) % 17 = 0 then 'late'
            else 'present' end,
       'office@example.com'
from pta.students s,
     generate_series(current_date - 30, current_date - 1, interval '1 day') d
where extract(isodow from d) < 7;

insert into pta.fee_items (student_id, title, amount_paise, due_date, late_fee_paise)
select id, 'Term 2 tuition', 1850000, current_date + 10, 20000 from pta.students
union all
select id, 'Bus fee, October', 120000, current_date - 5, 5000 from pta.students
union all
select id, 'Term 1 tuition', 1850000, current_date - 90, 20000 from pta.students;

insert into pta.fee_payments (fee_item_id, amount_paise, method, reference, recorded_by, paid_at)
select id, amount_paise, 'upi', 'UPI-DEMO', 'office@example.com', due_date - 3 + time '11:20'
from pta.fee_items where title = 'Term 1 tuition';

insert into pta.homework (class_id, subject, title, details, due_date, created_by) values
  ('00000000-0000-4000-a000-0000000000c5', 'Maths',   'Fractions worksheet', 'Page 42, questions 1 to 10.', current_date + 1, 'anitha@example.com'),
  ('00000000-0000-4000-a000-0000000000c5', 'English', 'Read chapter 6', 'Write three new words with meanings.', current_date + 2, 'anitha@example.com'),
  ('00000000-0000-4000-a000-0000000000c8', 'Science', 'Plant cell diagram', 'Label every part. A4 sheet.', current_date + 3, 'rahul@example.com');

insert into pta.events (school_id, class_id, title, details, location, starts_at, needs_consent, fee_paise) values
  ('00000000-0000-4000-a000-000000000001', null, 'Annual sports day', 'Children report in house colours by 8:30.', 'School ground', (current_date + 12 + time '08:30') at time zone 'Asia/Kolkata', false, 0),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-0000000000c5', 'Field trip: Planetarium', 'Bus leaves 9:00, returns 3:30. Packed lunch.', 'Regional Science Centre', (current_date + 7 + time '09:00') at time zone 'Asia/Kolkata', true, 25000),
  ('00000000-0000-4000-a000-000000000001', null, 'Parent-teacher meeting', 'Meet class teachers, 10 minutes each.', 'Classrooms', (current_date + 4 + time '10:00') at time zone 'Asia/Kolkata', false, 0);

insert into pta.exams (id, class_id, name, held_on, published) values
  ('00000000-0000-4000-a000-0000000000e1', '00000000-0000-4000-a000-0000000000c5', 'Unit test 1', current_date - 40, true),
  ('00000000-0000-4000-a000-0000000000e2', '00000000-0000-4000-a000-0000000000c5', 'Mid-term',   current_date - 10, true),
  ('00000000-0000-4000-a000-0000000000e3', '00000000-0000-4000-a000-0000000000c8', 'Mid-term',   current_date - 10, true);

insert into pta.marks (exam_id, student_id, subject, score, max_score)
select e.id, s.id, sub, 28 + ((s.roll_no * 7 + length(sub) * 3 + (e.held_on - date '2000-01-01')) % 22), 50
from pta.exams e join pta.students s on s.class_id = e.class_id,
     unnest(array['Maths', 'English', 'Science', 'Malayalam', 'Social']) sub;

insert into pta.resources (class_id, subject, title, kind, url) values
  ('00000000-0000-4000-a000-0000000000c5', 'Maths', 'Fractions practice test', 'sample_test', 'https://example.com/fractions.pdf'),
  ('00000000-0000-4000-a000-0000000000c5', 'English', 'Mid-term model paper 2025', 'model_paper', 'https://example.com/english-2025.pdf'),
  ('00000000-0000-4000-a000-0000000000c8', 'Science', 'Cells: chapter notes', 'notes', 'https://example.com/cells.pdf');

insert into pta.quizzes (id, class_id, subject, title, due_date, published) values
  ('00000000-0000-4000-a000-0000000000f1', '00000000-0000-4000-a000-0000000000c5', 'Maths', 'Fractions quick check', current_date + 3, true);
insert into pta.quiz_questions (id, quiz_id, position, prompt, options) values
  ('00000000-0000-4000-a000-00000000f101', '00000000-0000-4000-a000-0000000000f1', 1, 'What is 1/2 + 1/4?', array['3/4', '2/6', '1/8', '2/4']),
  ('00000000-0000-4000-a000-00000000f102', '00000000-0000-4000-a000-0000000000f1', 2, 'Which is larger?', array['2/3', '3/5', '1/2', '4/9']),
  ('00000000-0000-4000-a000-00000000f103', '00000000-0000-4000-a000-0000000000f1', 3, 'Simplify 6/8', array['3/4', '2/3', '6/8', '1/2']);
insert into pta.quiz_answers (question_id, correct_index) values
  ('00000000-0000-4000-a000-00000000f101', 0),
  ('00000000-0000-4000-a000-00000000f102', 0),
  ('00000000-0000-4000-a000-00000000f103', 0);

insert into pta.notices (school_id, class_id, title, body, priority, created_by) values
  ('00000000-0000-4000-a000-000000000001', null, 'School closed on Friday', 'Closed for the local election. Classes resume Monday.', 'urgent', 'office@example.com'),
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-0000000000c5', 'Bring an old newspaper', 'For Thursday''s craft class.', 'normal', 'anitha@example.com');

insert into pta.complaints (school_id, student_id, category, subject, body, status, created_by, created_at) values
  ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-0000000000a1', 'transport', 'Bus arrives 20 minutes late', 'Route 4 has been late every morning this week.', 'in_progress', 'parent@example.com', now() - interval '2 days');
insert into pta.complaint_messages (complaint_id, author, body)
select id, 'office@example.com', 'We have spoken to the driver and are checking the route timing.' from pta.complaints;
