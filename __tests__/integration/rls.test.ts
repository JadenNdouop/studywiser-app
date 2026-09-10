// Verifies the `students` RLS policy (supabase/migrations/0002_rls.sql): a parent
// should only ever see their own students, never another parent's.
import { signUpTestUser, waitFor } from "./helpers";

describe("RLS — students table access boundary", () => {
  it("parent A cannot read parent B's students", async () => {
    const parentA = await signUpTestUser("parent", "Parent A");
    const parentB = await signUpTestUser("parent", "Parent B");

    // Wait for both profile rows so the students.parent_id FK is satisfiable.
    await waitFor(async () => {
      const { data } = await parentA.client
        .from("profiles")
        .select("id")
        .eq("id", parentA.user.id)
        .maybeSingle();
      return data;
    });
    await waitFor(async () => {
      const { data } = await parentB.client
        .from("profiles")
        .select("id")
        .eq("id", parentB.user.id)
        .maybeSingle();
      return data;
    });

    const { data: student, error: insertErr } = await parentA.client
      .from("students")
      .insert({ parent_id: parentA.user.id, full_name: "A's Kid", grade_level: "5th" })
      .select()
      .single();
    expect(insertErr).toBeNull();
    expect(student).toBeTruthy();

    // Parent A can see their own student.
    const { data: ownRead } = await parentA.client
      .from("students")
      .select("*")
      .eq("id", student!.id)
      .maybeSingle();
    expect(ownRead?.id).toBe(student!.id);

    // Parent B cannot see parent A's student — RLS should filter it out (not error).
    const { data: crossRead, error: crossErr } = await parentB.client
      .from("students")
      .select("*")
      .eq("id", student!.id)
      .maybeSingle();
    expect(crossErr).toBeNull();
    expect(crossRead).toBeNull();

    // Parent B also can't insert a student under parent A's id.
    const { error: spoofErr } = await parentB.client
      .from("students")
      .insert({ parent_id: parentA.user.id, full_name: "Spoofed Kid" });
    expect(spoofErr).not.toBeNull();
  });
});
