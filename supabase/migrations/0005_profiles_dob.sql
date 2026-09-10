-- StudyWiser — add profiles.dob (date of birth).
-- Run in Supabase SQL Editor after 0001_schema.sql.

begin;

alter table public.profiles
  add column if not exists dob date;

commit;
