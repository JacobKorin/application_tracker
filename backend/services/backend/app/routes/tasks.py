from __future__ import annotations

from flask import current_app
from flask import Blueprint, request

from job_tracker_shared.db import get_session
from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..db_helpers import ensure_user, parse_datetime
from ..models import Task, utc_now
from ..serializers import serialize_task

tasks_bp = Blueprint("tasks", __name__, url_prefix="/v1/tasks")


@tasks_bp.get("")
def list_tasks():
    session = get_session()
    user_id = get_user_id()
    tasks = (
        session.query(Task)
        .filter(Task.user_id == user_id, Task.deleted_at.is_(None))
        .order_by(Task.updated_at.desc())
        .all()
    )
    return ok([serialize_task(task) for task in tasks])


@tasks_bp.post("")
def create_task():
    session = get_session()
    payload = request.get_json(silent=True) or {}
    if not payload.get("title"):
        return error("Title is required.", 400)
    user_id = get_user_id()
    default_email = current_app.config["SERVICE_CONFIG"].default_user_email
    ensure_user(session, user_id, default_email)
    item = Task(
        user_id=user_id,
        title=payload["title"],
        application_id=payload.get("application_id"),
        due_at=parse_datetime(payload.get("due_at")),
        completed=payload.get("completed", False),
    )
    session.add(item)
    session.commit()
    return ok(serialize_task(item), 201)


@tasks_bp.get("/<task_id>")
def get_task(task_id: str):
    session = get_session()
    task = session.get(Task, task_id)
    if task is None or task.user_id != get_user_id() or task.deleted_at is not None:
        return error("Task not found.", 404)
    return ok(serialize_task(task))


@tasks_bp.patch("/<task_id>")
def patch_task(task_id: str):
    session = get_session()
    task = session.get(Task, task_id)
    if task is None or task.user_id != get_user_id() or task.deleted_at is not None:
        return error("Task not found.", 404)
    payload = request.get_json(silent=True) or {}
    for field in ("title", "application_id", "completed"):
        if field in payload:
            setattr(task, field, payload[field])
    if "due_at" in payload:
        task.due_at = parse_datetime(payload.get("due_at"))
    session.commit()
    return ok(serialize_task(task))


@tasks_bp.delete("/<task_id>")
def delete_task(task_id: str):
    session = get_session()
    task = session.get(Task, task_id)
    if task is None or task.user_id != get_user_id() or task.deleted_at is not None:
        return error("Task not found.", 404)
    task.deleted_at = utc_now()
    session.commit()
    return ok({"id": task_id, "deleted": True})
