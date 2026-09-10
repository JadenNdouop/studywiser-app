# StudyWiser App — Design Refresh Handoff

## What this is

StudyWiser is a tutoring marketplace app connecting parents, students, and tutors — booking sessions, managing schedules, session notes, payments. This doc hands off the current app (as-is, screenshots attached) for a visual and structural refresh: same core flows, but modernized, more distinct visual identity, and built in the React setup we're using for Ora.

Full screen coverage for all three roles (tutor, parent, student) plus auth was reviewed to build this doc — see the screen-by-screen inventory below, each entry linked to its screenshot in `/screenshots`.

## Current state

**Stack:** Expo (React Native) + expo-router (file-based routing), Supabase for auth/data, `react-native` StyleSheet for styling (no Tailwind/NativeWind or component library in use). Icons via `@expo/vector-icons` (Ionicons).

**Important:** this is a React Native app today, not a React web app. Moving to "the same setup Ora is in" means a real platform migration — React DOM + Capacitor instead of React Native + Expo — not just a visual reskin. Native-only pieces currently in use that'll need web equivalents or Capacitor plugins: `expo-local-authentication` (biometric login), `expo-haptics`, `react-native-reanimated` / `gesture-handler` (used for the tab bar and any gesture-driven UI), `async-storage`. Worth confirming this migration is in scope before design work starts, since it affects what's feasible for v1 vs. what gets deferred.

**Auth / role model:** Single `profiles` table with a `role` field: `parent | tutor | student`. Root splash screen (`app/index.tsx`) routes to one of three separate tab groups based on role. There's also a `DEV_ROLE` bypass constant in that file for jumping straight into a role during development (currently set back to `null`).

**Mock data mode:** `constants/mockData.ts` has a `USE_MOCK` flag that bypasses Supabase entirely with static fixture data (sessions, session requests, students, session notes). Useful for design/dev work without a live backend.

## Current IA — screens per role

**Tutor tabs** (`app/(tutor-tabs)/`): Home, Find (browse session requests), Schedule, Profile.
**Parent tabs** (`app/(parent-tabs)/`): Home, Find (browse tutors), Sessions, Profile.
**Student tabs** (`app/(student-tabs)/`): Home, Sessions, Profile — no "Find" tab, students don't book directly.

All three use the same floating pill-shaped tab bar component (solid `#014aad` blue, white icons, rounded, floating above the bottom edge) — currently duplicated three times with minor per-role differences (icon set, tab count). Worth consolidating into one shared component in the refresh regardless of framework.

**Shared/stack screens** (`app/`, outside the tab groups): welcome, login, signup, set-password, edit-subjects, edit-availability, all-sessions, parent-payment, profile-privacy, profile-help, tutor-profile (view a tutor's public profile), message-detail, book-session, booking-confirmation, modal.

There's also a legacy `app/(tabs)/` folder (index, explore, sessions, profile) left over from the default Expo template — appears unused by the real navigation flow; flag for removal in the migration rather than carrying it forward.

## Visual style today

- Primary color: `#014aad` (deep blue), used heavily for the tab bar and primary actions.
- No defined design system — colors, spacing, and typography are set ad hoc per screen via inline `StyleSheet.create` calls rather than shared tokens.
- Default system fonts (no custom typeface).
- Fairly plain card/list-based layouts throughout (session cards, tutor cards, request cards).

This is the main opportunity for "nicer, more modern, more unique" — there's no real design language yet to preserve, just functional screens. A refresh can introduce actual tokens (color scale, spacing scale, type scale), a distinct typeface, and a more considered visual identity without fighting existing brand equity.

## What "more unique" should mean here

Ora and StudyWiser shouldn't look like siblings just because they share a stack. Suggest establishing StudyWiser's own identity markers — accent color(s) beyond the current blue, a typeface pairing, card/shape language (current app leans on fully-rounded pill shapes; consider whether that's a StudyWiser signature to keep or a generic default to move past) — so the two products are visually distinguishable at a glance despite shared component patterns.

## Data model reference (for realistic content in mocks/designs)

From `constants/mockData.ts`: sessions have subject, date/time, duration, format (Virtual/In-Person), frequency (Weekly/Biweekly), price, status (upcoming/pending/completed), student/tutor names, meeting URL. Session requests (tutor's "Find" tab) include grade level, session type, notes from the parent. Session notes are freeform text tied to a completed session. Subjects skew test-prep/academic: SAT Math, SAT Reading & Writing, Algebra, Pre-Calc/Calculus, Biology, Chemistry.

## Open questions for design

1. Confirm scope: full platform migration (RN/Expo → React web + Capacitor) alongside the visual refresh, or visual refresh first on the current stack with migration as a separate follow-up phase?
2. Keep the three-role, tab-based IA as-is, or is restructuring navigation part of this refresh?
3. Any existing brand guidelines (logo, color, type) to anchor to, or fully open for a new direction?

## Screen-by-screen inventory (from current-app screenshots)

All screenshots live in `/screenshots` alongside this doc.

### Auth / shared
- **Splash** (`Screenshot 2026-07-02 at 10.36.43 PM.png`) — solid blue (`#014aad`) full-bleed background, white graduation-cap "S" mark, "StudyWiser" wordmark centered.
- **Login** (`Screenshot 2026-07-02 at 10.36.56 PM.png`) — headline "Welcome", subhead "Your all-in-one study companion. Organize notes, track progress, and boost your grades." *(flag: this copy describes a note-taking app, not a tutoring marketplace — inconsistent with the actual product; worth rewriting)*. Email + password fields, "Forget Password" link, primary Log In button, social sign-in row (Google, Facebook, biometric/fingerprint), "Don't have an account? Sign Up" link.

### Parent role
- **Home** (`10.35.55 PM.png`, alt crop `10.36.38 PM.png`) — greeting header ("Good evening, Jordan 👋" + date) with notification bell, full-width "Request a Tutor" CTA button, "Upcoming Sessions" list (avatar, student name, subject · tutor name, format tag, relative date/time), "This Week's Bill" card (amount due, date range, Pay button, itemized session list), "My Students" row of student cards (initials avatar + grade level).
- **Payments** (`10.36.00 PM.png`) — "Amount Due" hero card with Pay Now, Stripe security note, "This Week's Sessions" list (empty state present), "Session Rates" reference card (Basic K–8 $35, Upper 9–12 $40, SAT/Test Prep $45 — color-coded), "Payment History" (empty state present).
- **Find a Tutor** (top: `10.36.09 PM.png`, scrolled: `10.36.20 PM.png`) — segmented New Request / My Requests control. Form: Student picker (empty state: "add a student from your profile first" — implies student-add flow is a dependency), Session Type (Virtual/In-Person), Session Length (60/90 min), Subject(s) as expandable accordion grouped by level (Basic K–8, Upper-Level 9–12, SAT/Test Prep) with pill multi-select, Preferred Days pill row, Recurring Session toggle, Notes textarea, Submit Request button.
- **My Sessions** (`10.36.28 PM.png`) — All/Upcoming/Completed filter tabs, session cards with status badge, student/subject/tutor, Cancel/Join actions depending on status.
- **Profile** (`10.36.32 PM.png`) — profile card (avatar, name, email, role badge), "My Students" (+Add, empty state), Account list (Edit Profile, Notifications, Settings, Privacy).

### Tutor role
- **Home** (`10.44.36 PM.png`) — greeting header, "Next Session" hero card (student, subject, date/time/duration pills, Join Session button), stat tiles (This Week / Pending / Completed counts), "Coming Up" list with date-badge tiles.
- **Find (Find Students)** (Virtual: `10.44.41 PM.png`, In-Person empty: `10.44.45 PM.png`) — subhead "Browse open session requests", Virtual/In-Person toggle with live counts, request cards (student name, grade, subject tag, frequency/time/date, parent's note quoted, Accept Request button). Empty state for In-Person: search icon illustration, "No open requests" / "Check back soon!", filter note "Sorted by zip code".
- **Schedule** (top: `10.44.56 PM.png`, with calendar strip: `10.45.01 PM.png`) — stat tiles (Sessions / Hours / $ This Week / Pending), horizontal scrollable date strip with per-day session-count dots, day-grouped session list with Cancel / edit(pencil) / Join for confirmed sessions and Decline / Accept for pending requests.
- **Profile** (top: `10.45.07 PM.png`, scrolled: `10.45.10 PM.png`) — profile card with stats row (Sessions / Students / Rating), "My Subjects" (empty state), "My Availability" weekly Mon–Sun list (all "Unavailable" by default — toggle switches), Settings list (Edit Profile, Notifications, Help & Support), Sign Out (destructive/red pill button).
- **Edit Profile** (`10.45.16 PM.png`, shared sub-screen) — avatar with camera/upload affordance, Full Name, Phone Number, Email, Date of Birth fields, Update Profile button.
- **Notifications** (`10.45.24 PM.png`, shared sub-screen) — empty state: bell illustration, "All caught up".

### Student role
- **Home** (`10.51.09 PM.png`) — greeting header, blue "No upcoming sessions" state card in place of a session hero (no bookable action here — students don't self-book), stat tiles (This Week / Completed / Hours), "Coming Up" (empty state), "My Tutors" (empty state: "will appear here after your first session"). Only 3 tabs (no Find tab, matching the code).
- **My Sessions** (`10.51.15 PM.png`) — same All/Upcoming/Completed pattern as parent, empty state present.
- **Profile** (`10.51.20 PM.png`) — profile card with stats row (Sessions / Hours / Tutors), "My Subjects" (empty state: "Subjects you've studied will appear here"), "My Tutors" (empty state), Settings list.

### Cross-cutting observations for design
- Empty states are used heavily and consistently (icon + heading + subtext pattern) — worth keeping as a deliberate pattern in the refresh rather than an incidental one.
- All three roles' "My Sessions"/"Schedule" screens share the same filter-tab + status-badge pattern — good candidate for one shared component instead of three near-duplicates (matches the tab-bar duplication noted above).
- Status badges (Upcoming/Pending/Completed) currently use a soft-tint color system (blue/yellow/green) — a reasonable pattern to formalize into tokens.
- The tutor's stat tiles use a 2×2 colored-tile grid (blue/blue/green/yellow) that's more visually rich than parent's or student's plainer tiles — inconsistent hierarchy across roles worth resolving intentionally rather than by accident.
