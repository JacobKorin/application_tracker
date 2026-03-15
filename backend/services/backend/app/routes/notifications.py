from __future__ import annotations

from flask import Blueprint, request

from job_tracker_shared.db import get_session
from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..models import NotificationLog, User
from ..serializers import serialize_notification

notifications_bp = Blueprint("notifications", __name__, url_prefix="/v1/notifications")


@notifications_bp.get("")
def list_notifications():
    session = get_session()
    notifications = (
        session.query(NotificationLog)
        .filter(NotificationLog.user_id == get_user_id())
        .order_by(NotificationLog.sent_at.desc())
        .all()
    )
    return ok([serialize_notification(notification) for notification in notifications])


@notifications_bp.post("/dispatch")
def dispatch_notification():
    session = get_session()
    key = request.headers.get("X-Idempotency-Key")
    if not key:
        return error("X-Idempotency-Key header is required.", 400)
    existing = session.query(NotificationLog).filter(NotificationLog.idempotency_key == key).first()
    if existing is not None:
        return ok({"status": "duplicate", "idempotency_key": key})

    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id") or get_user_id()
    user = session.get(User, user_id)
    if user is None:
        return error("User not found.", 404)
    record = NotificationLog(
        user_id=user_id,
        title=payload.get("title", "Notification"),
        channel=payload.get("channel", "email"),
        status="sent",
        idempotency_key=key,
    )
    session.add(record)
    session.commit()
    return ok(serialize_notification(record), 201)
