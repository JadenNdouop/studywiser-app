# Integration tests

These hit a real Postgres + Auth instance through `@supabase/supabase-js` — they are
**not** run by `npm test` (that's unit tests only) and won't run in this sandbox, since
they need either Docker (for a local Supabase stack) or network access to a real project.

Covers the three flows from the backend punch list:

- `signup.test.ts` — the `handle_new_user()` trigger creates `profiles` (+ `tutor_profiles`
  for tutors) on signup.
- `rls.test.ts` — a parent cannot read or spoof-insert another parent's `students` rows.
- `accept-request.test.ts` — the tutor accept-request flow creates a `sessions` row and
  marks the `session_requests` row `accepted`.

## Running locally

1. Install Docker Desktop, then `supabase start` (uses `supabase/config.toml`, already
   set up by `supabase init`). First run downloads Postgres/Auth/Storage images.
2. Apply the schema: `supabase db reset` (runs everything in `supabase/migrations/` from
   scratch, including `0005_profiles_dob.sql`, against the **local** database only).
3. `npm run test:integration`

By default the tests target `http://127.0.0.1:54321` with the Supabase CLI's fixed local
demo anon key (see `env.js`) — never your production project. To run against staging
instead, set `SUPABASE_TEST_URL` / `SUPABASE_TEST_ANON_KEY` before running.

Each test signs up a fresh throwaway user (`test-<role>-<timestamp>-<random>@studywiser.test`)
so runs don't collide; nothing here needs manual cleanup between runs on a local/staging
database you're willing to reset.
