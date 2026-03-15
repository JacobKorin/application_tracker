from __future__ import annotations

from flask import current_app
from flask import Blueprint, request

from job_tracker_shared.db import get_session
from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..db_helpers import ensure_user, parse_datetime
from ..models import Application, ApplicationStageEvent, utc_now
from ..serializers import serialize_application

applications_bp = Blueprint("applications", __name__, url_prefix="/v1/applications")


@applications_bp.get("")
def list_applications():
    session = get_session()
    user_id = get_user_id()
    applications = (
        session.query(Application)
        .filter(Application.user_id == user_id, Application.deleted_at.is_(None))
        .order_by(Application.updated_at.desc())
        .all()
    )
    return ok([serialize_application(application) for application in applications])


@applications_bp.post("")
def create_application():
    session = get_session()
    payload = request.get_json(silent=True) or {}
    if not payload.get("company") or not payload.get("title"):
        return error("Company and title are required.", 400)

    user_id = get_user_id()
    default_email = current_app.config["SERVICE_CONFIG"].default_user_email
    ensure_user(session, user_id, default_email)
    stage = payload.get("status", "saved")
    application = Application(
        user_id=user_id,
        company=payload["company"],
        title=payload["title"],
        status=stage,
        location=payload.get("location"),
        salary_range=payload.get("salary_range"),
        applied_at=parse_datetime(payload.get("applied_at")),
        notes=payload.get("notes", []),
        interview_date=parse_datetime(payload.get("interview_date")),
    )
    application.stage_events.append(ApplicationStageEvent(stage=stage, timestamp=utc_now()))
    session.add(application)
    session.commit()
    session.refresh(application)
    return ok(serialize_application(application), 201)


@applications_bp.get("/<application_id>")
def get_application(application_id: str):
    session = get_session()
    item = session.get(Application, application_id)
    if item is None or item.user_id != get_user_id() or item.deleted_at is not None:
        return error("Application not found.", 404)
    return ok(serialize_application(item))


@applications_bp.patch("/<application_id>")
def patch_application(application_id: str):
    session = get_session()
    payload = request.get_json(silent=True) or {}
    item = session.get(Application, application_id)
    if item is None or item.user_id != get_user_id() or item.deleted_at is not None:
        return error("Application not found.", 404)

    if "status" in payload and payload["status"] != item.status:
        item.status = payload["status"]
        item.stage_events.append(ApplicationStageEvent(stage=payload["status"], timestamp=utc_now()))
    for field in ("company", "title", "location", "salary_range", "notes"):
        if field in payload:
            setattr(item, field, payload[field])
    if "applied_at" in payload:
        item.applied_at = parse_datetime(payload.get("applied_at"))
    if "interview_date" in payload:
        item.interview_date = parse_datetime(payload.get("interview_date"))
    session.commit()
    return ok(serialize_application(item))


@applications_bp.delete("/<application_id>")
def delete_application(application_id: str):
    session = get_session()
    item = session.get(Application, application_id)
    if item is None or item.user_id != get_user_id() or item.deleted_at is not None:
        return error("Application not found.", 404)
    item.deleted_at = utc_now()
    session.commit()
    return ok({"id": application_id, "deleted": True})
