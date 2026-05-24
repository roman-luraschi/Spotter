# Spotter HOS Frontend

React + TypeScript frontend for the Spotter Hours of Service assessment. It collects trip inputs,
calls the Django planner, displays an OpenStreetMap route, and draws ELD-style daily log sheets.

## Setup

```bash
npm install
npm run dev
```

By default, the frontend expects the Django API at `http://127.0.0.1:8000`.
Create `.env` from `.env.example` if you need to point to a different backend host.

## Environment

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Use the deployed Django host for production, for example:

```bash
VITE_API_BASE_URL=https://your-backend.example.com
```

## Backend

Run the Django backend from `../backend`:

```bash
python manage.py runserver
```

The app calls `POST /api/trips/plan/`.

## Build

```bash
npm run build
```

The static build is emitted to `dist/` and can be deployed to Vercel, Netlify, Render static sites,
or any static hosting provider. In production, configure Django CORS to allow the frontend origin.
