# Spotter HOS Backend

Django/DRF backend for the Spotter full-stack assessment. It accepts trip details, resolves a route, applies FMCSA Hours of Service assumptions for property-carrying drivers, and returns route stops plus daily log data for the React UI.

## Setup

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r ../requirements.txt
python manage.py migrate
python manage.py runserver
```

## API

`POST /api/trips/plan/`

```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "St. Louis, MO",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used_hours": 12
}
```

The response contains `route`, `stops`, `hos_summary`, `daily_logs`, and `timeline`.

## Tests

```bash
python manage.py test
```
