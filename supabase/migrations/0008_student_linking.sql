-- StudyWiser — link a student's own account to the managed-student record
-- their parent created, via a short code.
--
-- A parent-added row in public.students has no login of its own. This lets
-- the actual student sign up for a real account and claim that row, so
-- sessions booked against it (student_profile_id) show up in their own app.

begin;

alter table public.students
  add column if not exists profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists link_code  text;

-- Backfill a code for any existing rows, then enforce it going forward.
-- 6 uppercase alphanumeric chars, excluding easily-confused 0/O/1/I.
create or replace function public.generate_student_link_code()
returns text language sql volatile as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (random() * 32)::int + 1, 1),
    ''
  )
  from generate_series(1, 6);
$$;

update public.students
  set link_code = public.generate_student_link_code()
  where link_code is null;

alter table public.students
  alter column link_code set default public.generate_student_link_code(),
  alter column link_code set not null;

create unique index if not exists students_link_code_idx on public.students (link_code);
create index if not exists students_profile_id_idx on public.students (profile_id);

-- A linked student may read (but not modify) their own managed-student row.
drop policy if exists students_read_linked on public.students;
create policy students_read_linked on public.students
  for select to authenticated
  using (auth.uid() = profile_id);

-- Claim function: given a code, link the calling user's profile to that
-- students row (if the code exists and hasn't already been claimed).
-- security definer so a student — who has no direct RLS grant on rows they
-- don't yet own — can look the code up without seeing other parents' data.
create or replace function public.link_student_by_code(p_code text)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.students;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row
    from public.students
    where link_code = upper(trim(p_code))
    for update;

  if not found then
    raise exception 'That code doesn''t match any student. Double check it with your parent.';
  end if;

  if v_row.profile_id is not null then
    raise exception 'This student is already linked to an account.';
  end if;

  update public.students
    set profile_id = auth.uid()
    where id = v_row.id
    returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.link_student_by_code(text) from public;
grant execute on function public.link_student_by_code(text) to authenticated;

commit;
