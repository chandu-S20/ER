# Port of src/lib/scoring.ts — keep in sync when changing ranking rules.

from __future__ import annotations

from copy import deepcopy
from typing import Any

MAX_DISTANCE = 6.0


def _score_center(
    center: dict[str, Any],
    *,
    urgent: bool,
    insurance: str,
    modalities: list[str],
) -> dict[str, Any]:
    c = center
    distance_miles = float(c["distanceMiles"])
    distance_score = max(0.0, 1.0 - distance_miles / MAX_DISTANCE)

    rating = float(c["rating"])
    quality_score = rating / 5.0

    availability_score = 0.4
    na = str(c["nextAvailable"]).lower()
    if "walk in now" in na:
        availability_score = 1.0
    elif "today" in na:
        availability_score = 0.85
    if c.get("walkInsAvailable") and c.get("currentWaitMinutes") is not None:
        wait = int(c["currentWaitMinutes"])
        wait_score = max(0.0, 1.0 - wait / 90.0)
        availability_score = max(availability_score, wait_score)
    if urgent and c.get("acceptsEmergency"):
        availability_score = min(1.0, availability_score + 0.1)

    ins = list(c.get("insurances") or [])
    in_network = True if insurance == "any" else insurance in ins
    insurance_score = 1.0 if in_network else 0.2

    score = (
        distance_score * 0.4
        + quality_score * 0.3
        + availability_score * 0.2
        + insurance_score * 0.1
    )

    reasons: list[str] = []
    if distance_score > 0.7:
        reasons.append(f"Just {distance_miles} mi away")
    if quality_score >= 0.92:
        reasons.append(f"Top-rated ({rating}★)")
    if urgent and c.get("acceptsEmergency"):
        reasons.append("Accepts urgent cases")
    if (
        c.get("walkInsAvailable")
        and c.get("currentWaitMinutes") is not None
        and int(c["currentWaitMinutes"]) <= 20
    ):
        reasons.append(f"Short wait (~{c['currentWaitMinutes']} min)")
    if "today" in na:
        reasons.append("Same-day availability")
    if insurance != "any" and in_network:
        reasons.append(f"In-network with {insurance}")
    mos = list(c.get("modalities") or [])
    if modalities:
        matched = [m for m in modalities if m in mos]
        if matched:
            if len(matched) == 1:
                reasons.append(f"Offers {matched[0]}")
            else:
                reasons.append(f"Offers {len(matched)} selected scan types")

    out = deepcopy(c)
    out.update(
        {
            "score": score,
            "distanceScore": distance_score,
            "qualityScore": quality_score,
            "availabilityScore": availability_score,
            "insuranceScore": insurance_score,
            "inNetwork": in_network,
            "reasons": reasons[:3],
        }
    )
    return out


def _sort_tuple(sc: dict[str, Any], sort: str) -> tuple:
    _id = str(sc.get("id", ""))
    if sort == "relevance":
        return (-float(sc["score"]), _id)
    if sort == "rating":
        return (-float(sc["rating"]), _id)
    if sort == "distance":
        return (float(sc["distanceMiles"]), _id)
    if sort == "price":
        return (float(sc["estPriceRange"]["min"]), _id)
    if sort == "turnaround":
        return (float(sc["avgReportTurnaroundHours"]), _id)
    if sort == "availability":
        return (-float(sc["availabilityScore"]), _id)
    if sort == "popularity":
        return (-int(sc["reviewCount"]), _id)
    return (-float(sc["score"]), _id)


def rank_centers(
    centers: list[dict[str, Any]],
    *,
    urgent: bool = False,
    insurance: str = "any",
    modality: str = "any",
    sort: str = "relevance",
    max_distance_miles: float | None = None,
) -> list[dict[str, Any]]:
    modalities = [m.strip() for m in modality.split(",") if m.strip() and m.strip() != "any"]
    pool = centers
    if modalities:
        pool = [
            c
            for c in centers
            if any(m in (c.get("modalities") or []) for m in modalities)
        ]
    scored = [
        _score_center(c, urgent=urgent, insurance=insurance, modalities=modalities)
        for c in pool
    ]
    scored.sort(key=lambda sc: _sort_tuple(sc, sort))
    return _apply_radius_max(scored, max_distance_miles)


def _apply_radius_max(
    scored: list[dict[str, Any]],
    max_distance_miles: float | None,
) -> list[dict[str, Any]]:
    if max_distance_miles is None or max_distance_miles <= 0:
        return scored
    return [c for c in scored if float(c.get("distanceMiles", 1e9)) <= max_distance_miles]


def _parse_radius_query(r: str) -> float | None:
    """'25' -> 25.0; 'any' / empty -> no limit (None)."""
    s = (r or "25").strip().lower()
    if s in ("any", "all", ""):
        return None
    try:
        v = float(s)
    except (TypeError, ValueError):
        return 25.0
    if v <= 0:
        return None
    return min(v, 500.0)
