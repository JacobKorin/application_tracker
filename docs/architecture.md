# Architecture Overview

## Services

### API Gateway
- public entrypoint for web and mobile
- routes versioned APIs to internal services
- intended home for auth validation, rate limiting, and response composition

### Identity Service
- account lifecycle
- session/token issuance
- user settings and preferences not owned by another domain

### Application Service
- applications
- stage history
- tasks
- contacts
- reminders and activity metadata

### Notification Service
- notification preferences
- delivery log
- asynchronous dispatch boundary for email and push

## Data flow

1. Clients call `api-gateway`.
2. Gateway forwards requests to private services.
3. Services publish side effects to async workers in the next phase.
4. PostgreSQL becomes the system of record and Redis backs queueing and caching.

## Current implementation notes

- The scaffold uses in-memory repositories so the APIs are immediately runnable.
- Route shapes and service boundaries are designed to survive migration to durable storage.
- Notification dispatch includes idempotency handling to preserve the intended contract.

