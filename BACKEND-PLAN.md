# StudyWiser — Backend Plan (Supabase)

_Draft: 2026-07-08_

Goal: stand up a clean Supabase backend that matches what the app already queries,
then cut each screen over from mock data to live data. We're **restarting the schema
from scratch** (the old project state is uncertain).

## How we'll work

- I write the **SQL migrations, RLS policies, seed scripts, and RN wiring**.
- You run the SQL in the Supabase dashboard (SQL Editor) and paste back any config
  values (project ref, provider keys). I can't access the dashboard directly.
- We cut over **screen by screen**, keeping `USE_MOCK` as the master switch until each
  area is verified, then flip it off last.

## Principles

- **RLS on every table**, deny by default. Users only see their own rows (or rows they're
  a party to — e.g. a parent sees their students' sessions).
- Schema is derived from the queries already in the app, so no frontend rewrites needed.
- Keep `constants/mockData.ts` as seed source-of-truth so the seeded DB mirrors the demo.

---

## 1. Auth & roles

- Supabase Auth (email/password already wired in `login`/`signup`/`set-password`).
- Role is `'parent' | 'tutor' | 'student'`, stored on `profiles.role`, set from
  `user_metadata.role` at signup.
- **Trigger:** `on auth.users insert` → create a `profiles` row (the app also self-heals a
  missing profile in `context/auth.tsx`, but the trigger is the reliable path).
- **OAuth: Google only** (login and signup). Apple and Facebook sign-in buttons have been
  removed from `login.tsx`/`signup.tsx` by product decision — Google needs credentials +
  a redirect URL configured in Supabase → Auth → Providers.
- **Password change:** `supabase.auth.updateUser` (already wired, mock-guarded).

## 2. Schema (tables, key columns, relationships)

All ids are `uuid`. `profiles.id`, `tutor_profiles.id` reference `auth.users.id`.

### profiles
`id (PK→auth.users)`, `full_name text`, `email text`, `phone text`, `role text check in (parent,tutor,student)`, `created_at`.

### tutor_profiles
`id (PK→auth.users)`, `subjects text[]`, `availability jsonb` (`{ Mon: {start,end}, … }`),
`is_active bool default false`. _(Room to add `bio`, `hourly_rate`, `rating` later.)_

### students  (a parent's managed children)
`id (PK)`, `parent_id (→profiles)`, `full_name text`, `grade_level text`, `created_at`.

### session_requests  (parent asks for a tutor)
`id`, `parent_id (→profiles)`, `student_id (→students)`, `student_profile_id (→profiles, nullable)`,
`subject text`, `subject_tier text`, `subjects text[]`, `format text`, `frequency text`,
`recurring bool`, `preferred_date date`, `preferred_time time`, `preferred_time_end time`,
`preferred_days text[]`, `duration_hours numeric`, `grade_level text`, `zip text`,
`session_type text`, `notes text`, `status text default 'pending'`, `tutor_id (→profiles, nullable)`,
`created_at`.

### sessions  (a booked/confirmed session)
`id`, `tutor_id (→profiles)`, `parent_id (→profiles)`, `student_id (→students, nullable)`,
`student_profile_id (→profiles, nullable)`, `subject text`, `subject_tier text`,
`session_type text`, `session_date date`, `session_time time`, `duration int`, `format text`,
`frequency text`, `status text check in (upcoming,pending,completed,cancelled)`,
`price numeric`, `meeting_url text`, `created_at`.

### session_notes
`session_id (PK/unique →sessions)`, `tutor_id (→profiles)`, `content text`, `updated_at`.

### notifications
`id`, `user_id (→profiles)`, `type text` (session_confirmed | session_reminder | payment_due | message | match_found),
`title text`, `body text`, `read bool default false`, `created_at`.

_(Messaging tables — `conversations`, `messages` — are intentionally out of scope for v1;
the chat runs on mock data. Add when messaging goes live.)_

## 3. RLS policies (summary)

- **profiles:** user can select/update their own row; tutors' basic profile readable by a
  parent they share a session/request with.
- **tutor_profiles:** owner read/write; readable by others for matching.
- **students:** parent can CRUD their own students only.
- **session_requests:** parent CRUD their own; tutors can read open requests and update the
  one they accept (`status`, `tutor_id`).
- **sessions:** readable/writable by the `tutor_id`, `parent_id`, or linked student; tutors
  update status/meeting_url on their sessions; parents cancel their own.
- **session_notes:** tutor writes for their sessions; parent/student can read notes for
  sessions they're party to.
- **notifications:** user reads/updates only their own.

## 4. Storage — done

- `avatars` and `credentials` buckets created (dashboard, both private).
- RLS: `supabase/migrations/0007_storage_policies.sql` — per-user folder path
  (`<uid>/<filename>`); `avatars` is select-readable by any authenticated user,
  write-restricted to the owner; `credentials` is fully owner-only.
- Columns: `profiles.avatar_url` and `tutor_profiles.credential_paths` /
  `agreement_signed_at` (`0006_avatars_and_credentials.sql`) store the storage
  *path*, not a public URL — reads go through `lib/storage.ts#getSignedUrl`
  (`useAvatarUrl` hook for display).
- Wired: `expo-image-picker` in `profile-edit.tsx` (camera badge → upload → shows
  on all 3 role profile tabs), `expo-document-picker` in `onboarding-documents.tsx`
  (multi-file upload + persists `tutor_profiles.credential_paths` and
  `agreement_signed_at` on "Sign Now").
- **Not yet applied to the live DB** — migrations `0006` and `0007` need
  `npm run db:push` (or paste into the SQL editor) like `0005`.
- **Not yet installed** — `expo-image-picker`/`expo-document-picker` are in
  `package.json` but couldn't be `npm install`ed from the sandbox (a stuck temp
  file under `node_modules/.glob-*` blocked npm's rename step — looked like a
  FUSE artifact on the mounted folder, not a real dependency conflict). Run
  `npm install` locally once; `tsc` currently reports exactly those 2 modules
  as missing and nothing else.

## 5. Automation (triggers / functions)

- `handle_new_user()` trigger → insert `profiles` (+ `tutor_profiles` when role = tutor).
- On `session_requests` accepted → insert a `sessions` row (currently done client-side in
  the tutor Find screen; consider moving to a trigger/RPC for integrity).
- Notification generation: insert `notifications` rows when a session is confirmed,
  a request is matched, etc. (trigger or Edge Function). Reminders need a scheduled job.

## 6. Seed data

Translate `constants/mockData.ts` into `seed.sql`: two demo profiles (tutor Jordan Lee,
parent Sarah Williams), students (Liam, Emma), a handful of sessions across statuses,
session requests, session notes, and a few notifications — so a freshly created DB looks
like the current demo.

## 7. Cutover sequence

1. Run schema migration + RLS on a clean database.
2. Configure email/password auth; verify signup → profile row → role routing.
3. Run seed; verify reads on **one** screen with `USE_MOCK=false` locally.
4. Flip screens over in order: profiles/auth → students → session_requests →
   sessions (tutor + parent + student) → session_notes → notifications.
5. Remove/relax the `USE_MOCK` guards once each area is confirmed.
6. OAuth providers.
7. Storage + pickers (photos, credentials).
8. Notification generation + reminders; then messaging; then payments (Stripe).

## 8. Config / env

- Move `supabaseUrl` / `supabaseAnonKey` out of `lib/supabase.ts` into env
  (`app.config` + `expo-constants` or `EXPO_PUBLIC_` vars). Anon key is fine client-side;
  never ship the service-role key in the app.
- Register the app's redirect scheme for OAuth.

## 9. Supabase CLI workflow

The project is now CLI-managed (`supabase init` has been run; `supabase/config.toml` exists).
Migrations stay as numbered SQL files in `supabase/migrations/` — new ones should use
`npm run db:new <name>` so they get a proper timestamp prefix; existing `000N_*.sql` files
were left as-is since their numeric prefixes still sort correctly ahead of any future
timestamped file.

Scripts (added to `package.json`):
- `npm run db:login` — one-time device login (opens a browser).
- `npm run db:link` — links this repo to the `vhemkzciypbwwptjejfj` project.
- `npm run db:new <name>` — scaffold a new timestamped migration file.
- `npm run db:diff` — diff local migration state vs. the linked project.
- `npm run db:push` — apply pending local migrations to the linked (remote) project.
- `npm run db:seed` — run `supabase/seed.sql` against the linked project.

**These all require dashboard-equivalent access (a Supabase login + the project ref) and
live network to Supabase, so I can't run them from here** — same division of labor as
below: run `db:login` and `db:link` once locally, then `db:push` replaces "paste SQL into
the dashboard" for every migration going forward (including `0005_profiles_dob.sql`, which
hasn't been applied yet).

## Open decisions

- Confirm Supabase project: reuse the existing `vhemkzciypbwwptjejfj` project (wipe schema)
  or create a fresh project?
- Accept-request: keep client-side session creation, or move to a DB trigger/RPC?
- Payments provider (Stripe assumed) and when to schedule it.
