import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_TEST_URL!;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY!;

/** A fresh, unauthenticated client — call `.auth.signUp` on it to get a session. */
export function newAnonClient() {
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Signs up a throwaway test user and returns an authenticated client for them. */
export async function signUpTestUser(role: "parent" | "tutor" | "student", fullName: string) {
  const client = newAnonClient();
  const email = `test-${role}-${Date.now()}-${Math.random().toString(36).slice(2)}@studywiser.test`;
  const password = "Test1234!";

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });
  if (error) throw error;
  if (!data.user) throw new Error("signUp did not return a user");

  return { client, user: data.user, email };
}

/** Polls for a row until it appears or the timeout elapses (the profile trigger is async). */
export async function waitFor<T>(fn: () => Promise<T | null>, timeoutMs = 5000): Promise<T> {
  const start = Date.now();
  let last: T | null = null;
  while (Date.now() - start < timeoutMs) {
    last = await fn();
    if (last) return last;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`waitFor timed out after ${timeoutMs}ms`);
}
