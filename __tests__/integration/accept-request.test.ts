// Verifies the accept-request -> session-creation write path used by the tutor
// Find screen (app/(tutor-tabs)/find.tsx: handleAccept). This logic is currently
// client-side (see BACKEND-PLAN.md "Open decisions" re: moving it to a DB
// trigger/RPC) — this test pins today's behavior so a future refactor can be
// checked against it.
import { signUpTestUser, waitFor } from "./helpers";

describe("accept-request -> session creation", () => {
  it("creates a session and marks the request accepted", async () => {
    const parent = await signUpTestUser("parent", "Req Parent");
    const tutor = await signUpTestUser("tutor", "Req Tutor");

    await waitFor(async () => {
      const { data } = await parent.client
        .from("profiles")
        .select("id")
        .eq("id", parent.user.id)
        .maybeSingle();
      return data;
    });
    await waitFor(async () => {
      const { data } = await tutor.client
        .from("profiles")
        .select("id")
        .eq("id", tutor.user.id)
        .maybeSingle();
      return data;
    });

    const { data: request, error: reqErr } = await parent.client
      .from("session_requests")
      .insert({
        parent_id: parent.user.id,
        subject: "Algebra",
        format: "Virtual",
        frequency: "Weekly",
        preferred_date: "2026-08-01",
        preferred_time: "15:00",
        duration_hours: 1,
        status: "pending",
      })
      .select()
      .single();
    expect(reqErr).toBeNull();
    expect(request).toBeTruthy();

    // Tutor should be able to see the open (pending, unclaimed) request.
    const { data: visible } = await tutor.client
      .from("session_requests")
      .select("*")
      .eq("id", request!.id)
      .eq("status", "pending")
      .is("tutor_id", null)
      .maybeSingle();
    expect(visible?.id).toBe(request!.id);

    // 1. Tutor creates the session (mirrors handleAccept in (tutor-tabs)/find.tsx).
    const { data: session, error: sessionErr } = await tutor.client
      .from("sessions")
      .insert({
        tutor_id: tutor.user.id,
        parent_id: parent.user.id,
        subject: request!.subject,
        session_type: "individual",
        session_date: request!.preferred_date,
        session_time: request!.preferred_time,
        duration: 60,
        format: request!.format,
        frequency: request!.frequency,
        status: "upcoming",
        price: 50,
      })
      .select()
      .single();
    expect(sessionErr).toBeNull();
    expect(session?.status).toBe("upcoming");

    // 2. Tutor marks the request accepted.
    const { error: updateErr } = await tutor.client
      .from("session_requests")
      .update({ status: "accepted", tutor_id: tutor.user.id })
      .eq("id", request!.id);
    expect(updateErr).toBeNull();

    // Both parties should now see the confirmed session.
    const { data: parentView } = await parent.client
      .from("sessions")
      .select("*")
      .eq("id", session!.id)
      .maybeSingle();
    expect(parentView?.status).toBe("upcoming");

    const { data: requestAfter } = await parent.client
      .from("session_requests")
      .select("status, tutor_id")
      .eq("id", request!.id)
      .single();
    expect(requestAfter?.status).toBe("accepted");
    expect(requestAfter?.tutor_id).toBe(tutor.user.id);
  });
});
