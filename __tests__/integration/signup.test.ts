// Verifies the `handle_new_user()` trigger (supabase/migrations/0003_triggers.sql):
// signing up should create a `profiles` row (and a `tutor_profiles` row for tutors)
// automatically, with no client-side write.
import { signUpTestUser, waitFor } from "./helpers";

describe("signup -> profile creation trigger", () => {
  it("creates a profiles row with the right role for a parent", async () => {
    const { client, user } = await signUpTestUser("parent", "Test Parent");

    const profile = await waitFor(async () => {
      const { data } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    });

    expect(profile.full_name).toBe("Test Parent");
    expect(profile.role).toBe("parent");
  });

  it("creates both profiles and tutor_profiles rows for a tutor", async () => {
    const { client, user } = await signUpTestUser("tutor", "Test Tutor");

    const profile = await waitFor(async () => {
      const { data } = await client.from("profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    });
    expect(profile.role).toBe("tutor");

    const tutorProfile = await waitFor(async () => {
      const { data } = await client.from("tutor_profiles").select("*").eq("id", user.id).maybeSingle();
      return data;
    });
    expect(tutorProfile.id).toBe(user.id);
    expect(tutorProfile.is_active).toBe(false);
  });
});
