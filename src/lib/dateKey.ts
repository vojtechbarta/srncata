/**
 * "2026-09-08" z Date nebo ISO/datum řetězce, v místním čase (ne UTC) —
 * pro porovnání "je to stejný den" napříč appkou (kalendáře obsazenosti,
 * kolize dronu/pilota). Řetězce jde díky formátu porovnávat i lexikálně
 * (>=, <=) jako rozsah dat.
 */
export function dateKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
