from __future__ import annotations

from job_tracker_shared.responses import error

from .models import Application, Task


def validate_application_ownership(session, user_id: str, application_id: str | None):
    if not application_id:
        return None

    application = session.get(Application, application_id)
    if application is None or application.user_id != user_id or application.deleted_at is not None:
        return error("Application not found.", 404)
    return None


def validate_task_ownership(session, user_id: str, task_id: str | None):
    if not task_id:
        return None

    task = session.get(Task, task_id)
    if task is None or task.user_id != user_id or task.deleted_at is not None:
        return error("Task not found.", 404)
    return None


def validate_reminder_references(
    session,
    user_id: str,
    *,
    application_id: str | None,
    task_id: str | None,
):
    application_error = validate_application_ownership(session, user_id, application_id)
    if application_error is not None:
        return application_error

    task_error = validate_task_ownership(session, user_id, task_id)
    if task_error is not None:
        return task_error

    return None
