# StudyWiser — Frontend Audit & Next Steps

_Last updated: 2026-07-07_

This document captures the current state of each role's frontend, which features
are incomplete and why, and a prioritized plan. Priorities chosen: **(1) clean up
dead code → (2) finish auth → (3) role feature gaps**, with backend go-live tracked
as a cross-cutting dependency.

## ✅ Done in the frontend pass (pre-backend)

- Deleted the legacy `(tabs)` group and the orphaned direct-booking flow
  (`book-session`, `tutor-profile`, `booking-confirmation`).
- Revived messaging on mock data: `message-detail` now takes a `name` param;
  entry points added on parent session cards (message tutor) and tutor session
  cards (message the family).
- Join Session buttons open the real meeting link everywhere (with null guard).
- Mock-guarded every write path so the demo runs end-to-end without errors:
  tutor accept request, parent add/remove student (+ mock student list),
  tutor accept/decline/cancel/meet-link, edit availability, edit subjects.
- Wired password change to `supabase.auth.updateUser` (mock-guarded).

### Still frontend, but blocked on native deps / backend (deferred)

- **Profile photo picker** — done (see `BACKEND-PLAN.md` §4); needs `npm install`
  on a real machine + a dev-client rebuild to actually test, since the picker is a
  native dependency.
- **Onboarding credential upload** — done (see `BACKEND-PLAN.md` §4); same
  install/rebuild caveat.
- **`profile-notifications` persistence** — toggles are local; needs backend.
- This last one is intentionally deferred to the backend phase.

---

## 0. Cross-cutting: everything runs on mock data

`constants/mockData.ts` sets `USE_MOCK = true`. The app renders seeded demo data and
bypasses Supabase, which _is_ configured with a live URL/anon key (`lib/supabase.ts`).

- Most features are UI wired to Supabase queries that only run when `USE_MOCK = false`.
- Several **write** paths are **not** mock-guarded and will error if used in mock mode:
  accept request (`(tutor-tabs)/find.tsx`), add/remove student (`(parent-tabs)/profile.tsx`),
  save notes / meet link (`(tutor-tabs)/schedule.tsx`), edit availability/subjects.
- `notifications.tsx` queries live Supabase with no mock branch → always empty in mock mode.

This is the root gate for the "role feature gaps" work. Not first on the list, but most
role features can't be truly "done" until the backend is connected and every write path
respects `USE_MOCK`.

---

## 1. Clean up dead code (priority #1)

### Legacy `(tabs)` route group — remove or revive
`app/(tabs)/` is a full second parent portal (`index`, `sessions`, `explore`, `profile`)
predating `(parent-tabs)`. It's unreachable from the splash, but:
- `booking-confirmation.tsx` still routes into `/(tabs)` and `/(tabs)/sessions`.
- It's the **only** caller of `tutor-profile`, and the old `notifications` entry.

**Action:** Decide keep-vs-delete. Recommended: delete `app/(tabs)/` and its
`Stack.Screen name="(tabs)"` in `app/_layout.tsx`, after re-pointing or removing
`booking-confirmation`.

### Orphaned screens (built, not wired into any current role)
- `message-detail.tsx` — in-app chat, demo-only (`INITIAL_MSGS`); no entry point.
- `book-session.tsx`, `tutor-profile.tsx`, `booking-confirmation.tsx` — the old
  "browse tutor → book directly" flow, replaced by request-matching.

**Action:** Either (a) delete them, or (b) consciously fold messaging + direct booking
back into the roadmap (see §3). They should not sit half-wired.

**Checklist**
- [ ] Delete or repurpose `app/(tabs)/`
- [ ] Remove `(tabs)` from `_layout.tsx`
- [ ] Re-point or remove `booking-confirmation` routing
- [ ] Decide fate of `message-detail`, `book-session`, `tutor-profile`
- [ ] Remove now-unused styles/imports; run `tsc --noEmit`

---

## 2. Finish auth (priority #2)

### OAuth (Google only)
Apple and Facebook sign-in buttons were removed from `login.tsx`/`signup.tsx` — Google is
the only social sign-in option, alongside email/password. Code exists
(`supabase.auth.signInWithOAuth("google")`) but requires:
- Google OAuth client config in the Supabase dashboard (client ID/secret).
- Redirect URI registered for the Expo scheme.

**Action:** Configure the Google provider, verify the redirect round-trip, confirm profile
row creation on first OAuth login (`context/auth.tsx` handles the missing-profile case).

### Onboarding documents — done
`onboarding-documents.tsx` "Sign Now" persists `tutor_profiles.agreement_signed_at`;
credential upload uses `expo-document-picker` + the `credentials` bucket and persists
`tutor_profiles.credential_paths`. See `BACKEND-PLAN.md` §4.

### Biometric login
Works but needs a real prior session. Fine once backend is live; no action pre-launch.

**Checklist**
- [ ] Configure Google in Supabase + redirect URI
- [ ] Verify OAuth → profile creation end to end
- [x] Real credential upload (picker + Storage) in onboarding
- [x] Persist service-agreement acceptance

---

## 3. Role feature gaps (priority #3)

### Quick, isolated fixes
- **Join Session stub (tutor + student home):** `(tutor-tabs)/index.tsx` and
  `(student-tabs)/index.tsx` show `Alert("Opening meeting link…")` instead of opening
  the URL. The sessions _list_ screens already use `Linking.openURL(meeting_url)`.
  **Fix:** open the link (and hide/disable when `meeting_url` is null).

### Parent
- **Payments (`parent-payment.tsx`):** "Stripe integration coming soon." Needs a real
  payment provider (Stripe) + backend intent creation. Larger effort.
- **Direct tutor browsing/booking + messaging:** orphaned (see §1). Decide if these are
  on the roadmap or cut.

### Tutor
- Accept/decline, notes, meet-link, availability, subjects are wired to Supabase but
  **not mock-guarded** — depends on backend go-live to function without errors.

### Student
- Read-only dashboards on mock data; no student-initiated actions (by design).

### Shared / profile
- **`profile-password.tsx`:** UI only — never calls `supabase.auth.updateUser`. Doesn't
  change the password.
- **`profile-notifications.tsx`:** toggles are local state, not persisted; no push infra.
- **`profile-privacy.tsx`, `profile-help.tsx`:** static content (fine as-is, or wire
  contact form).
- **Delete account (`profile-settings.tsx`):** only signs out; no real deletion RPC.
- **Notifications:** no generation logic and no mock branch → empty; no push.

**Checklist (frontend-only, doable before backend)**
- [ ] Fix Join Session on tutor + student home screens
- [x] Wire profile photo picker + upload
- [ ] Make `profile-password` call `updateUser` (or clearly disable until live)
- [ ] Persist `profile-notifications` toggles
- [ ] Decide messaging + direct-booking roadmap

**Checklist (needs backend)**
- [ ] Stripe payments
- [ ] Mock-guard or connect all tutor/parent write paths
- [ ] Notification generation + delivery (and mock branch)
- [ ] Real account deletion

---

## Suggested sequencing

1. **Dead-code cleanup** (fast, de-risks everything else).
2. **Auth** (OAuth config + real onboarding upload) — unblocks real logins.
3. **Frontend-only role fixes** (Join Session, profile photo, password, toggles).
4. **Backend go-live** (flip `USE_MOCK`, seed data, mock-guard writes) — unblocks tutor
   flows, notifications, payments.
5. **Payments + messaging** (larger, roadmap-dependent).

---

## Live-mode QA gaps (found while testing against Supabase)

Running list of issues spotted after flipping `USE_MOCK` off. Fix after the
mock-vs-live screenshot comparison pass.

- [ ] **DOB doesn't save.** `profile-edit` has a Date-of-Birth field, but `handleSave`
  only writes full_name/phone/email, and `profiles` has no `dob` column. Add
  `profiles.dob date` (migration) + include it in the update.
- [ ] **Spacing bug on student home.** Awkward gap between the "UPCOMING NOW" badge and
  the name on the student next-session card. Tighten the layout.
- [ ] **Availability uses 24-hour time.** Setup + display show military time
  (e.g. `15:00 – 19:00`). Switch to 12-hour with AM/PM everywhere (display formatter +
  the edit-availability inputs; consider a proper time picker).
- [ ] Plan: set up each account manually in live mode to surface remaining gaps.
