# Clinic Advisor AI

Web app to find imaging centers by ZIP, filters (urgent, insurance, modality, radius), and sort.

## Features & decisions

- **Stack** — React (Vite) + TypeScript; optional **FastAPI** at `/api/centers/rank` so you can run the UI alone or centralize ranking on the server.
- **Search & data** — 5-digit U.S. ZIP, optional radius (miles or no limit) in the URL; distances and centers are **mock/seed** until a real geocoder backs `loc`.
- **Consistent ranking** — Same filters and radius on the API and in **browser fallback** when `/api/centers/rank` fails (URL + `parseRadiusMilesParam` / `radiusParamForQuery` on the client; `_parse_radius_query` + `max_distance_miles` on the server).
- **Filters & results chrome** — Urgent, insurance, modality; **sticky** results header with ZIP, radius line, filter pills, and a Filters popover.
- **Scores & sort** — Default **relevance** weights distance, quality, availability, and insurance; other sorts **re-order** without changing **Match %**. **Sort by price** uses `estPriceRange` in data but **no dollar amounts** on cards.
- **Home form layout** — ZIP and “Search within” share **matching field shells** and sit **in one row** from `sm` up.
- **Center cards** — One metric strip (distance, wait, coverage, avg report time, match); **Expert Radiology** badge when flagged network-owned; **yellow** star for rating.
- **Referral-first** — **Refer** opens patient + insurance dialog and shows **Referred** after submit; **Call** uses `tel:`; both sit to the right of **Scans** / **Known for** from `sm+` (no separate divider strip above actions).
- **Copy** — The ranking-weight footnote (“40% / 30% …”) is on the **home** page only, not on results.

## Run locally

**Frontend** (port 8080):

```bash
npm install && npm run dev
```

**Backend** (optional — Vite proxies `/api` to port **8001**):

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8001
```

## Build

```bash
npm run build
```
