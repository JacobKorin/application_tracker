from __future__ import annotations

from flask import current_app
from flask import Blueprint, request

from job_tracker_shared.db import get_session
from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..db_helpers import ensure_user, parse_datetime
from ..models import Reminder, utc_now
from ..serializers import serialize_reminder

reminders_bp = Blueprint("reminders", __name__, url_prefix="/v1/reminders")


@reminders_bp.get("")
def list_reminders():
    session = get_session()
    user_id = get_user_id()
    reminders = (
        session.query(Reminder)
        .filter(Reminder.user_id == user_id, Reminder.deleted_at.is_(None))
        .order_by(Reminder.updated_at.desc())
        .all()
    )
    return ok([serialize_reminder(reminder) for reminder in reminders])


@reminders_bp.post("")
def create_reminder():
    session = get_session()
    payload = request.get_json(silent=True) or {}
    has_application = bool(payload.get("application_id"))
    has_task = bool(payload.get("task_id"))
    if not payload.get("title") or not payload.get("scheduled_for"):
        return error("Title and scheduled_for are required.", 400)
    if not (has_application or has_task):
        return error("Reminder must reference an application or a task.", 400)
    user_id = get_user_id()
    default_email = current_app.config["SERVICE_CONFIG"].default_user_email
    ensure_user(session, user_id, default_email)
    item = Reminder(
        user_id=user_id,
        title=payload["title"],
        application_id=payload.get("application_id"),
        task_id=payload.get("task_id"),
        scheduled_for=parse_datetime(payload["scheduled_for"]),
        channel=payload.get("channel", "push"),
    )
    session.add(item)
    session.commit()
    return ok(serialize_reminder(item), 201)


@reminders_bp.get("/<reminder_id>")
def get_reminder(reminder_id: str):
    session = get_session()
    reminder = session.get(Reminder, reminder_id)
    if reminder is None or reminder.user_id != get_user_id() or reminder.deleted_at is not None:
        return error("Reminder not found.", 404)
    return ok(serialize_reminder(reminder))


@reminders_bp.patch("/<reminder_id>")
def patch_reminder(reminder_id: str):
    session = get_session()
    payload = request.get_json(silent=True) or {}
    if "application_id" in payload or "task_id" in payload:
        has_application = bool(payload.get("application_id"))
        has_task = bool(payload.get("task_id"))
        if not (has_application or has_task):
            return error("Reminder must reference an application or a task.", 400)
    reminder = session.get(Reminder, reminder_id)
    if reminder is None or reminder.user_id != get_user_id() or reminder.deleted_at is not None:
        return error("Reminder not found.", 404)
    for field in ("title", "application_id", "task_id", "channel"):
        if field in payload:
            setattr(reminder, field, payload[field])
    if "scheduled_for" in payload:
        reminder.scheduled_for = parse_datetime(payload.get("scheduled_for"))
    session.commit()
    return ok(serialize_reminder(reminder))


@reminders_bp.delete("/<reminder_id>")
def delete_reminder(reminder_id: str):
    session = get_session()
    reminder = session.get(Reminder, reminder_id)
    if reminder is None or reminder.user_id != get_user_id() or reminder.deleted_at is not None:
        return error("Reminder not found.", 404)
    reminder.deleted_at = utc_now()
    session.commit()
    return ok({"id": reminder_id, "deleted": True})
