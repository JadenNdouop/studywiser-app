-- StudyWiser — Row Level Security policies
-- Run AFTER 0001_schema.sql. Deny-by-default; policies grant specific access.

begin;

alter table public.profiles         enable row level security;
alter table public.tutor_profiles   enable row level security;
alter table public.students         enable row level security;
alter table public.session_requests enable row level security;
alter table public.sessions         enable row level security;
alter table public.session_notes    enable row level security;
alter table public.notifications    enable row level security;

-- Helper: is the current user a party to a session row?
create or replace function public.is_session_party(s public.sessions)
returns boolean language sql stable as $$
  select auth.uid() = s.tutor_id
      or auth.uid() = s.parent_id
      or auth.uid() = s.student_profile_id;
$$;

-- ── profiles ──────────────────────────────────────────────────────────────
-- Any authenticated user can read profiles (needed to show tutor/parent names);
-- users may only insert/update their own row.
create policy profiles_select_all on public.profiles
  for select to authenticated using (true);
create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy profiles_update_self on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ── tutor_profiles ──────────────────────────────────────────────────────────
-- Readable by all (for matching / browsing); writable only by the owner.
create policy tutor_profiles_select_all on public.tutor_profiles
  for select to authenticated using (true);
create policy tutor_profiles_upsert_self on public.tutor_profiles
  for insert to authenticated with check (auth.uid() = id);
create policy tutor_profiles_update_self on public.tutor_profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ── students ────────────────────────────────────────────────────────────────
-- A parent fully manages only their own students.
create policy students_all_own on public.students
  for all to authenticated
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

-- ── session_requests ──────────────────────────────────────────────────────────
-- Parent manages their own requests; tutors may read open requests and claim one.
create policy sr_select_parent on public.session_requests
  for select to authenticated using (auth.uid() = parent_id);
create policy sr_select_open_for_tutors on public.session_requests
  for select to authenticated using (status = 'pending' or auth.uid() = tutor_id);
create policy sr_insert_parent on public.session_requests
  for insert to authenticated with check (auth.uid() = parent_id);
create policy sr_update_parent on public.session_requests
  for update to authenticated using (auth.uid() = parent_id) with check (auth.uid() = parent_id);
create policy sr_delete_parent on public.session_requests
  for delete to authenticated using (auth.uid() = parent_id);
-- Tutor claims a pending request (sets status/tutor_id).
create policy sr_claim_by_tutor on public.session_requests
  for update to authenticated
  using (status = 'pending')
  with check (auth.uid() = tutor_id);

-- ── sessions ────────────────────────────────────────────────────────────────
create policy sessions_select_party on public.sessions
  for select to authenticated using (public.is_session_party(sessions));
create policy sessions_insert_tutor on public.sessions
  for insert to authenticated with check (auth.uid() = tutor_id);
create policy sessions_update_party on public.sessions
  for update to authenticated
  using (public.is_session_party(sessions))
  with check (public.is_session_party(sessions));

-- ── session_notes ─────────────────────────────────────────────────────────────
-- Tutor writes notes for their sessions; any session party can read.
create policy notes_select_party on public.session_notes
  for select to authenticated using (
    exists (select 1 from public.sessions s
            where s.id = session_notes.session_id and public.is_session_party(s))
  );
create policy notes_write_tutor on public.session_notes
  for all to authenticated
  using (auth.uid() = tutor_id)
  with check (auth.uid() = tutor_id);

-- ── notifications ─────────────────────────────────────────────────────────────
create policy notif_own on public.notifications
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
