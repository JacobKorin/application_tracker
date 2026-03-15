from __future__ import annotations

from flask import Blueprint, request

from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import ok

from ..state import PREFERENCES

preferences_bp = Blueprint("preferences", __name__, url_prefix="/v1/notification-preferences")


@preferences_bp.get("")
def get_preferences():
    user_id = get_user_id()
    return ok(
        PREFERENCES.setdefault(
            user_id,
            {
                "user_id": user_id,
                "push_enabled": True,
                "email_enabled": True,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "07:00",
            },
        )
    )


@preferences_bp.patch("")
def patch_preferences():
    user_id = get_user_id()
    current = PREFERENCES.setdefault(
        user_id,
        {
            "user_id": user_id,
            "push_enabled": True,
            "email_enabled": True,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "07:00",
        },
    )
    current.update(request.get_json(silent=True) or {})
    return ok(current)

