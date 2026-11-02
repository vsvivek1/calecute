-- Applied 2026-10-15 to the "Bankers Gold" Supabase project (filvvtvboxyflunoipvf)
-- as migration `careers_applications`. Backs the apply form on /careers
-- (apps/web/src/components/careers/ApplyForm.tsx). The public key can insert
-- and upload only; read applications in the Supabase dashboard.
create table public.careers_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  role text not null check (char_length(role) between 1 and 80),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null check (char_length(phone) between 6 and 20),
  email text not null check (char_length(email) between 3 and 200 and email like '%@%'),
  sslc_marks text not null check (char_length(sslc_marks) between 1 and 60),
  degree text not null check (char_length(degree) between 1 and 200),
  has_backlogs boolean not null,
  cv_path text check (cv_path is null or char_length(cv_path) <= 300),
  cv_link text check (cv_link is null or char_length(cv_link) <= 500),
  note text check (note is null or char_length(note) <= 2000)
);

alter table public.careers_applications enable row level security;

create policy "Anyone can submit an application"
  on public.careers_applications for insert
  to anon, authenticated
  with check (true);

revoke all on public.careers_applications from anon, authenticated;
grant insert on public.careers_applications to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'careers-cvs', 'careers-cvs', false, 5242880,
  array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

create policy "Anyone can upload a CV"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'careers-cvs');
