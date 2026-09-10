// Date-of-birth helpers shared between signup/set-password and profile-edit.
// The UI always shows "MM/DD/YYYY"; the `profiles.dob` column is a Postgres `date`
// and round-trips as "YYYY-MM-DD".

/** As-you-type formatter: strips non-digits and inserts slashes. */
export function formatDOBInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** "MM/DD/YYYY" -> "YYYY-MM-DD". Returns null if incomplete/invalid. */
export function toISODate(mmddyyyy?: string | string[] | null): string | null {
  const raw = Array.isArray(mmddyyyy) ? mmddyyyy[0] : mmddyyyy;
  if (!raw) return null;
  const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, mm, dd, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

/** "YYYY-MM-DD" (or a full timestamp with that prefix) -> "MM/DD/YYYY" for display. */
export function toDisplayDate(iso?: string | null): string {
  if (!iso) return "";
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  const [, yyyy, mm, dd] = match;
  return `${mm}/${dd}/${yyyy}`;
}
