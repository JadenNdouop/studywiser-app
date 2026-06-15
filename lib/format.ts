/** "15:00:00" or "15:00" → "3:00 PM" */
export function formatTime(raw: string | null | undefined): string {
  if (!raw) return "";
  const [hStr, mStr] = raw.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr ?? "00";
  const ampm = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m} ${ampm}`;
}

/** "weekly" → "Weekly", "biweekly" → "Biweekly", etc. */
export function formatFrequency(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
