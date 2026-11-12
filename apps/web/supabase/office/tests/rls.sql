-- Access-rule tests for the office module. Run after the migrations, as the
-- database owner (Supabase SQL editor, or psql as postgres). Everything runs
-- inside one transaction that is rolled back, so it leaves no data behind.
-- A failure stops with "FAIL: ..."; success ends with the row 'all passed'.

begin;

create function pg_temp.as_user(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims',
    json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;

create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAIL: %', what; end if;
end $$;

-- Runs `stmt` and passes only if it fails with SQLSTATE `code`.
create function pg_temp.refused(stmt text, code text, what text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAIL: % (statement succeeded)', what;
exception when others then
  if sqlerrm like 'FAIL:%' then raise; end if;
  if sqlstate <> code then
    raise exception 'FAIL: % (got % %, wanted %)', what, sqlstate, sqlerrm, code;
  end if;
end $$;

grant execute on function pg_temp.as_user(uuid), pg_temp.check(boolean, text),
  pg_temp.refused(text, text, text) to authenticated, anon;

-- ------------------------------------------------------------- fixtures
-- a1 admin, m1 manager, e1/e2 employees, d1 deactivated, s1 signed up but
-- not staff. Ids are fixed so the statements below can name them.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-admin@office.test'),
  ('00000000-0000-4000-8000-0000000000b1', 'test-manager@office.test'),
  ('00000000-0000-4000-8000-0000000000c1', 'test-emp1@office.test'),
  ('00000000-0000-4000-8000-0000000000c2', 'test-emp2@office.test'),
  ('00000000-0000-4000-8000-0000000000d1', 'test-gone@office.test'),
  ('00000000-0000-4000-8000-0000000000e1', 'test-stranger@office.test');

insert into public.office_people (id, full_name, email, role, active) values
  ('00000000-0000-4000-8000-0000000000a1', 'Test Admin', 'test-admin@office.test', 'admin', true),
  ('00000000-0000-4000-8000-0000000000b1', 'Test Manager', 'test-manager@office.test', 'manager', true),
  ('00000000-0000-4000-8000-0000000000c1', 'Test Emp One', 'test-emp1@office.test', 'employee', true),
  ('00000000-0000-4000-8000-0000000000c2', 'Test Emp Two', 'test-emp2@office.test', 'employee', true),
  ('00000000-0000-4000-8000-0000000000d1', 'Test Gone', 'test-gone@office.test', 'employee', true);

insert into public.office_tasks (id, title, assignee_id, due_date) values
  ('00000000-0000-4000-9000-000000000001', 'T1 for emp1', '00000000-0000-4000-8000-0000000000c1', current_date + 3),
  ('00000000-0000-4000-9000-000000000002', 'T2 for emp2', '00000000-0000-4000-8000-0000000000c2', current_date + 3),
  ('00000000-0000-4000-9000-000000000003', 'T3 for gone', '00000000-0000-4000-8000-0000000000d1', current_date + 3);

insert into public.office_task_steps (task_id, author_id, done_on, note) values
  ('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-8000-0000000000c2', current_date - 1, 'emp2 step');
insert into public.office_task_contacts (task_id, added_by, name) values
  ('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-8000-0000000000c2', 'emp2 contact');
insert into public.office_task_bottlenecks (task_id, author_id, description) values
  ('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-8000-0000000000c2', 'emp2 blocker');

select pg_temp.check((select status from public.office_tasks where id = '00000000-0000-4000-9000-000000000002') = 'blocked',
  'an open bottleneck marks the task blocked');

update public.office_people set active = false where id = '00000000-0000-4000-8000-0000000000d1';

select pg_temp.refused($$update public.office_people set role = 'employee'
  where id = '00000000-0000-4000-8000-0000000000a1'$$, '23514', 'the last admin cannot be demoted');

-- ------------------------------------------------------------- nobody
set local role anon;
select pg_temp.refused('select 1 from public.office_tasks', '42501', 'anon cannot read tasks');
select pg_temp.refused('select 1 from public.office_people', '42501', 'anon cannot read people');
reset role;

-- A stranger who signed up through the public endpoint.
set local role authenticated;
select pg_temp.as_user('00000000-0000-4000-8000-0000000000e1');
select pg_temp.check((select count(*) from public.office_people) = 0, 'stranger reads no people');
select pg_temp.check((select count(*) from public.office_tasks) = 0, 'stranger reads no tasks');
select pg_temp.check((select count(*) from public.office_settings) = 0, 'stranger reads no settings');
select pg_temp.check((select count(*) from public.office_task_steps) = 0, 'stranger reads no steps');
select pg_temp.refused($$insert into public.office_tasks (title, assignee_id)
  values ('x', '00000000-0000-4000-8000-0000000000c1')$$, '42501', 'stranger cannot create a task');

-- A deactivated person, who still has a task.
select pg_temp.as_user('00000000-0000-4000-8000-0000000000d1');
select pg_temp.check((select count(*) from public.office_tasks) = 0, 'deactivated person reads no tasks, not even their own');
select pg_temp.check((select count(*) from public.office_people) = 0, 'deactivated person reads no people');

-- ------------------------------------------------------------- employee
select pg_temp.as_user('00000000-0000-4000-8000-0000000000c1');
select pg_temp.check((select count(*) from public.office_tasks) = 1, 'employee reads only their own task');
select pg_temp.check((select count(*) from public.office_task_steps) = 0, 'employee cannot read another employee''s steps');
select pg_temp.check((select count(*) from public.office_task_contacts) = 0, 'employee cannot read another employee''s contacts');
select pg_temp.check((select count(*) from public.office_task_bottlenecks) = 0, 'employee cannot read another employee''s bottlenecks');
select pg_temp.check((select count(*) from public.office_audit_log) = 0, 'employee cannot read the audit log');
select pg_temp.check((select count(*) from public.office_people) = 4, 'employee sees the active staff list');

select pg_temp.refused($$update public.office_tasks set title = 'mine now'
  where id = '00000000-0000-4000-9000-000000000001'$$, '42501', 'employee cannot rename their task');
select pg_temp.refused($$update public.office_tasks set due_date = due_date + 30
  where id = '00000000-0000-4000-9000-000000000001'$$, '42501', 'employee cannot move their due date');
select pg_temp.refused($$update public.office_tasks set assignee_id = '00000000-0000-4000-8000-0000000000c2'
  where id = '00000000-0000-4000-9000-000000000001'$$, '42501', 'employee cannot reassign their task');
select pg_temp.refused($$update public.office_tasks set priority = 'low'
  where id = '00000000-0000-4000-9000-000000000001'$$, '42501', 'employee cannot change priority');
select pg_temp.refused($$insert into public.office_tasks (title, assignee_id)
  values ('self-assigned', '00000000-0000-4000-8000-0000000000c1')$$, '42501', 'employee cannot assign tasks');

update public.office_tasks set title = 'hijack' where id = '00000000-0000-4000-9000-000000000002';
delete from public.office_tasks where id = '00000000-0000-4000-9000-000000000001';
select pg_temp.refused($$insert into public.office_task_steps (task_id, note)
  values ('00000000-0000-4000-9000-000000000002', 'sneaky')$$, '42501', 'employee cannot add a step to someone else''s task');
select pg_temp.refused($$update public.office_people set role = 'admin'
  where id = '00000000-0000-4000-8000-0000000000c1'$$, '42501', 'employee cannot promote themselves');
update public.office_settings set company_name = 'Employee Co';
select pg_temp.check((select company_name from public.office_settings) <> 'Employee Co', 'employee cannot change settings');

-- Working on their own task.
insert into public.office_task_steps (task_id, note)
  values ('00000000-0000-4000-9000-000000000001', 'Called the client');
select pg_temp.check((select status from public.office_tasks where id = '00000000-0000-4000-9000-000000000001') = 'in_progress',
  'the first step moves the task to in progress');
select pg_temp.check((select author_id from public.office_task_steps where note = 'Called the client') = '00000000-0000-4000-8000-0000000000c1',
  'a step is signed by whoever added it');
select pg_temp.refused($$insert into public.office_task_steps (task_id, done_on, note)
  values ('00000000-0000-4000-9000-000000000001', current_date + 5, 'future')$$, '23514', 'a step cannot be dated in the future');
select pg_temp.refused($$update public.office_task_steps set note = 'rewritten'$$, '42501', 'steps cannot be rewritten');
select pg_temp.refused($$delete from public.office_task_steps$$, '42501', 'steps cannot be deleted');

insert into public.office_task_bottlenecks (task_id, description, unblock_by)
  values ('00000000-0000-4000-9000-000000000001', 'Waiting for GST certificate', 'Accountant');
select pg_temp.check((select status from public.office_tasks where id = '00000000-0000-4000-9000-000000000001') = 'blocked',
  'raising a bottleneck blocks the task');
select pg_temp.refused($$update public.office_tasks set status = 'done', result = 'Finished'
  where id = '00000000-0000-4000-9000-000000000001'$$, '23514', 'cannot close with an open bottleneck');
update public.office_task_bottlenecks set clearing_note = 'Received', cleared_at = now()
  where task_id = '00000000-0000-4000-9000-000000000001';
select pg_temp.check((select status from public.office_tasks where id = '00000000-0000-4000-9000-000000000001') = 'in_progress',
  'clearing the last bottleneck returns the task to in progress');
select pg_temp.check((select cleared_by from public.office_task_bottlenecks where task_id = '00000000-0000-4000-9000-000000000001') = '00000000-0000-4000-8000-0000000000c1',
  'clearing is signed by whoever cleared it');
update public.office_task_bottlenecks set clearing_note = 'again'
  where task_id = '00000000-0000-4000-9000-000000000001';
select pg_temp.check((select clearing_note from public.office_task_bottlenecks where task_id = '00000000-0000-4000-9000-000000000001') = 'Received',
  'a bottleneck clears only once');

insert into public.office_task_contacts (task_id, name, organisation, phone)
  values ('00000000-0000-4000-9000-000000000001', 'Ravi', 'GST office', '+91 90000 00000');
select pg_temp.check((select count(*) from public.office_task_contacts) = 1, 'employee adds a key contact');

select pg_temp.refused($$update public.office_tasks set status = 'done'
  where id = '00000000-0000-4000-9000-000000000001'$$, '23514', 'cannot close without a result');
update public.office_tasks set status = 'done', result = 'Registration done'
  where id = '00000000-0000-4000-9000-000000000001';
select pg_temp.check((select closed_at is not null from public.office_tasks where id = '00000000-0000-4000-9000-000000000001'),
  'closing stamps the time');
select pg_temp.refused($$update public.office_tasks set status = 'in_progress'
  where id = '00000000-0000-4000-9000-000000000001'$$, '42501', 'employee cannot reopen a closed task');
select pg_temp.refused($$insert into public.office_task_steps (task_id, note)
  values ('00000000-0000-4000-9000-000000000001', 'late')$$, '23514', 'a closed task takes no more steps');

-- ------------------------------------------------------------- manager
select pg_temp.as_user('00000000-0000-4000-8000-0000000000b1');
select pg_temp.check((select title from public.office_tasks where id = '00000000-0000-4000-9000-000000000002') = 'T2 for emp2',
  'employee''s update of another task touched nothing');
select pg_temp.check((select count(*) from public.office_tasks where id = '00000000-0000-4000-9000-000000000001') = 1,
  'employee''s delete touched nothing');
select pg_temp.check((select count(*) from public.office_tasks) = 3, 'manager reads every task, including a deactivated person''s');
select pg_temp.check((select count(*) from public.office_task_steps) = 2, 'manager reads every step');
select pg_temp.check((select count(*) from public.office_audit_log) = 0, 'manager cannot read the audit log');

insert into public.office_tasks (title, assignee_id, start_date, due_date, priority)
  values ('Manager assigned', '00000000-0000-4000-8000-0000000000c2', current_date, current_date + 1, 'high');
select pg_temp.check((select assigned_by from public.office_tasks where title = 'Manager assigned') = '00000000-0000-4000-8000-0000000000b1',
  'assigned_by is whoever assigned it');
select pg_temp.refused($$insert into public.office_tasks (title, assignee_id)
  values ('to gone', '00000000-0000-4000-8000-0000000000d1')$$, '23514', 'cannot assign to a deactivated person');
select pg_temp.refused($$insert into public.office_tasks (title, assignee_id, start_date, due_date)
  values ('bad dates', '00000000-0000-4000-8000-0000000000c2', current_date, current_date - 1)$$, '23514', 'due date cannot be before start date');

update public.office_tasks set status = 'in_progress' where id = '00000000-0000-4000-9000-000000000001';
select pg_temp.check((select status from public.office_tasks where id = '00000000-0000-4000-9000-000000000001') = 'in_progress',
  'manager can reopen a task');

update public.office_settings set company_name = 'Manager Co';
select pg_temp.check((select company_name from public.office_settings) <> 'Manager Co', 'manager cannot change settings');
select pg_temp.refused($$update public.office_people set role = 'admin'
  where id = '00000000-0000-4000-8000-0000000000b1'$$, '42501', 'manager cannot change people');

-- ------------------------------------------------------------- admin
select pg_temp.as_user('00000000-0000-4000-8000-0000000000a1');
update public.office_settings set company_name = 'Admin Co';
select pg_temp.check((select company_name from public.office_settings) = 'Admin Co', 'admin can change settings');
select pg_temp.check((select count(*) from public.office_audit_log where action = 'task.assigned') >= 4, 'admin reads the audit log');
delete from public.office_tasks where title = 'Manager assigned';
select pg_temp.check((select count(*) from public.office_tasks where title = 'Manager assigned') = 0, 'admin can delete a task');

reset role;
select 'all passed' as result;
rollback;
