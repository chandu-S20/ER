from __future__ import annotations

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from centers_data import MOCK_CENTERS
from scoring import _parse_radius_query, rank_centers

app = FastAPI(title="Clarity Imaging API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


SORT_CHOICES = frozenset(
    {
        "relevance",
        "rating",
        "distance",
        "price",
        "turnaround",
        "availability",
        "popularity",
    }
)


@app.get("/api/centers/rank")
def rank(
    urgent: bool = Query(False),
    insurance: str = Query("any"),
    modality: str = Query("any"),
    sort: str = Query("relevance", description="How to order results; default relevance."),
    loc: str | None = Query(
        None,
        description="Service area, typically a 5-digit U.S. ZIP (placeholder; distance uses seed data today).",
    ),
    radius: str = Query(
        "25",
        description="Maximum distance in miles, or 'any' for no limit.",
    ),
) -> dict:
    _ = loc  # reserved for future geocoding
    sort_key = sort if sort in SORT_CHOICES else "relevance"
    centers = rank_centers(
        MOCK_CENTERS,
        urgent=urgent,
        insurance=insurance,
        modality=modality,
        sort=sort_key,
        max_distance_miles=_parse_radius_query(radius),
    )
    return {"centers": centers}
