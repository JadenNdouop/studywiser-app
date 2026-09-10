-- StudyWiser — record the typed name a tutor signs the service agreement with.

begin;

alter table public.tutor_profiles
  add column if not exists agreement_signer_name text;

commit;
