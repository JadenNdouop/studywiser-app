-- StudyWiser — schema (clean install)
-- Run in Supabase SQL Editor. Safe to re-run: drops and recreates app tables.
-- Does NOT touch auth.users.

begin;

-- ── Reset (app tables only) ─────────────────────────────────────────────
drop table if exists public.notifications     cascade;
drop table if exists public.session_notes     cascade;
drop table if exists public.sessions          cascade;
drop table if exists public.session_requests  cascade;
drop table if exists public.students          cascade;
drop table if exists public.tutor_profiles    cascade;
drop table if exists public.profiles          cascade;

-- ── profiles ────────────────────────────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  email      text,
  phone      text,
  role       text not null default 'parent'
             check (role in ('parent', 'tutor', 'student')),
  created_at timestamptz not null default now()
);

-- ── tutor_profiles ───────────────────────────────────────────────────────
create table public.tutor_profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  subjects     text[] not null default '{}',
  availability jsonb  not null default '{}'::jsonb,
  is_active    boolean not null default false,
  bio          text,
  hourly_rate  numeric,
  created_at   timestamptz not null default now()
);

-- ── students (parent-managed children) ────────────────────────────────────
create table public.students (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null references public.profiles (id) on delete cascade,
  full_name   text not null,
  grade_level text,
  created_at  timestamptz not null default now()
);
create index students_parent_id_idx on public.students (parent_id);

-- ── session_requests (parent asks for a tutor) ────────────────────────────
create table public.session_requests (
  id                 uuid primary key default gen_random_uuid(),
  parent_id          uuid not null references public.profiles (id) on delete cascade,
  student_id         uuid references public.students (id) on delete set null,
  student_profile_id uuid references public.profiles (id) on delete set null,
  tutor_id           uuid references public.profiles (id) on delete set null,
  subject            text,
  subject_tier       text,
  subjects           text[] default '{}',
  format             text,
  frequency          text,
  recurring          boolean default false,
  preferred_date     date,
  preferred_time     time,
  preferred_time_end time,
  preferred_days     text[] default '{}',
  duration_hours     numeric,
  grade_level        text,
  zip                text,
  session_type       text default 'individual',
  notes              text,
  status             text not null default 'pending'
                     check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at         timestamptz not null default now()
);
create index session_requests_parent_idx on public.session_requests (parent_id);
create index session_requests_status_idx on public.session_requests (status);

-- ── sessions (booked / confirmed) ─────────────────────────────────────────
create table public.sessions (
  id                 uuid primary key default gen_random_uuid(),
  tutor_id           uuid references public.profiles (id) on delete set null,
  parent_id          uuid references public.profiles (id) on delete set null,
  student_id         uuid references public.students (id) on delete set null,
  student_profile_id uuid references public.profiles (id) on delete set null,
  subject            text,
  subject_tier       text,
  session_type       text default 'individual',
  session_date       date not null,
  session_time       time not null,
  duration           int not null default 60,
  format             text not null default 'Virtual',
  frequency          text,
  status             text not null default 'upcoming'
                     check (status in ('upcoming', 'pending', 'completed', 'cancelled')),
  price              numeric,
  meeting_url        text,
  created_at         timestamptz not null default now()
);
create index sessions_tutor_idx  on public.sessions (tutor_id);
create index sessions_parent_idx on public.sessions (parent_id);
create index sessions_date_idx   on public.sessions (session_date);

-- ── session_notes (one per session) ───────────────────────────────────────
create table public.session_notes (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  tutor_id   uuid references public.profiles (id) on delete set null,
  content    text,
  updated_at timestamptz not null default now()
);

-- ── notifications ─────────────────────────────────────────────────────────
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null
             check (type in ('session_confirmed','session_reminder','payment_due','message','match_found')),
  title      text not null,
  body       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

commit;
