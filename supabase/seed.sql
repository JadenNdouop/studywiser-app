-- ============================================================
-- StudyWiser — demo seed (matches the current schema in migrations/)
-- Run in: Supabase Dashboard → SQL Editor, AFTER 0001–0003.
--
-- PREREQ: create two auth users (Authentication → Add user, Auto Confirm):
--   Tutor : jordan@studywiser.dev
--   Parent: sarah@studywiser.dev
-- Jordan (tutor) and Sarah (parent) are each other's counterpart, so both
-- accounts see a populated, coherent view. No FK bypass needed.
-- ============================================================

do $$
declare
  v_tutor  uuid;
  v_parent uuid;

  liam uuid := '22222222-2222-2222-2222-222222222201';
  emma uuid := '22222222-2222-2222-2222-222222222202';

  s_up1  uuid := '33333333-3333-3333-3333-333333333301'; -- today, upcoming, virtual (SAT Math, Liam)
  s_pend uuid := '33333333-3333-3333-3333-333333333302'; -- today, pending, in-person (Chemistry, Liam)
  s_up2  uuid := '33333333-3333-3333-3333-333333333303'; -- +2d, upcoming, virtual (Biology, Emma)
  s_done uuid := '33333333-3333-3333-3333-333333333304'; -- yesterday, completed (SAT Math, Liam)

  today date := current_date;
begin
  select id into v_tutor  from auth.users where email = 'jordan@studywiser.dev';
  select id into v_parent from auth.users where email = 'sarah@studywiser.dev';
  if v_tutor is null or v_parent is null then
    raise exception 'Create the demo auth users first: jordan@studywiser.dev and sarah@studywiser.dev';
  end if;

  -- Profiles (the signup trigger may have created these; upsert to be safe)
  insert into public.profiles (id, full_name, email, role) values
    (v_tutor,  'Jordan Lee',     'jordan@studywiser.dev', 'tutor'),
    (v_parent, 'Sarah Williams', 'sarah@studywiser.dev',  'parent')
  on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;

  insert into public.tutor_profiles (id, subjects, availability, is_active, bio, hourly_rate) values
    (v_tutor,
     array['SAT Math','SAT Reading & Writing','Algebra I / II','Biology'],
     '{"Mon":{"start":"15:00","end":"19:00"},"Wed":{"start":"15:00","end":"19:00"}}'::jsonb,
     true,
     'Former math teacher, 5 years of SAT prep and advanced math tutoring.',
     45)
  on conflict (id) do update set subjects = excluded.subjects, is_active = true;

  -- Parent's managed students
  insert into public.students (id, parent_id, full_name, grade_level) values
    (liam, v_parent, 'Liam Williams', '8th Grade'),
    (emma, v_parent, 'Emma Williams', '10th Grade')
  on conflict (id) do nothing;

  -- Sessions (Jordan tutors Sarah's kids) — visible to BOTH accounts
  insert into public.sessions (id, tutor_id, parent_id, student_id, subject, subject_tier,
      session_date, session_time, duration, format, frequency, price, status, meeting_url) values
    (s_up1,  v_tutor, v_parent, liam, 'SAT Math', 'sat',   today,     '10:00', 60, 'Virtual',   'weekly', 45, 'upcoming',  'https://meet.google.com/abc-defg-hij'),
    (s_pend, v_tutor, v_parent, liam, 'Chemistry', 'upper', today,     '14:00', 60, 'In-Person', 'weekly', 40, 'pending',   null),
    (s_up2,  v_tutor, v_parent, emma, 'Biology', 'upper',   today + 2, '15:00', 60, 'Virtual',   'biweekly', 40, 'upcoming', null),
    (s_done, v_tutor, v_parent, liam, 'SAT Math', 'sat',    today - 1, '10:00', 60, 'Virtual',   'weekly', 45, 'completed', null)
  on conflict (id) do nothing;

  -- Note on the completed session
  insert into public.session_notes (session_id, tutor_id, content) values
    (s_done, v_tutor,
     E'Liam did great!\n\n• 15 grid-in problems, 12 correct\n• Reviewed linear equations & systems\n\nHomework: 20 grid-in problems (blue book p. 214–216).')
  on conflict (session_id) do update set content = excluded.content;

  -- Open requests from Sarah — appear in Jordan's Find tab AND Sarah's My Requests
  insert into public.session_requests (parent_id, student_id, subject, subject_tier, subjects,
      format, frequency, preferred_date, preferred_time, preferred_time_end, preferred_days,
      duration_hours, grade_level, zip, session_type, notes, status) values
    (v_parent, emma, 'Biology', 'upper', array['Biology'], 'Virtual', 'weekly',
      today + 3, '16:00', '17:00', array['Thu'], 1, '10th Grade', null,
      'individual', 'Prepping for AP Bio. Needs help with cell biology and genetics.', 'pending'),
    (v_parent, liam, 'Algebra I / II', 'upper', array['Algebra I / II'], 'In-Person', 'weekly',
      today + 2, '15:00', '16:00', array['Tue'], 1, '8th Grade', '02134',
      'individual', 'Learns best with visual examples; start from the basics.', 'pending');

  -- Notifications
  insert into public.notifications (user_id, type, title, body) values
    (v_parent, 'session_confirmed', 'Session confirmed', 'Your SAT Math session with Jordan Lee is confirmed for today at 10:00 AM.'),
    (v_tutor,  'match_found', 'New request', 'A parent requested a Biology session. Check your Find tab.');

  raise notice 'Seed complete.';
end $$;
