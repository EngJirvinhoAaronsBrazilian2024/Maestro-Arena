/**
 * Date utility helpers for reliable cross-timezone football prediction scheduling and matching.
 */

/**
 * Checks whether two timestamps or date strings correspond to the same calendar day.
 * Accounts for local browser time and UTC midnight offsets across all timezones.
 */
export function isSameDay(timestamp1: number | string, timestamp2: number | string): boolean {
  const d1 = new Date(Number(timestamp1));
  const d2 = new Date(Number(timestamp2));
  
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;

  const localYMD1 = `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, '0')}-${String(d1.getDate()).padStart(2, '0')}`;
  const localYMD2 = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
  
  const utcYMD1 = d1.toISOString().slice(0, 10);
  const utcYMD2 = d2.toISOString().slice(0, 10);
  
  return localYMD1 === localYMD2 || utcYMD1 === utcYMD2 || localYMD1 === utcYMD2 || utcYMD1 === localYMD2;
}

/**
 * Returns a YYYY-MM-DD string representing the local date of a Date object (defaults to today).
 * Unlike Date.toISOString(), this does NOT skew backwards or forwards in non-UTC timezones.
 */
export function formatLocalDate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes a YYYY-MM-DD date string or timestamp into a consistent midnight timestamp.
 */
export function parseDateInputToTimestamp(dateStr: string): number {
  if (!dateStr) return Date.now();
  // Parsing "YYYY-MM-DD" directly creates UTC midnight in JS
  return new Date(dateStr).getTime();
}
