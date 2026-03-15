#!/bin/sh
set -e

cd /app/backend
alembic upgrade head
cd /app
python backend/services/backend/wsgi.py

