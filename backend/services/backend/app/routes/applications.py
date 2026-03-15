from __future__ import annotations

from math import ceil

from sqlalchemy import or_
from flask import Blueprint, request

from job_tracker_shared.db import get_session
from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..db_helpers import parse_datetime
from ..models import Application, ApplicationStageEvent, User, utc_now
from ..serializers import serialize_application

applications_bp = Blueprint("applications", __name__, url_prefix="/v1/applications")

ALLOWED_SORTS = {
    "updated_desc": lambda query: query.order_by(Application.updated_at.desc()),
    "updated_asc": lambda query: query.order_by(Application.updated_at.asc()),
    "company_asc": lambda query: query.order_by(Application.company.asc(), Application.title.asc()),
    "company_desc": lambda query: query.order_by(Application.company.desc(), Application.title.desc()),
    "status_asc": lambda query: query.order_by(Application.status.asc(), Application.updated_at.desc()),
    "status_desc": lambda query: query.order_by(Application.status.desc(), Application.updated_at.desc()),
}


@applications_bp.get("")
def list_applications():
    session = get_session()
    user_id = get_user_id()
    search = request.args.get("q", "").strip()
    status = request.args.get("status", "").strip()
    sort = request.args.get("sort", "updated_desc").strip()
    page = max(request.args.get("page", default=1, type=int) or 1, 1)
    per_page = request.args.get("per_page", default=25, type=int) or 25
    per_page = min(max(per_page, 1), 100)

    query = session.query(Application).filter(Application.user_id == user_id, Application.deleted_at.is_(None))

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Application.company.ilike(pattern),
                Application.title.ilike(pattern),
                Application.location.ilike(pattern),
            )
        )

    if status and status != "all":
        query = query.filter(Application.status == status)

    query = ALLOWED_SORTS.get(sort, ALLOWED_SORTS["updated_desc"])(query)
    total = query.count()
    total_pages = max(ceil(total / per_page), 1)
    if page > total_pages:
        page = total_pages

    applications = (
        query.offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return ok(
        {
            "items": [serialize_application(application) for application in applications],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
            "filters": {
                "q": search,
                "status": status or "all",
                "sort": sort if sort in ALLOWED_SORTS else "updated_desc",
            },
        }
    )


@applications_bp.post("")
def create_application():
    session = get_session()
    payload = request.get_json(silent=True) or {}
    if not payload.get("company") or not payload.get("title"):
        return error("Company and title are required.", 400)

    user_id = get_user_id()
    user = session.get(User, user_id)
    if user is None:
        return error("User not found.", 404)
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
