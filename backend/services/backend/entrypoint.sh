#!/bin/sh
set -e

cd /app/backend
alembic upgrade head
cd /app/backend/services/backend
exec gunicorn --bind "0.0.0.0:${PORT:-8000}" --workers "${WEB_CONCURRENCY:-1}" wsgi:app
