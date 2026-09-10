-- StudyWiser — support columns for the avatar/credential upload flows.
-- Run in Supabase SQL Editor after 0005_profiles_dob.sql.

begin;

alter table public.profiles
  add column if not exists avatar_url text;

alter table public.tutor_profiles
  add column if not exists agreement_signed_at timestamptz;

alter table public.tutor_profiles
  add column if not exists credential_paths text[] not null default '{}';

commit;
