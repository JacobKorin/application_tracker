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

## Canonical local workflow

- Use this Windows checkout as the primary day-to-day repo for web and mobile development.
- Keep WSL optional for shell tooling only, not as a second repo that drifts from Windows.
- Keep `.env` local-only and use `.env.example` only as a sanitized template.
- Use Node `20.19.4` or newer for Expo SDK 54 and the current web/mobile toolchain.

### Backend

Create a Windows-friendly virtualenv from the repo root:

```powershell
python -m venv .venv
python -m pip --python .\.venv\Scripts\python.exe install --upgrade pip
python -m pip --python .\.venv\Scripts\python.exe install -e .\backend[dev]
```

Run the backend checks:

```powershell
npm run test:backend
npm run lint:backend
```

Run the main backend service:

```powershell
.\.venv\Scripts\python.exe .\backend\services\backend\wsgi.py
```

### Web

```powershell
npm install
npm run build:web
npm run dev:web
```

### Mobile

```powershell
npm install
npm run typecheck:mobile
npm run dev:mobile
```

For Windows + Expo Go testing, copy `.env.example` to `.env` and start the mobile app with a tunnel if your iPhone is not on the same LAN or Windows networking gets in the way:

```powershell
Copy-Item .env.example .env
npm install
npm --workspace mobile run start:tunnel
```

The mobile app persists the last successful sign-in locally so an app reload does not force a fresh login.

### Validation checklist

```powershell
npm run build:web
npm run typecheck:mobile
python -m compileall backend
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
