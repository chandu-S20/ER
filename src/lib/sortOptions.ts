/**
 * How to order the results list. "Relevance" = composite score in scoring.ts; other options sort by a single field.
 */
export const SORT_OPTIONS = [
  { value: "relevance" as const, label: "Relevance" },
  { value: "rating" as const, label: "Rating" },
  { value: "distance" as const, label: "Distance" },
  { value: "price" as const, label: "Price (lowest first)" },
  { value: "turnaround" as const, label: "Average turnaround time" },
  { value: "availability" as const, label: "Availability" },
  { value: "popularity" as const, label: "Popularity" },
] as const;

export type SortBy = (typeof SORT_OPTIONS)[number]["value"];

const SORT_SET = new Set<string>(SORT_OPTIONS.map((o) => o.value));

export function parseSortBy(raw: string | null | undefined): SortBy {
  if (raw && SORT_SET.has(raw)) {
    return raw as SortBy;
  }
  return "relevance";
}

export function sortOptionLabel(sort: SortBy): string {
  return SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Relevance";
}
