from __future__ import annotations

from flask import Blueprint, current_app
from sqlalchemy import text

from job_tracker_shared.db import get_session
from job_tracker_shared.responses import error, ok

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    config = current_app.config["SERVICE_CONFIG"]
    return ok({"service": config.service_name, "status": "ok"})


@health_bp.get("/ready")
def ready():
    config = current_app.config["SERVICE_CONFIG"]
    session = get_session()
    try:
        session.execute(text("SELECT 1"))
    except Exception:
        session.rollback()
        current_app.logger.exception("Backend readiness check failed.")
        return error("Database is unavailable.", 503)
    return ok({"service": config.service_name, "status": "ready"})

