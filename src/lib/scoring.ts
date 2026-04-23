import { ImagingCenter, Insurance, Modality } from "@/data/mockCenters";
import { type SortBy } from "@/lib/sortOptions";

export interface SearchCriteria {
  urgent: boolean;
  insurance: Insurance | "any";
  modalities: Modality[];
}

export interface ScoredCenter extends ImagingCenter {
  score: number;
  distanceScore: number;
  qualityScore: number;
  availabilityScore: number;
  insuranceScore: number;
  inNetwork: boolean;
  reasons: string[];
}

const MAX_DISTANCE = 6; // miles for normalization

export function scoreCenter(center: ImagingCenter, criteria: SearchCriteria): ScoredCenter {
  // Distance: closer = higher (40%)
  const distanceScore = Math.max(0, 1 - center.distanceMiles / MAX_DISTANCE);

  // Quality: rating out of 5 (30%)
  const qualityScore = center.rating / 5;

  // Availability: walk-ins + low wait or soonest slot (20%)
  let availabilityScore = 0.4; // base for "tomorrow"
  if (center.nextAvailable.toLowerCase().includes("walk in now")) availabilityScore = 1;
  else if (center.nextAvailable.toLowerCase().includes("today")) availabilityScore = 0.85;
  if (center.walkInsAvailable && center.currentWaitMinutes !== null) {
    const waitScore = Math.max(0, 1 - center.currentWaitMinutes / 90);
    availabilityScore = Math.max(availabilityScore, waitScore);
  }
  if (criteria.urgent && center.acceptsEmergency) availabilityScore = Math.min(1, availabilityScore + 0.1);

  // Insurance match (10%)
  const inNetwork = criteria.insurance === "any" ? true : center.insurances.includes(criteria.insurance);
  const insuranceScore = inNetwork ? 1 : 0.2;

  const score =
    distanceScore * 0.4 + qualityScore * 0.3 + availabilityScore * 0.2 + insuranceScore * 0.1;

  // Build "why recommended" reasons
  const reasons: string[] = [];
  if (distanceScore > 0.7) reasons.push(`Just ${center.distanceMiles} mi away`);
  if (qualityScore >= 0.92) reasons.push(`Top-rated (${center.rating}★)`);
  if (criteria.urgent && center.acceptsEmergency) reasons.push("Accepts urgent cases");
  if (center.walkInsAvailable && center.currentWaitMinutes !== null && center.currentWaitMinutes <= 20)
    reasons.push(`Short wait (~${center.currentWaitMinutes} min)`);
  if (center.nextAvailable.toLowerCase().includes("today")) reasons.push("Same-day availability");
  if (criteria.insurance !== "any" && inNetwork) reasons.push(`In-network with ${criteria.insurance}`);
  if (criteria.modalities.length > 0) {
    const matched = criteria.modalities.filter((m) => center.modalities.includes(m));
    if (matched.length > 0) {
      reasons.push(
        matched.length === 1
          ? `Offers ${matched[0]}`
          : `Offers ${matched.length} selected scan types`,
      );
    }
  }

  return {
    ...center,
    score,
    distanceScore,
    qualityScore,
    availabilityScore,
    insuranceScore,
    inNetwork,
    reasons: reasons.slice(0, 3),
  };
}

function compareBySort(a: ScoredCenter, b: ScoredCenter, sortBy: SortBy): number {
  let cmp = 0;
  switch (sortBy) {
    case "relevance":
      cmp = b.score - a.score;
      break;
    case "rating":
      cmp = b.rating - a.rating;
      break;
    case "distance":
      cmp = a.distanceMiles - b.distanceMiles;
      break;
    case "price":
      cmp = a.estPriceRange.min - b.estPriceRange.min;
      break;
    case "turnaround":
      cmp = a.avgReportTurnaroundHours - b.avgReportTurnaroundHours;
      break;
    case "availability":
      cmp = b.availabilityScore - a.availabilityScore;
      break;
    case "popularity":
      cmp = b.reviewCount - a.reviewCount;
      break;
    default:
      cmp = b.score - a.score;
  }
  if (cmp !== 0) {
    return cmp;
  }
  return a.id.localeCompare(b.id);
}

export function rankCenters(
  centers: ImagingCenter[],
  criteria: SearchCriteria,
  sortBy: SortBy = "relevance",
  /** Max distance in miles; centers farther away are dropped. +Infinity = no cap. */
  radiusMiles: number = Number.POSITIVE_INFINITY,
): ScoredCenter[] {
  let pool = centers;
  if (criteria.modalities.length > 0) {
    pool = pool.filter((c) =>
      criteria.modalities.some((m) => c.modalities.includes(m)),
    );
  }
  let ranked = pool
    .map((c) => scoreCenter(c, criteria))
    .sort((a, b) => compareBySort(a, b, sortBy));
  if (Number.isFinite(radiusMiles) && radiusMiles > 0) {
    ranked = ranked.filter((c) => c.distanceMiles <= radiusMiles);
  }
  return ranked;
}

/** Human-readable line for the active sort (and optional Relevance subtext for non-relevance views). */
export function formatSortDetail(
  center: ScoredCenter,
  sortBy: SortBy,
): { primary: string; secondary?: string } {
  if (sortBy === "relevance") {
    return { primary: `Match ${Math.round(center.score * 100)}%` };
  }
  const rel = `Relevance ${Math.round(center.score * 100)}%`;
  switch (sortBy) {
    case "rating":
      return { primary: `${center.rating}★ rating`, secondary: rel };
    case "distance":
      return { primary: `${center.distanceMiles} mi from you`, secondary: rel };
    case "price":
      return { primary: "Est. cost (low to high)", secondary: rel };
    case "turnaround":
      return {
        primary: `~${center.avgReportTurnaroundHours}h avg report time`,
        secondary: rel,
      };
    case "availability":
      return { primary: `${Math.round(center.availabilityScore * 100)}% availability`, secondary: rel };
    case "popularity":
      return { primary: `${center.reviewCount} reviews`, secondary: rel };
    default:
      return { primary: `Match ${Math.round(center.score * 100)}%` };
  }
}
