-- StudyWiser — FULL RESET of the public schema (clean slate).
-- Run this FIRST, before 0001. This drops ALL tables, views, functions, and
-- policies in `public`. It does NOT touch Supabase-managed schemas (auth, storage).
--
-- ⚠️  Destructive: everything in `public` is deleted.

begin;

-- Remove the signup trigger (it lives on auth.users and references public).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;

-- Nuke and recreate the public schema.
drop schema if exists public cascade;
create schema public;

-- Restore the default Supabase grants on the fresh schema.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all routines  in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines  to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

commit;

-- ─────────────────────────────────────────────────────────────────────────────
-- OPTIONAL: also remove old test accounts so auth is a clean slate too.
-- Uncomment and run separately if you want to delete ALL existing users.
-- (You are currently logged into the dashboard, not the app, so this is safe —
--  but it is irreversible.)
--
-- delete from auth.users;
-- ─────────────────────────────────────────────────────────────────────────────
