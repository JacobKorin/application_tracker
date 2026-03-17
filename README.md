# Job Application Tracker

Production-oriented monorepo scaffold for a job application tracker with:

- `Next.js` web app
- `React Native` mobile app via Expo
- `Flask` backend optimized for low-cost Render deployment
- `PostgreSQL` and `Redis`
- `Render` deployment blueprint

## Repo layout

```text
backend/
  services/
    backend/
    api-gateway/
    identity-service/
    application-service/
    notification-service/
  shared/python/job_tracker_shared/
frontend/web/
mobile/
shared/
  contracts/
  design/
infra/render/
docs/
```

## Quick start

### Backend

1. Create a Python virtualenv.
2. Install the backend package from the repo root:

```bash
pip install ./backend
```

3. Run a service:

```bash
python backend/services/backend/wsgi.py
```

### Web

```bash
npm install
npm run dev:web
```

### Mobile

```bash
npm install
npm run dev:mobile
```

For Windows + Expo Go testing, copy `.env.example` to `.env` and start the mobile app with a tunnel if your iPhone is not on the same LAN or Windows networking gets in the way:

```powershell
Copy-Item .env.example .env
npm install
npm --workspace mobile run start:tunnel
```

### Local infrastructure

```bash
docker compose up --build
```

## Environment

Copy `.env.example` to `.env` and adjust values for local development. Production secrets should be managed through Render environment groups.

## Current status

This repository is a production-ready scaffold rather than a fully completed product. The following are implemented:

- single Flask deploy target for Render with versioned APIs
- preserved domain boundaries for identity, application, and notification concerns
- SQLAlchemy persistence layer with Alembic migrations
- shared API contract and design tokens
- web and mobile starter experiences for dashboard workflows
- Docker, CI, and Render blueprints

The following are intentionally stubbed for the next iteration:

- real Google OAuth, email delivery, and push provider integrations
- end-to-end auth enforcement across all clients
- full mobile navigation and offline sync
