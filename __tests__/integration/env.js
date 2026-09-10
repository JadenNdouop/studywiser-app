// Loaded by jest.integration.config.js before the test files run.
// Points the tests at the local Supabase stack (`supabase start`) by default —
// override via real env vars to run against a linked staging project instead.
// This is the fixed demo anon key the Supabase CLI issues for every local project
// unless config.toml overrides it; it is NOT a secret.
const LOCAL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE2NDE3Njk2MDAsImV4cCI6MTc5OTUzNjAwMH0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";

process.env.SUPABASE_TEST_URL = process.env.SUPABASE_TEST_URL || "http://127.0.0.1:54321";
process.env.SUPABASE_TEST_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY || LOCAL_ANON_KEY;
