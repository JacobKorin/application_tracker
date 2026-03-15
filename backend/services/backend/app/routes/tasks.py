from __future__ import annotations

from flask import Blueprint, request

from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..state import TASKS, create_item, get_item, list_items, soft_delete_item, update_item

tasks_bp = Blueprint("tasks", __name__, url_prefix="/v1/tasks")


@tasks_bp.get("")
def list_tasks():
    return ok(list_items(TASKS, get_user_id()))


@tasks_bp.post("")
def create_task():
    payload = request.get_json(silent=True) or {}
    if not payload.get("title"):
        return error("Title is required.", 400)
    item = create_item(TASKS, get_user_id(), payload)
    return ok(item, 201)


@tasks_bp.get("/<task_id>")
def get_task(task_id: str):
    task = get_item(TASKS, get_user_id(), task_id)
    if task is None:
        return error("Task not found.", 404)
    return ok(task)


@tasks_bp.patch("/<task_id>")
def patch_task(task_id: str):
    updated = update_item(TASKS, get_user_id(), task_id, request.get_json(silent=True) or {})
    if updated is None:
        return error("Task not found.", 404)
    return ok(updated)


@tasks_bp.delete("/<task_id>")
def delete_task(task_id: str):
    if not soft_delete_item(TASKS, get_user_id(), task_id):
        return error("Task not found.", 404)
    return ok({"id": task_id, "deleted": True})

