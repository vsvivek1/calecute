-- Office: login, people, and the work schedule (tasks with steps, bottlenecks,
-- contacts, files). Release 1 of the office module.
--
-- Everything lives in `public` with an `office_` prefix so a fresh Supabase
-- project needs no "Exposed schemas" change. Helper functions live in
-- `office_private`, which the API does not expose.
--
-- Who can do what is decided HERE, not in the web app: the browser holds a
-- publishable key, so anything the UI hides must also be refused by the
-- database.
--
--   admin     everything, including people and settings
--   manager   assign, edit and see every task; no people or settings
--   employee  their own tasks: add steps, raise and clear bottlenecks, add
--             contacts and files, close with a result. Cannot change what the
--             task is, who it is for, or when it is due.
--
-- Anyone who can sign in but has no active office_people row (a stranger who
-- used Supabase's public sign-up endpoint, or a deactivated person) is not a
-- member and can read or write nothing.

create schema if not exists office_private;
revoke all on schema office_private from public;
grant usage on schema office_private to authenticated;

-- ---------------------------------------------------------------- tables

create table public.office_settings (
  id boolean primary key default true check (id),
  company_name text not null default 'Our company'
    check (length(btrim(company_name)) between 1 and 120),
  logo_path text,
  timezone text not null default 'Asia/Kolkata',
  updated_at timestamptz not null default now()
);
insert into public.office_settings default values on conflict do nothing;

create table public.office_people (
  id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  email text not null unique check (email = lower(email)),
  phone text check (phone is null or length(phone) <= 40),
  designation text check (designation is null or length(designation) <= 120),
  role text not null default 'employee' check (role in ('admin', 'manager', 'employee')),
  active boolean not null default true,
  must_change_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.office_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 200),
  details text check (details is null or length(details) <= 8000),
  assignee_id uuid not null references public.office_people (id),
  assigned_by uuid references public.office_people (id),
  start_date date,
  due_date date,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'blocked', 'done')),
  result text check (result is null or length(result) <= 8000),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint office_tasks_dates check (due_date is null or start_date is null or due_date >= start_date)
);
create index office_tasks_assignee on public.office_tasks (assignee_id, status);
create index office_tasks_due on public.office_tasks (due_date) where status <> 'done';
create index office_tasks_assigned_by on public.office_tasks (assigned_by);

create table public.office_task_steps (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.office_tasks (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.office_people (id),
  done_on date not null,
  note text not null check (length(btrim(note)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index office_task_steps_task on public.office_task_steps (task_id, done_on desc);
create index office_task_steps_author on public.office_task_steps (author_id);

create table public.office_task_bottlenecks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.office_tasks (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.office_people (id),
  description text not null check (length(btrim(description)) between 1 and 2000),
  unblock_by text check (unblock_by is null or length(unblock_by) <= 500),
  raised_at timestamptz not null default now(),
  cleared_at timestamptz,
  cleared_by uuid references public.office_people (id),
  clearing_note text check (clearing_note is null or length(clearing_note) <= 2000)
);
create index office_task_bottlenecks_task on public.office_task_bottlenecks (task_id);
create index office_task_bottlenecks_open on public.office_task_bottlenecks (task_id) where cleared_at is null;
create index office_task_bottlenecks_author on public.office_task_bottlenecks (author_id);
create index office_task_bottlenecks_cleared_by on public.office_task_bottlenecks (cleared_by);

create table public.office_task_contacts (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.office_tasks (id) on delete cascade,
  added_by uuid not null default auth.uid() references public.office_people (id),
  name text not null check (length(btrim(name)) between 1 and 120),
  organisation text check (organisation is null or length(organisation) <= 160),
  job_title text check (job_title is null or length(job_title) <= 120),
  phone text check (phone is null or length(phone) <= 40),
  email text check (email is null or length(email) <= 200),
  note text check (note is null or length(note) <= 2000),
  created_at timestamptz not null default now()
);
create index office_task_contacts_task on public.office_task_contacts (task_id);
create index office_task_contacts_added_by on public.office_task_contacts (added_by);

create table public.office_task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.office_tasks (id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references public.office_people (id),
  path text not null unique,
  name text not null check (length(name) between 1 and 200),
  size_bytes bigint not null check (size_bytes between 0 and 10485760),
  mime text,
  created_at timestamptz not null default now()
);
create index office_task_files_task on public.office_task_files (task_id);
create index office_task_files_uploaded_by on public.office_task_files (uploaded_by);

create table public.office_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);
create index office_audit_log_at on public.office_audit_log (at desc);

-- ---------------------------------------------------------------- helpers
-- SECURITY DEFINER so a policy can look up the caller's own row without
-- recursing through the policies on office_people.

create function office_private.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.office_people where id = auth.uid() and active
$$;

create function office_private.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select office_private.my_role() is not null
$$;

create function office_private.is_lead() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(office_private.my_role() in ('admin', 'manager'), false)
$$;

create function office_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(office_private.my_role() = 'admin', false)
$$;

-- The assignee or any lead, and only while active.
create function office_private.can_see_task(t uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select office_private.is_lead()
      or (office_private.is_member()
          and exists (select 1 from public.office_tasks where id = t and assignee_id = auth.uid()))
$$;

-- "Today" in the company's timezone. Dates are compared in IST, not UTC, or a
-- task would turn overdue at 5:30 in the morning.
create function office_private.today() returns date
language sql stable security definer set search_path = '' as $$
  select (now() at time zone coalesce(
    (select timezone from public.office_settings limit 1), 'Asia/Kolkata'))::date
$$;

-- tasks/<task id>/<file> -> task id, or null for any other path.
create function office_private.task_from_path(p text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  if split_part(p, '/', 1) <> 'tasks' then return null; end if;
  return split_part(p, '/', 2)::uuid;
exception when others then
  return null;
end $$;

create function office_private.audit(a text, ttype text, tid uuid, d jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.office_audit_log (actor_id, action, target_type, target_id, details)
  values (auth.uid(), a, ttype, tid, coalesce(d, '{}'::jsonb))
$$;

revoke all on all functions in schema office_private from public;
grant execute on function
  office_private.my_role(), office_private.is_member(), office_private.is_lead(),
  office_private.is_admin(), office_private.can_see_task(uuid), office_private.today(),
  office_private.task_from_path(text)
to authenticated;

-- ---------------------------------------------------------------- triggers

-- People: email lower-case, updated_at, and never remove the last admin.
create function office_private.people_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.email := lower(btrim(new.email));
  new.updated_at := now();
  if tg_op = 'UPDATE'
     and old.role = 'admin' and old.active
     and (new.role <> 'admin' or not new.active)
     and not exists (select 1 from public.office_people
                     where role = 'admin' and active and id <> old.id) then
    raise exception 'There must always be at least one active admin' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger office_people_before_write before insert or update on public.office_people
for each row execute function office_private.people_before_write();

create function office_private.settings_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.id := true;
  new.updated_at := now();
  if new.timezone is distinct from old.timezone
     and not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Unknown timezone %', new.timezone using errcode = '22023';
  end if;
  perform office_private.audit('settings.updated', 'settings', null,
    jsonb_build_object('company_name', new.company_name, 'timezone', new.timezone));
  return new;
end $$;
create trigger office_settings_before_update before update on public.office_settings
for each row execute function office_private.settings_before_update();

-- Tasks: who is assigning, and a fresh task always starts not started.
create function office_private.task_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.assigned_by := auth.uid();
  end if;
  if not exists (select 1 from public.office_people where id = new.assignee_id and active) then
    raise exception 'Pick an active employee' using errcode = '23514';
  end if;
  new.status := 'not_started';
  new.result := null;
  new.closed_at := null;
  new.created_at := now();
  new.updated_at := now();
  return new;
end $$;
create trigger office_tasks_before_insert before insert on public.office_tasks
for each row execute function office_private.task_before_insert();

-- Tasks: what an employee may change, and status kept honest.
--   * an open bottleneck means "blocked"; clearing the last one means "in progress"
--   * "done" needs a result and no open bottlenecks, and stamps closed_at
--   * only a lead reopens a done task
create function office_private.task_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  privileged boolean := auth.uid() is null or office_private.is_lead();
  has_open boolean;
begin
  if not privileged then
    if new.id is distinct from old.id
       or new.title is distinct from old.title
       or new.details is distinct from old.details
       or new.assignee_id is distinct from old.assignee_id
       or new.start_date is distinct from old.start_date
       or new.due_date is distinct from old.due_date
       or new.priority is distinct from old.priority then
      raise exception 'Only an admin or manager can change the task itself' using errcode = '42501';
    end if;
    if old.status = 'done' and (new.status <> 'done' or new.result is distinct from old.result) then
      raise exception 'This task is closed. Ask an admin or manager to reopen it' using errcode = '42501';
    end if;
  end if;

  if new.assignee_id is distinct from old.assignee_id
     and not exists (select 1 from public.office_people where id = new.assignee_id and active) then
    raise exception 'Pick an active employee' using errcode = '23514';
  end if;

  new.assigned_by := old.assigned_by;
  new.created_at := old.created_at;
  new.updated_at := now();

  select exists (select 1 from public.office_task_bottlenecks
                 where task_id = new.id and cleared_at is null) into has_open;

  if new.status = 'done' then
    if old.status <> 'done' then
      if coalesce(btrim(new.result), '') = '' then
        raise exception 'Write the result before closing the task' using errcode = '23514';
      end if;
      if has_open then
        raise exception 'Clear the open bottlenecks before closing the task' using errcode = '23514';
      end if;
      new.closed_at := now();
    end if;
  else
    new.closed_at := null;
    if has_open then
      new.status := 'blocked';
    elsif new.status = 'blocked' then
      new.status := 'in_progress';
    end if;
  end if;
  return new;
end $$;
create trigger office_tasks_before_update before update on public.office_tasks
for each row execute function office_private.task_before_update();

create function office_private.task_after_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform office_private.audit('task.assigned', 'task', new.id,
      jsonb_build_object('title', new.title, 'assignee_id', new.assignee_id));
  elsif tg_op = 'UPDATE' then
    if new.assignee_id is distinct from old.assignee_id then
      perform office_private.audit('task.reassigned', 'task', new.id,
        jsonb_build_object('title', new.title, 'from', old.assignee_id, 'to', new.assignee_id));
    end if;
    if new.status = 'done' and old.status <> 'done' then
      perform office_private.audit('task.closed', 'task', new.id, jsonb_build_object('title', new.title));
    elsif old.status = 'done' and new.status <> 'done' then
      perform office_private.audit('task.reopened', 'task', new.id, jsonb_build_object('title', new.title));
    end if;
  elsif tg_op = 'DELETE' then
    perform office_private.audit('task.deleted', 'task', old.id,
      jsonb_build_object('title', old.title, 'assignee_id', old.assignee_id));
    return old;
  end if;
  return new;
end $$;
create trigger office_tasks_after_write after insert or update or delete on public.office_tasks
for each row execute function office_private.task_after_write();

-- Steps: append-only history. The author is whoever is signed in; the date
-- cannot be in the future; a closed task takes no more steps. The first step
-- moves a not-started task to in progress.
create function office_private.step_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then new.author_id := auth.uid(); end if;
  new.done_on := coalesce(new.done_on, office_private.today());
  if new.done_on > office_private.today() then
    raise exception 'A step cannot be dated in the future' using errcode = '23514';
  end if;
  if exists (select 1 from public.office_tasks where id = new.task_id and status = 'done') then
    raise exception 'This task is closed' using errcode = '23514';
  end if;
  new.created_at := now();
  return new;
end $$;
create trigger office_task_steps_before_insert before insert on public.office_task_steps
for each row execute function office_private.step_before_insert();

create function office_private.step_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.office_tasks set status = 'in_progress'
  where id = new.task_id and status = 'not_started';
  return new;
end $$;
create trigger office_task_steps_after_insert after insert on public.office_task_steps
for each row execute function office_private.step_after_insert();

-- Bottlenecks: raised by the signed-in person; the only change afterwards is
-- clearing it, once. Either event re-derives the task's status.
create function office_private.bottleneck_before_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then new.author_id := auth.uid(); end if;
    if exists (select 1 from public.office_tasks where id = new.task_id and status = 'done') then
      raise exception 'This task is closed' using errcode = '23514';
    end if;
    new.raised_at := now();
    new.cleared_at := null;
    new.cleared_by := null;
    new.clearing_note := null;
  else
    if old.cleared_at is not null then
      raise exception 'This bottleneck is already cleared' using errcode = '23514';
    end if;
    new.task_id := old.task_id;
    new.author_id := old.author_id;
    new.description := old.description;
    new.unblock_by := old.unblock_by;
    new.raised_at := old.raised_at;
    new.cleared_at := now();
    new.cleared_by := coalesce(auth.uid(), new.cleared_by);
  end if;
  return new;
end $$;
create trigger office_task_bottlenecks_before_write before insert or update on public.office_task_bottlenecks
for each row execute function office_private.bottleneck_before_write();

create function office_private.bottleneck_after_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Touching the task runs task_before_update, which derives the status.
  update public.office_tasks set updated_at = now() where id = new.task_id;
  return new;
end $$;
create trigger office_task_bottlenecks_after_write after insert or update on public.office_task_bottlenecks
for each row execute function office_private.bottleneck_after_write();

create function office_private.contact_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then new.added_by := auth.uid(); end if;
  new.created_at := now();
  return new;
end $$;
create trigger office_task_contacts_before_insert before insert on public.office_task_contacts
for each row execute function office_private.contact_before_insert();

create function office_private.contact_before_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.id := old.id;
  new.task_id := old.task_id;
  new.added_by := old.added_by;
  new.created_at := old.created_at;
  return new;
end $$;
create trigger office_task_contacts_before_update before update on public.office_task_contacts
for each row execute function office_private.contact_before_update();

create function office_private.file_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then new.uploaded_by := auth.uid(); end if;
  if office_private.task_from_path(new.path) is distinct from new.task_id then
    raise exception 'File path does not belong to this task' using errcode = '23514';
  end if;
  new.created_at := now();
  return new;
end $$;
create trigger office_task_files_before_insert before insert on public.office_task_files
for each row execute function office_private.file_before_insert();

-- ---------------------------------------------------------------- access

alter table public.office_settings enable row level security;
alter table public.office_people enable row level security;
alter table public.office_tasks enable row level security;
alter table public.office_task_steps enable row level security;
alter table public.office_task_bottlenecks enable row level security;
alter table public.office_task_contacts enable row level security;
alter table public.office_task_files enable row level security;
alter table public.office_audit_log enable row level security;

-- Start from nothing, then grant exactly what the policies below expect.
revoke all on public.office_settings, public.office_people, public.office_tasks,
  public.office_task_steps, public.office_task_bottlenecks, public.office_task_contacts,
  public.office_task_files, public.office_audit_log
from anon, authenticated;

grant select, update (company_name, logo_path, timezone) on public.office_settings to authenticated;
grant select on public.office_people to authenticated;
-- Column lists on INSERT keep ids, authors and timestamps out of the client's
-- hands; the triggers above fill them in. Tasks keep a full UPDATE grant
-- because what may change depends on the role (task_before_update decides).
grant select, update, delete,
  insert (title, details, assignee_id, start_date, due_date, priority)
  on public.office_tasks to authenticated;
grant select, insert (task_id, done_on, note) on public.office_task_steps to authenticated;
grant select, insert (task_id, description, unblock_by), update (clearing_note, cleared_at)
  on public.office_task_bottlenecks to authenticated;
grant select, insert (task_id, name, organisation, job_title, phone, email, note),
  update (name, organisation, job_title, phone, email, note), delete
  on public.office_task_contacts to authenticated;
grant select, insert (task_id, path, name, size_bytes, mime), delete
  on public.office_task_files to authenticated;
grant select on public.office_audit_log to authenticated;

create policy office_settings_read on public.office_settings for select to authenticated
  using ((select office_private.is_member()));
create policy office_settings_admin on public.office_settings for update to authenticated
  using ((select office_private.is_admin())) with check ((select office_private.is_admin()));

create policy office_people_read on public.office_people for select to authenticated
  using ((select office_private.is_member()));

create policy office_tasks_read on public.office_tasks for select to authenticated
  using ((select office_private.is_lead())
         or (assignee_id = (select auth.uid()) and (select office_private.is_member())));
create policy office_tasks_assign on public.office_tasks for insert to authenticated
  with check ((select office_private.is_lead()));
create policy office_tasks_update on public.office_tasks for update to authenticated
  using ((select office_private.is_lead())
         or (assignee_id = (select auth.uid()) and (select office_private.is_member())))
  with check ((select office_private.is_lead())
         or (assignee_id = (select auth.uid()) and (select office_private.is_member())));
create policy office_tasks_delete on public.office_tasks for delete to authenticated
  using ((select office_private.is_lead()));

create policy office_steps_read on public.office_task_steps for select to authenticated
  using (office_private.can_see_task(task_id));
create policy office_steps_add on public.office_task_steps for insert to authenticated
  with check (office_private.can_see_task(task_id));

create policy office_bottlenecks_read on public.office_task_bottlenecks for select to authenticated
  using (office_private.can_see_task(task_id));
create policy office_bottlenecks_raise on public.office_task_bottlenecks for insert to authenticated
  with check (office_private.can_see_task(task_id));
create policy office_bottlenecks_clear on public.office_task_bottlenecks for update to authenticated
  using (office_private.can_see_task(task_id) and cleared_at is null)
  with check (office_private.can_see_task(task_id));

create policy office_contacts_read on public.office_task_contacts for select to authenticated
  using (office_private.can_see_task(task_id));
create policy office_contacts_add on public.office_task_contacts for insert to authenticated
  with check (office_private.can_see_task(task_id));
create policy office_contacts_change on public.office_task_contacts for update to authenticated
  using (office_private.can_see_task(task_id)
         and (added_by = (select auth.uid()) or (select office_private.is_lead())))
  with check (office_private.can_see_task(task_id));
create policy office_contacts_remove on public.office_task_contacts for delete to authenticated
  using (office_private.can_see_task(task_id)
         and (added_by = (select auth.uid()) or (select office_private.is_lead())));

create policy office_files_read on public.office_task_files for select to authenticated
  using (office_private.can_see_task(task_id));
create policy office_files_add on public.office_task_files for insert to authenticated
  with check (office_private.can_see_task(task_id));
create policy office_files_remove on public.office_task_files for delete to authenticated
  using (office_private.can_see_task(task_id)
         and (uploaded_by = (select auth.uid()) or (select office_private.is_lead())));

create policy office_audit_read on public.office_audit_log for select to authenticated
  using ((select office_private.is_admin()));

-- ---------------------------------------------------------------- storage
-- One private bucket. settings/... holds the logo (members read, admins
-- write); tasks/<task id>/... holds task files (whoever can see the task).

insert into storage.buckets (id, name, public, file_size_limit)
values ('office-files', 'office-files', false, 10485760)
on conflict (id) do nothing;

create policy office_files_object_read on storage.objects for select to authenticated
  using (bucket_id = 'office-files' and (
    (split_part(name, '/', 1) = 'settings' and (select office_private.is_member()))
    or office_private.can_see_task(office_private.task_from_path(name))));

create policy office_files_object_add on storage.objects for insert to authenticated
  with check (bucket_id = 'office-files' and (
    (split_part(name, '/', 1) = 'settings' and (select office_private.is_admin()))
    or office_private.can_see_task(office_private.task_from_path(name))));

create policy office_files_object_remove on storage.objects for delete to authenticated
  using (bucket_id = 'office-files' and (
    (split_part(name, '/', 1) = 'settings' and (select office_private.is_admin()))
    or (office_private.can_see_task(office_private.task_from_path(name))
        and (owner_id = (select auth.uid())::text or (select office_private.is_lead())))));

-- ---------------------------------------------------------------- setup
-- Run once from the SQL editor after creating the first user under
-- Authentication -> Users (with "Auto confirm"):
--   select office_private.make_first_admin('you@example.com', 'Your Name');
create function office_private.make_first_admin(p_email text, p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(btrim(p_email));
  if uid is null then
    raise exception 'No user with email %. Create it under Authentication -> Users first', p_email;
  end if;
  insert into public.office_people (id, full_name, email, role, active, must_change_password)
  values (uid, p_name, lower(btrim(p_email)), 'admin', true, false)
  on conflict (id) do update set role = 'admin', active = true;
end $$;
revoke all on function office_private.make_first_admin(text, text) from public, authenticated, anon;
