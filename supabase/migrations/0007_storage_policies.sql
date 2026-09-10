-- StudyWiser — storage RLS for the `avatars` and `credentials` buckets.
-- Assumes both buckets already exist (created via the dashboard) and are private.
-- Files are stored under a per-user folder: "<uid>/<filename>", enforced below via
-- (storage.foldername(name))[1] = auth.uid()::text.

begin;

-- ── avatars: readable by any signed-in user, writable only by the owner ──────────
drop policy if exists "Avatar images are readable by authenticated users" on storage.objects;
create policy "Avatar images are readable by authenticated users"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── credentials: fully private, owner-only (tutor onboarding documents) ──────────
drop policy if exists "Users can manage their own credential files" on storage.objects;
create policy "Users can manage their own credential files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'credentials' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'credentials' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
