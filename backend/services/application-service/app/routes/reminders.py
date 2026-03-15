from __future__ import annotations

from flask import Blueprint, request

from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..store import REMINDERS, create_item, get_item, list_items, soft_delete_item, update_item

reminders_bp = Blueprint("reminders", __name__, url_prefix="/v1/reminders")


@reminders_bp.get("")
def list_reminders():
    return ok(list_items(REMINDERS, get_user_id()))


@reminders_bp.post("")
def create_reminder():
    payload = request.get_json(silent=True) or {}
    has_application = bool(payload.get("application_id"))
    has_task = bool(payload.get("task_id"))
    if not payload.get("title") or not payload.get("scheduled_for"):
        return error("Title and scheduled_for are required.", 400)
    if not (has_application or has_task):
        return error("Reminder must reference an application or a task.", 400)
    item = create_item(REMINDERS, get_user_id(), payload)
    return ok(item, 201)


@reminders_bp.patch("/<reminder_id>")
def patch_reminder(reminder_id: str):
    payload = request.get_json(silent=True) or {}
    if "application_id" in payload or "task_id" in payload:
        has_application = bool(payload.get("application_id"))
        has_task = bool(payload.get("task_id"))
        if not (has_application or has_task):
            return error("Reminder must reference an application or a task.", 400)
    updated = update_item(REMINDERS, get_user_id(), reminder_id, payload)
    if updated is None:
        return error("Reminder not found.", 404)
    return ok(updated)


@reminders_bp.delete("/<reminder_id>")
def delete_reminder(reminder_id: str):
    if not soft_delete_item(REMINDERS, get_user_id(), reminder_id):
        return error("Reminder not found.", 404)
    return ok({"id": reminder_id, "deleted": True})


@reminders_bp.get("/<reminder_id>")
def get_reminder(reminder_id: str):
    reminder = get_item(REMINDERS, get_user_id(), reminder_id)
    if reminder is None:
        return error("Reminder not found.", 404)
    return ok(reminder)

