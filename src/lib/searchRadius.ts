/** Search radius options (miles) for home + results. */
export const RADIUS_OPTIONS: { value: string; label: string }[] = [
  { value: "5", label: "5 miles" },
  { value: "10", label: "10 miles" },
  { value: "25", label: "25 miles" },
  { value: "50", label: "50 miles" },
  { value: "100", label: "100 miles" },
  { value: "any", label: "No limit" },
];

export const DEFAULT_RADIUS = "25";

/** Returns a positive mile cap, or +Infinity when the user chose “no limit.” */
export function parseRadiusMilesParam(raw: string | null): number {
  if (raw == null || raw === "") {
    return Number.parseInt(DEFAULT_RADIUS, 10) || 25;
  }
  const s = raw.trim().toLowerCase();
  if (s === "any" || s === "all") {
    return Number.POSITIVE_INFINITY;
  }
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return Number.parseInt(DEFAULT_RADIUS, 10) || 25;
  }
  return Math.min(500, Math.max(1, n));
}

export function radiusParamForQuery(miles: number): string {
  if (miles === Number.POSITIVE_INFINITY) return "any";
  return String(Math.round(miles));
}
