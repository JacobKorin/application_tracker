FROM python:3.10-slim

WORKDIR /app

COPY backend /app/backend
RUN pip install --no-cache-dir /app/backend

RUN chmod +x /app/backend/services/backend/entrypoint.sh

CMD ["/app/backend/services/backend/entrypoint.sh"]
