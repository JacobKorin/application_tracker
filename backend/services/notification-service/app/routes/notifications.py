from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from flask import Blueprint, request

from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

notifications_bp = Blueprint("notifications", __name__, url_prefix="/v1/notifications")

NOTIFICATIONS: dict[str, list[dict]] = {
    "demo-user": [
        {
            "id": "notif-demo-1",
            "title": "Upcoming interview prep reminder",
            "channel": "push",
            "status": "sent",
            "sent_at": "2026-03-15T09:00:00+00:00",
        }
    ]
}

IDEMPOTENCY_KEYS: set[str] = set()


@notifications_bp.get("")
def list_notifications():
    return ok(NOTIFICATIONS.setdefault(get_user_id(), []))


@notifications_bp.post("/dispatch")
def dispatch_notification():
    key = request.headers.get("X-Idempotency-Key")
    if not key:
        return error("X-Idempotency-Key header is required.", 400)
    if key in IDEMPOTENCY_KEYS:
        return ok({"status": "duplicate", "idempotency_key": key})

    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id") or get_user_id()
    record = {
        "id": str(uuid4()),
        "title": payload.get("title", "Notification"),
        "channel": payload.get("channel", "email"),
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }
    NOTIFICATIONS.setdefault(user_id, []).append(record)
    IDEMPOTENCY_KEYS.add(key)
    return ok(record, 201)

