from __future__ import annotations

from flask import Blueprint, current_app

from job_tracker_shared.responses import ok

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    config = current_app.config["SERVICE_CONFIG"]
    return ok({"service": config.service_name, "status": "ok"})


@health_bp.get("/ready")
def ready():
    config = current_app.config["SERVICE_CONFIG"]
    return ok({"service": config.service_name, "status": "ready"})

