-- ============================================================
-- StudyWiser Dev Seed Script
-- Run this in: Supabase Dashboard → SQL Editor
--
-- BEFORE RUNNING:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Find your tutor test account → copy the UUID
--   3. Find your parent test account → copy the UUID
--   4. Paste them below, replacing the placeholder strings
-- ============================================================

DO $$
DECLARE
  -- !! REPLACE THESE TWO VALUES !!
  tutor_id  uuid := 'YOUR-TUTOR-UUID-HERE';
  parent_id uuid := 'YOUR-PARENT-UUID-HERE';

  -- Generated IDs for fake counterpart profiles
  fake_tutor_id  uuid := '11111111-1111-1111-1111-111111111101';
  fake_parent_id uuid := '11111111-1111-1111-1111-111111111102';

  -- Student IDs (managed by the parent account)
  student1_id uuid := '22222222-2222-2222-2222-222222222201';
  student2_id uuid := '22222222-2222-2222-2222-222222222202';

  -- Session IDs (fixed so notes can reference them)
  sess_tutor_upcoming1  uuid := '33333333-3333-3333-3333-333333333301';
  sess_tutor_upcoming2  uuid := '33333333-3333-3333-3333-333333333302';
  sess_tutor_pending    uuid := '33333333-3333-3333-3333-333333333303';
  sess_tutor_completed1 uuid := '33333333-3333-3333-3333-333333333304';
  sess_tutor_completed2 uuid := '33333333-3333-3333-3333-333333333305';

  sess_parent_upcoming1  uuid := '44444444-4444-4444-4444-444444444401';
  sess_parent_upcoming2  uuid := '44444444-4444-4444-4444-444444444402';
  sess_parent_pending    uuid := '44444444-4444-4444-4444-444444444403';
  sess_parent_completed1 uuid := '44444444-4444-4444-4444-444444444404';
  sess_parent_completed2 uuid := '44444444-4444-4444-4444-444444444405';

  today date := current_date;

BEGIN
  -- Bypass FK constraints so we can insert fake profiles without auth users
  SET session_replication_role = replica;

  -- ── Fake tutor profile (shows up on parent's session cards) ──────────────
  INSERT INTO profiles (id, full_name, role, email)
  VALUES (fake_tutor_id, 'Marcus Chen', 'tutor', 'marcus.chen.fake@dev.studywiser')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- ── Fake parent profile (shows up on tutor's session cards) ──────────────
  INSERT INTO profiles (id, full_name, role, email)
  VALUES (fake_parent_id, 'Sarah Williams', 'parent', 'sarah.williams.fake@dev.studywiser')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- ── Tutor profile data for the real tutor account ────────────────────────
  INSERT INTO tutor_profiles (id, bio, subjects, hourly_rate)
  VALUES (
    tutor_id,
    'Experienced tutor with 5 years helping students tackle SAT prep and advanced math. Former math teacher, passionate about making concepts click.',
    ARRAY['SAT Math', 'SAT Reading & Writing', 'Algebra I / II', 'Pre-Calculus / Calculus', 'Geometry'],
    45
  )
  ON CONFLICT (id) DO UPDATE SET
    bio      = EXCLUDED.bio,
    subjects = EXCLUDED.subjects;

  -- ── Managed students (under the real parent account) ─────────────────────
  INSERT INTO students (id, parent_id, full_name, grade_level)
  VALUES
    (student1_id, parent_id, 'Liam Williams',  '8th Grade'),
    (student2_id, parent_id, 'Emma Williams',  '10th Grade')
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════
  -- SESSIONS — Tutor view (tutor_id = real tutor, parent = fake)
  -- Tutor schedule screen shows sessions for the current week
  -- ════════════════════════════════════════════════════════════════════════

  -- Today · Upcoming · Virtual · SAT Math
  INSERT INTO sessions (id, tutor_id, parent_id, student_id, subject, subject_tier, session_type, session_date, session_time, duration, format, frequency, price, status, meeting_url)
  VALUES (sess_tutor_upcoming1, tutor_id, fake_parent_id, null, 'SAT Math', 'sat', 'individual', today, '10:00:00', 60, 'Virtual', 'Weekly', 45, 'upcoming', 'https://meet.google.com/abc-defg-hij')
  ON CONFLICT (id) DO NOTHING;

  -- Tomorrow · Upcoming · Virtual · Algebra
  INSERT INTO sessions (id, tutor_id, parent_id, student_id, subject, subject_tier, session_type, session_date, session_time, duration, format, frequency, price, status)
  VALUES (sess_tutor_upcoming2, tutor_id, fake_parent_id, null, 'Algebra I / II', 'upper', 'individual', today + 1, '14:00:00', 90, 'Virtual', 'Biweekly', 60, 'upcoming')
  ON CONFLICT (id) DO NOTHING;

  -- Today · Pending · In-Person · Pre-Calc (tutor needs to accept)
  INSERT INTO sessions (id, tutor_id, parent_id, student_id, subject, subject_tier, session_type, session_date, session_time, duration, format, frequency, price, status)
  VALUES (sess_tutor_pending, tutor_id, fake_parent_id, null, 'Pre-Calculus / Calculus', 'upper', 'individual', today, '16:00:00', 60, 'In-Person', 'Weekly', 40, 'pending')
  ON CONFLICT (id) DO NOTHING;

  -- Yesterday · Completed · Virtual · SAT Reading (has session notes)
  INSERT INTO sessions (id, tutor_id, parent_id, student_id, subject, subject_tier, session_type, session_date, session_time, duration, format, frequency, price, status)
  VALUES (sess_tutor_completed1, tutor_id, fake_parent_id, null, 'SAT Reading & Writing', 'sat', 'individual', today - 1, '11:00:00', 60, 'Virtual', 'Weekly', 45, 'completed')
  ON CONFLICT (id) DO NOTHING;

  -- 3 days ago · Completed · Virtual · Algebra (no notes yet)
  INSERT INTO sessions (id, tutor_id, parent_id, student_id, subject, subject_tier, session_type, session_date, session_time, duration, format, frequency, price, status)
  VALUES (sess_tutor_completed2, tutor_id, fake_parent_id, null, 'Algebra I / II', 'upper', 'individual', today - 3, '09:00:00', 90, 'Virtual', 'Weekly', 60, 'completed')
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════
  -- SESSIONS — Parent view (parent_id = real parent, tutor = fake)
  -- ════════════════════════════════════════════════════════════════════════

  -- Today · Upcoming · Virtual · SAT Math for Liam
  INSERT INTO sessions (id, tutor_id, parent_id, student_id, subject, subject_tier, session_type, session_date, session_time, duration, format, frequency, price, status, meeting_url)
  VALUES (sess_parent_upcoming1, fake_tutor_id, parent_id, student1_id, 'SAT Math', 'sat', 'individual', today, '10:00:00', 60, 'Virtual', 'Weekly', 45, 'upcoming', 'https://meet.google.com/xyz-uvwx-yz1')
  ON CONFLICT (id) DO NOTHING;

  -- Day after tomorrow · Upcoming · Virtual · Biology for Emma
  INSERT INTO sessions (id, tutor_id, parent_id, student_id, subject, subject_tier, session_type, session_date, session_time, duration, format, frequency, price, status)
  VALUES (sess_parent_upcoming2, fake_tutor_id, parent_id, student2_id, 'Biology', 'upper', 'individual', today + 2, '15:00:00', 60, 'Virtual', 'Biweekly', 40, 'upcoming')
  ON CONFLICT (id) DO NOTHING;

  -- Today · Pending · In-Person · Chemistry for Liam
  INSERT INTO sessions (id, tutor_id, parent_id, student_id, subject, subject_tier, session_type, session_date, session_time, duration, format, frequency, price, status)
  VALUES (sess_parent_pending, fake_tutor_id, parent_id, student1_id, 'Chemistry', 'upper', 'individual', today, '14:00:00', 60, 'In-Person', 'Weekly', 40, 'pending')
  ON CONFLICT (id) DO NOTHING;

  -- Yesterday · Completed · Virtual · SAT Math for Liam (has notes from tutor)
  INSERT INTO sessions (id, tutor_id, parent_id, student_id, subject, subject_tier, session_type, session_date, session_time, duration, format, frequency, price, status)
  VALUES (sess_parent_completed1, fake_tutor_id, parent_id, student1_id, 'SAT Math', 'sat', 'individual', today - 1, '10:00:00', 60, 'Virtual', 'Weekly', 45, 'completed')
  ON CONFLICT (id) DO NOTHING;

  -- 4 days ago · Completed · Virtual · Biology for Emma (no notes)
  INSERT INTO sessions (id, tutor_id, parent_id, student_id, subject, subject_tier, session_type, session_date, session_time, duration, format, frequency, price, status)
  VALUES (sess_parent_completed2, fake_tutor_id, parent_id, student2_id, 'Biology', 'upper', 'individual', today - 4, '15:00:00', 60, 'Virtual', 'Biweekly', 40, 'completed')
  ON CONFLICT (id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════════════
  -- SESSION NOTES
  -- ════════════════════════════════════════════════════════════════════════

  -- Notes on the tutor's completed session (SAT Reading)
  INSERT INTO session_notes (session_id, tutor_id, content)
  VALUES (
    sess_tutor_completed1, tutor_id,
    E'Great focus today! Here''s what we covered:\n\n• Paired passage strategy — annotate as you read, don''t re-read\n• Evidence questions: eliminate the 2-wrong-answer trap\n• Timed practice: 2 full reading sections (score improved from 630 → 680 on practice)\n\nHomework:\nComplete one Khan Academy reading section. Focus on annotation, not re-reading.\n\nNext session:\nMove into Writing & Language — sentence structure and transitions.'
  )
  ON CONFLICT (session_id) DO UPDATE SET content = EXCLUDED.content;

  -- Notes on the parent's completed session (from the fake tutor, for Liam)
  INSERT INTO session_notes (session_id, tutor_id, content)
  VALUES (
    sess_parent_completed1, fake_tutor_id,
    E'Liam did great today! Summary:\n\n• Grid-in problems: worked through 15 problems, got 12 correct\n• Reviewed linear equations and systems of equations\n• Identified key weakness: reading the question carefully before solving\n\nHomework:\nPractice 20 grid-in problems from the College Board blue book (p. 214–216).\n\nNext session:\nStart data analysis section. Liam''s algebra is strong — data will be a quick win.'
  )
  ON CONFLICT (session_id) DO UPDATE SET content = EXCLUDED.content;

  -- ════════════════════════════════════════════════════════════════════════
  -- SESSION REQUESTS — Tutor Find screen (pending, no tutor assigned yet)
  -- ════════════════════════════════════════════════════════════════════════

  INSERT INTO session_requests (
    id, parent_id, student_id, subject, subject_tier, subjects,
    format, frequency, sessions_per_period, preferred_date, preferred_time,
    duration, zip, notes, session_type, grade_level, status
  ) VALUES
  (
    '55555555-5555-5555-5555-555555555501',
    fake_parent_id, null,
    'SAT Math', 'sat', ARRAY['SAT Math'],
    'Virtual', 'weekly', 1, today + 3, '16:00:00',
    60, null,
    'My son struggles with grid-in problems and time management. Test date is October.',
    'individual', '10th Grade', 'pending'
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    fake_parent_id, null,
    'Algebra I / II', 'upper', ARRAY['Algebra I / II'],
    'Virtual', 'weekly', 1, today + 5, '17:00:00',
    90, null,
    'Looking for a patient tutor who can explain things from scratch. She learns best with visual examples.',
    'individual', '8th Grade', 'pending'
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    fake_parent_id, null,
    'Biology', 'upper', ARRAY['Biology'],
    'In-Person', 'weekly', 1, today + 2, '15:00:00',
    60, '02134',
    'Preparing for AP Bio in May. Strong in ecology, needs help with cell biology and genetics.',
    'individual', '11th Grade', 'pending'
  ),
  (
    '55555555-5555-5555-5555-555555555504',
    fake_parent_id, null,
    'Chemistry', 'upper', ARRAY['Chemistry'],
    'In-Person', 'weekly', 2, today + 1, '14:00:00',
    60, '02215',
    null,
    'individual', '10th Grade', 'pending'
  ),
  (
    '55555555-5555-5555-5555-555555555505',
    fake_parent_id, null,
    'Pre-Calculus / Calculus', 'upper', ARRAY['Pre-Calculus / Calculus'],
    'Virtual', 'biweekly', 1, today + 6, '18:00:00',
    60, null,
    'Starting calculus next semester, wants to get ahead over the summer.',
    'individual', '11th Grade', 'pending'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Re-enable FK checks
  SET session_replication_role = DEFAULT;

  RAISE NOTICE 'Seed complete! Tutor sees: % sessions this week. Parent sees: % sessions.',
    (SELECT count(*) FROM sessions WHERE tutor_id = tutor_id),
    (SELECT count(*) FROM sessions WHERE parent_id = parent_id);

END $$;
