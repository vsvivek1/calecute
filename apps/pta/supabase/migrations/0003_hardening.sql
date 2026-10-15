-- Fixes found while deploying to the shared Supabase project.

-- A class teacher must also be on the school's staff list, or row-level
-- security hides the class's students and the register comes back empty.
-- Adding a class with a teacher now adds that teacher as staff too.
create or replace function pta.add_class(p_school uuid, p_name text, p_teacher_email text) returns uuid
language plpgsql as $$
declare cid uuid; t text := nullif(lower(trim(p_teacher_email)), '');
begin
  if t is not null then
    insert into pta.staff (school_id, email, name, role)
    values (p_school, t, split_part(t, '@', 1), 'teacher')
    on conflict (school_id, email) do nothing;
  end if;
  insert into pta.classes (school_id, name, teacher_email)
  values (p_school, p_name, t) returning id into cid;
  return cid;
end $$;

-- Pin search_path on every pta function that does not already set one, so a
-- caller's own search_path cannot change what a name in a function means.
-- All function bodies already schema-qualify pta.* and auth.*.
do $$
declare f regprocedure;
begin
  for f in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'pta' and p.prokind = 'f' and p.proconfig is null
  loop
    execute format('alter function %s set search_path = %L', f, '');
  end loop;
end $$;
