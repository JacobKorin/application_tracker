# Architecture Overview

## System shape

The application is a small full-stack job application tracker with one durable
backend API, one web frontend, and one mobile frontend.

### Backend

- Single public Flask service in `backend/services/backend`.
- Exposes versioned `/v1` APIs for auth, settings, applications, contacts,
  tasks, reminders, notification preferences, and notification logs.
- Uses SQLAlchemy models and Alembic migrations for durable persistence.
- Uses PostgreSQL in deployed environments and SQLite-compatible defaults for
  local development/test workflows.
- Runs as one Render web service to keep hosting simple and inexpensive.

### Web

- Next.js app in `frontend/web`.
- Reads the backend URL from `NEXT_PUBLIC_API_BASE_URL`.
- Stores the backend JWT in an `httpOnly` session cookie and performs API
  calls from server-rendered pages and server actions.

### Mobile

- Expo/React Native app in `mobile`.
- Reads the backend URL from `EXPO_PUBLIC_API_BASE_URL`, with a deployed Render
  URL fallback.
- Stores the last successful session in AsyncStorage and sends the JWT as a
  Bearer token on API calls.

## Backend module boundaries

The repo no longer keeps separate scaffold services for gateway, identity,
application, or notification concerns. Those boundaries now live inside the
single Flask app as route modules and helper modules:

- identity/account: `routes/auth.py`, `routes/settings.py`, shared JWT helpers
- applications: `routes/applications.py`, stage history models/serializers
- execution: `routes/tasks.py`, `routes/reminders.py`, ownership validators
- contacts: `routes/contacts.py`
- notifications: `routes/preferences.py`, `routes/notifications.py`
- operations: `routes/health.py`, database/session setup, structured logging

This keeps the code organized by domain without carrying unused microservice
scaffolding.

## Data flow

1. Web or mobile clients authenticate through `/v1/auth/sign-in` or
   `/v1/auth/sign-up`.
2. The backend returns a JWT for the user.
3. Web stores the token in an `httpOnly` cookie; mobile stores the session in
   AsyncStorage.
4. Clients call the single Flask backend with `Authorization: Bearer <token>`.
5. Backend routes derive the user from the token, validate ownership for
   linked records, and read/write through SQLAlchemy.
6. Responses use a consistent JSON envelope: `{ "data": ... }` for success or
   `{ "error": { "message": ... } }` for failures.

## Persistence model

PostgreSQL is the production system of record. Alembic migrations in
`backend/alembic/versions` define schema changes. The main model file,
`backend/services/backend/app/models.py`, defines users, settings,
applications, stage events, tasks, contacts, reminders, notification
preferences, notification logs, and auth rate-limit events.

Most user-owned records include `user_id`. Application/task/contact/reminder
deletes are soft deletes through `deleted_at`, so normal reads hide deleted
records without immediately removing rows.

## Operational notes

- `/health` reports process liveness.
- `/ready` verifies database connectivity.
- The backend container runs `alembic upgrade head` before starting Gunicorn.
- Redis is present in local Docker Compose for planned queue/cache work, but
  the current backend does not depend on Redis at runtime.
- Notification dispatch currently records idempotent notification logs; real
  email/push provider delivery remains a future integration.
