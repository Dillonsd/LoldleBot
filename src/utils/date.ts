/**
 * Returns the current "game day" as YYYY-MM-DD.
 * The day rolls over at 6 AM GMT+4 (= 2 AM UTC).
 */
export function getTodayUTC(): string {
  const now = new Date();
  now.setUTCHours(now.getUTCHours() - 2);
  return now.toISOString().slice(0, 10);
}
