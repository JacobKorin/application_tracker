# Operations Notes

## Environments

- `dev`: local Docker Compose and direct backend execution
- `staging`: Render web frontend plus one public Flask backend service
- `prod`: same service shape with isolated credentials and stricter alerting

## Minimum production controls

- health and readiness endpoints on the backend service
- structured JSON logging
- centralized error reporting
- database backups and restore rehearsal
- secrets managed by platform environment groups
- CI gates for tests and syntax checks before deploy

## Current deployment shape

- `application-tracker-suvm`: Flask backend Docker service on Render.
- `job-tracker-web`: Next.js web Docker service on Render.
- `job-tracker-postgres`: managed Render Postgres database.

The backend entrypoint runs Alembic migrations before Gunicorn starts. The web
service points at the backend through `NEXT_PUBLIC_API_BASE_URL`.

## Remaining implementation plan

1. Add rollback rehearsal for Alembic migrations.
2. Add Redis-backed worker deployment only when notification fanout or other
   background jobs are implemented.
3. Integrate real providers for Google OAuth, email, and push notifications.
4. Add centralized error reporting and production alerting.
5. Expand web/mobile automated coverage beyond backend regression tests.

## RPO / RTO targets

- target RPO: under 15 minutes after managed backup + WAL strategy is enabled
- target RTO: under 60 minutes for a regional service outage
