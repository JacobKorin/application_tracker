from __future__ import annotations

from flask import Blueprint, request

from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import ok

settings_bp = Blueprint("settings", __name__, url_prefix="/v1/settings")

SETTINGS: dict[str, dict] = {
    "demo-user": {
        "user_id": "demo-user",
        "timezone": "America/Toronto",
        "theme": "sunrise",
        "weekly_summary": True,
    }
}


@settings_bp.get("")
def get_settings():
    user_id = get_user_id()
    return ok(SETTINGS.setdefault(user_id, {"user_id": user_id, "timezone": "UTC", "theme": "sunrise"}))


@settings_bp.patch("")
def patch_settings():
    user_id = get_user_id()
    current = SETTINGS.setdefault(user_id, {"user_id": user_id, "timezone": "UTC", "theme": "sunrise"})
    payload = request.get_json(silent=True) or {}
    current.update(payload)
    return ok(current)

