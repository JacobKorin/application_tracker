# Architecture Overview

## Deployable services

### Backend
- single public Flask service for web and mobile clients
- exposes versioned APIs for auth, applications, contacts, tasks, reminders, and notifications
- chosen for low-cost hosting on Render without private services

### Web
- public Next.js frontend
- calls the backend using `NEXT_PUBLIC_API_BASE_URL`

## Domain boundaries retained in code

- identity: account lifecycle, settings, auth stubs
- applications: applications, stage history, tasks, contacts, reminders
- notifications: preferences, delivery log, idempotent dispatch

## Data flow

1. Clients call the public backend service.
2. The backend handles versioned route groups directly.
3. Background side effects move to workers in the next phase.
4. PostgreSQL becomes the system of record and Redis backs queueing and caching.

## Current implementation notes

- The scaffold uses in-memory repositories so the APIs are immediately runnable.
- Route shapes and domain boundaries are designed to survive a future split back into microservices if needed.
- Notification dispatch includes idempotency handling to preserve the intended contract.
