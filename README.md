# Spotter HOS Trip Planner

Full-stack technical assessment for **Spotter**: a trip planning application for property-carrying drivers that calculates routes, applies FMCSA Hours of Service (HOS) rules, and renders ELD-style daily log sheets.

The project is organized as a **monorepo** with a Django REST API and a React + TypeScript frontend.

---

## Features

- **Trip planning** — Enter current location, pickup, and drop-off; the backend geocodes addresses, builds a multi-leg route, and returns a complete plan.
- **Route visualization** — Interactive map (OpenStreetMap + Leaflet) with route polyline, stop markers, and turn-by-turn instructions.
- **HOS compliance engine** — Applies FMCSA property-carrying driver rules: 11-hour driving limit, 14-hour duty window, 30-minute break after 8 hours driving, 10-hour daily reset, 70-hour/8-day cycle, and 34-hour restart.
- **Stop scheduling** — Automatically inserts fuel stops (every 1,000 miles), pickup/drop-off time (1 hour each), rest breaks, and sleeper-berth resets.
- **Daily log sheets** — ELD-style grids per day with duty-status segments, totals, and remarks.
- **Location autocomplete** — Search suggestions powered by Nominatim (OpenStreetMap geocoding).

---

## Tech Stack

### Backend

| Tool | Purpose |
|------|---------|
| [Django 5](https://www.djangoproject.com/) | Web framework |
| [Django REST Framework](https://www.django-rest-framework.org/) | JSON API |
| [django-cors-headers](https://github.com/adamchainz/django-cors-headers) | Cross-origin requests for the frontend |
| [SQLite](https://www.sqlite.org/) | Default database (health check only; no persistent trip storage) |
| [OSRM](https://project-osrm.org/) | Road routing and distance/duration |
| [Nominatim](https://nominatim.org/) | Geocoding and location search |

### Frontend

| Tool | Purpose |
|------|---------|
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite 8](https://vite.dev/) | Dev server and build tool |
| [Material UI (MUI) 6](https://mui.com/) | Components and theming |
| [React Router 7](https://reactrouter.com/) | Client-side routing |
| [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/) | Map rendering |
| [OpenStreetMap](https://www.openstreetmap.org/) | Map tiles |

---

## Project Structure

```
Spotter/
├── backend/                    # Django REST API
│   ├── config/                 # Settings, URLs, WSGI/ASGI
│   └── apps/
│       ├── core/               # Health check, exception handler
│       ├── routing/            # Geocoding (Nominatim) + routing (OSRM)
│       ├── hos/                # HOS calculator + daily log builder
│       └── trips/              # Trip planner orchestration + API
├── frontend/                   # React SPA
│   └── src/
│       ├── app/                # Routes (Landing, Plan)
│       ├── components/         # UI by domain (trip, map, logs, stops, layout)
│       ├── context/            # TripPlanContext (shared plan state)
│       ├── lib/                # API client, formatters, validators
│       ├── theme/              # MUI theme
│       └── types/              # TypeScript interfaces
├── requirements.txt            # Python dependencies (backend)
└── README.md
```

### Backend apps

| App | Responsibility |
|-----|----------------|
| `core` | `GET /api/health/`, centralized API error responses |
| `routing` | Geocoding, OSRM routing, `GET /api/routing/locations/search/` |
| `hos` | FMCSA rule engine (`HOSCalculator`) and ELD log builder (`DailyLogBuilder`) |
| `trips` | `TripPlanner` service and `POST /api/trips/plan/` |

### Frontend modules

| Area | Key files |
|------|-----------|
| Landing | `LandingPage`, `TripPlannerForm` — trip input form |
| Plan dashboard | `PlanPage`, `TripSearchBar`, `TripSummaryCards` |
| Map | `RouteMap` — route polyline, markers, instructions |
| Logs | `DailyLogTabs`, `DailyLogSheet`, `LogTotals` |
| Stops | `StopsTimeline` — scheduled stops timeline |
| State | `TripPlanContext` — plan result, loading, errors |

---

## How It Works

```
User input (locations + cycle hours)
        │
        ▼
  Nominatim geocoding
        │
        ▼
  OSRM multi-leg routing (current → pickup → drop-off)
        │
        ▼
  Work items (driving segments, fuel, pickup, drop-off)
        │
        ▼
  HOS calculator (breaks, resets, cycle limits)
        │
        ▼
  Daily log builder → JSON response
        │
        ▼
  React UI (map, summary, stops, log sheets)
```

---

## API

### `GET /api/health/`

Health check endpoint.

### `GET /api/routing/locations/search/?q=Chicago`

Returns location suggestions for autocomplete (minimum 2 characters).

### `POST /api/trips/plan/`

**Request:**

```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "St. Louis, MO",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used_hours": 12
}
```

**Response (summary):**

| Field | Description |
|-------|-------------|
| `route` | Distance, duration, geometry, and legs |
| `stops` | Non-driving events (fuel, pickup, drop-off, rest) |
| `hos_summary` | Totals, trip duration, violations (if any) |
| `daily_logs` | Per-day ELD grids with segments and totals |
| `timeline` | Full ordered list of duty events |

---

## HOS Rules (Property-Carrying Drivers)

| Rule | Value |
|------|-------|
| Max driving per day | 11 hours |
| Max duty window | 14 hours |
| Required break | 30 min after 8 hours driving |
| Daily reset | 10 consecutive hours off duty / sleeper berth |
| Cycle limit | 70 hours in 8 days |
| Cycle restart | 34 consecutive hours off duty |
| Fuel stop | Every 1,000 miles (30 min on duty) |
| Pickup / drop-off | 1 hour on duty each |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 20+
- npm

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r ../requirements.txt
python manage.py migrate
python manage.py runserver
```

API runs at `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # optional — defaults to local backend
npm run dev
```

App runs at `http://127.0.0.1:5173`.

### Run tests (backend)

```bash
cd backend
python manage.py test
```

---

## Environment Variables

### Backend (`backend/`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | dev key | Django secret key |
| `DJANGO_DEBUG` | `true` | Debug mode |
| `DJANGO_ALLOWED_HOSTS` | `*` | Comma-separated hosts |
| `CORS_ALLOW_ALL_ORIGINS` | `true` | Allow all CORS origins (disable in production) |
| `CORS_ALLOWED_ORIGINS` | — | Comma-separated allowed origins |
| `OSRM_BASE_URL` | OSRM public demo | Routing service URL |
| `NOMINATIM_BASE_URL` | Nominatim OSM | Geocoding service URL |
| `NOMINATIM_USER_AGENT` | `spotter-hos-assessment/1.0` | Required by Nominatim |
| `ROUTING_TIMEOUT_SECONDS` | `20` | HTTP timeout for external routing APIs |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000` | Backend API base URL |

---

## Build & Deploy

### Frontend production build

```bash
cd frontend
npm run build
```

Static output is written to `frontend/dist/`. Deploy to Vercel, Netlify, or any static host.

### Production notes

- Set `VITE_API_BASE_URL` to your deployed Django host.
- Configure `CORS_ALLOWED_ORIGINS` on the backend to allow the frontend origin.
- Set `DJANGO_DEBUG=false` and a strong `DJANGO_SECRET_KEY`.
- The public OSRM/Nominatim endpoints are rate-limited; use dedicated instances for production traffic.

---

## Development Phases

This repository covers both assessment phases in a single codebase:

| Phase | Scope | Location |
|-------|-------|----------|
| **Phase 1** | Backend API — routing, HOS engine, trip planner | `backend/` |
| **Phase 2** | React UI — map, log sheets, trip dashboard | `frontend/` |

Git history (commits or tags) can be used to show incremental delivery if needed.

---

## Further Reading

- [Backend README](backend/README.md) — API setup and test commands
- [Frontend README](frontend/README.md) — frontend setup and build details
