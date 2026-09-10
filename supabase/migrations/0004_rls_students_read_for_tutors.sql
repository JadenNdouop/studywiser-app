-- StudyWiser — let tutors read the student rows they're connected to.
-- Without this, a tutor's session/request cards show "Student" instead of the
-- real name, because the base students policy only grants access to the parent.
--
-- Run AFTER 0002_rls.sql. Safe to re-run (drops the policy first).

begin;

drop policy if exists students_select_linked_tutor on public.students;

create policy students_select_linked_tutor on public.students
  for select to authenticated
  using (
    exists (
      select 1 from public.sessions s
      where s.student_id = students.id
        and s.tutor_id = auth.uid()
    )
    or exists (
      select 1 from public.session_requests r
      where r.student_id = students.id
        and (r.status = 'pending' or r.tutor_id = auth.uid())
    )
  );

commit;
