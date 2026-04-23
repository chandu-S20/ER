# Clinic Advisor AI

Web app to find imaging centers by ZIP, filters (urgent, insurance, modality, radius), and sort. React (Vite) + TypeScript UI; optional **FastAPI** backend for ranked results (`/api/centers/rank`).

## Run locally

**Frontend** (port 8080):

```bash
npm install && npm run dev
```

**Backend** (optional — Vite proxies `/api` to port **8001**):

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8001
```

If the API is down, the results page falls back to in-browser ranking.

## Build

```bash
npm run build
```
