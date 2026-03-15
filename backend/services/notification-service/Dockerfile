FROM python:3.10-slim

WORKDIR /app

COPY backend /app/backend
RUN pip install --no-cache-dir -e /app/backend

CMD ["python", "backend/services/notification-service/wsgi.py"]

