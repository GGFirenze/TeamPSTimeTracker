-- PS Time Tracker Team - Database Schema
-- Run this in the Supabase SQL Editor after creating the project

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null check (category in ('billable', 'non-billable')),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Authenticated users can read active projects"
  on public.projects for select
  to authenticated
  using (true);

create policy "Admins can insert projects"
  on public.projects for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update projects"
  on public.projects for update
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- User-project assignments
create table public.user_projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  assigned_at timestamptz not null default now(),
  unique (user_id, project_id)
);

alter table public.user_projects enable row level security;

create policy "Users can see their own assignments"
  on public.user_projects for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins can see all assignments"
  on public.user_projects for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can assign projects"
  on public.user_projects for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can remove assignments"
  on public.user_projects for delete
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Time entries
create table public.time_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  start_time bigint not null,
  end_time bigint,
  total_seconds integer not null default 0,
  paused_at bigint,
  total_paused_ms bigint not null default 0,
  status text not null check (status in ('active', 'paused', 'completed')) default 'active',
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.time_entries enable row level security;

create policy "Users can read their own entries"
  on public.time_entries for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own entries"
  on public.time_entries for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own entries"
  on public.time_entries for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own entries"
  on public.time_entries for delete
  to authenticated
  using (user_id = auth.uid());

-- Index for fast lookups
create index idx_time_entries_user_date on public.time_entries (user_id, start_time desc);
create index idx_user_projects_user on public.user_projects (user_id);
