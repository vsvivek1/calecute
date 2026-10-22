do $$ begin create role anon; create role authenticated; exception when others then null; end $$;
create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true),'')::uuid $$;
grant usage on schema auth to public;
insert into auth.users values ('00000000-0000-0000-0000-000000000001','a@x.com','{"full_name":"Asha Test"}');
