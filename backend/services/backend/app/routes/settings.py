from __future__ import annotations

from flask import Blueprint, request

from job_tracker_shared.db import get_session
from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..models import User, UserSettings
from ..serializers import serialize_settings

settings_bp = Blueprint("settings", __name__, url_prefix="/v1/settings")


@settings_bp.get("")
def get_settings():
    session = get_session()
    user_id = get_user_id()
    user = session.get(User, user_id)
    if user is None:
        return error("User not found.", 404)
    settings = session.get(UserSettings, user_id)
    if settings is None:
        settings = UserSettings(user_id=user_id)
        session.add(settings)
        session.commit()
    return ok(serialize_settings(settings))


@settings_bp.patch("")
def patch_settings():
    session = get_session()
    user_id = get_user_id()
    user = session.get(User, user_id)
    if user is None:
        return error("User not found.", 404)
    current = session.get(UserSettings, user_id)
    if current is None:
        current = UserSettings(user_id=user_id)
        session.add(current)
    for key, value in (request.get_json(silent=True) or {}).items():
        setattr(current, key, value)
    session.commit()
    return ok(serialize_settings(current))
