from __future__ import annotations

from flask import Blueprint, request

from job_tracker_shared.db import get_session
from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..models import NotificationPreference, User
from ..serializers import serialize_notification_preference

preferences_bp = Blueprint("preferences", __name__, url_prefix="/v1/notification-preferences")


@preferences_bp.get("")
def get_preferences():
    session = get_session()
    user_id = get_user_id()
    user = session.get(User, user_id)
    if user is None:
        return error("User not found.", 404)
    preference = session.get(NotificationPreference, user_id)
    if preference is None:
        preference = NotificationPreference(user_id=user_id)
        session.add(preference)
        session.commit()
    return ok(serialize_notification_preference(preference))


@preferences_bp.patch("")
def patch_preferences():
    session = get_session()
    user_id = get_user_id()
    user = session.get(User, user_id)
    if user is None:
        return error("User not found.", 404)
    current = session.get(NotificationPreference, user_id)
    if current is None:
        current = NotificationPreference(user_id=user_id)
        session.add(current)
    for key, value in (request.get_json(silent=True) or {}).items():
        setattr(current, key, value)
    session.commit()
    return ok(serialize_notification_preference(current))
