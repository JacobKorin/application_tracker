# Operations Notes

## Environments

- `dev`: local Docker Compose and per-service direct execution
- `staging`: Render private services plus managed PostgreSQL/Redis
- `prod`: Render production stack with isolated credentials and stricter alerting

## Minimum production controls

- health and readiness endpoints on every service
- structured JSON logging
- centralized error reporting
- database backups and restore rehearsal
- secrets managed by platform environment groups
- CI gates for tests and syntax checks before deploy

## Migration plan

1. Replace in-memory repositories with SQLAlchemy-backed persistence.
2. Add Alembic migrations and rollback testing.
3. Add async worker deployment for notification fanout.
4. Integrate real providers for Google OAuth, email, and push notifications.

## RPO / RTO targets

- target RPO: under 15 minutes after managed backup + WAL strategy is enabled
- target RTO: under 60 minutes for a regional service outage

