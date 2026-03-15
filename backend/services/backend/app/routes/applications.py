from __future__ import annotations

from flask import Blueprint, request

from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..state import APPLICATIONS, create_item, get_item, list_items, soft_delete_item, update_item, utc_now

applications_bp = Blueprint("applications", __name__, url_prefix="/v1/applications")


@applications_bp.get("")
def list_applications():
    return ok(list_items(APPLICATIONS, get_user_id()))


@applications_bp.post("")
def create_application():
    payload = request.get_json(silent=True) or {}
    if not payload.get("company") or not payload.get("title"):
        return error("Company and title are required.", 400)

    stage = payload.get("status", "saved")
    item = create_item(
        APPLICATIONS,
        get_user_id(),
        {
            "company": payload["company"],
            "title": payload["title"],
            "status": stage,
            "location": payload.get("location"),
            "salary_range": payload.get("salary_range"),
            "applied_at": payload.get("applied_at"),
            "notes": payload.get("notes", []),
            "interview_date": payload.get("interview_date"),
            "stage_history": [{"stage": stage, "timestamp": utc_now()}],
        },
    )
    return ok(item, 201)


@applications_bp.get("/<application_id>")
def get_application(application_id: str):
    item = get_item(APPLICATIONS, get_user_id(), application_id)
    if item is None:
        return error("Application not found.", 404)
    return ok(item)


@applications_bp.patch("/<application_id>")
def patch_application(application_id: str):
    payload = request.get_json(silent=True) or {}
    item = get_item(APPLICATIONS, get_user_id(), application_id)
    if item is None:
        return error("Application not found.", 404)

    if "status" in payload and payload["status"] != item["status"]:
        item["stage_history"].append({"stage": payload["status"], "timestamp": utc_now()})

    updated = update_item(APPLICATIONS, get_user_id(), application_id, payload)
    return ok(updated)


@applications_bp.delete("/<application_id>")
def delete_application(application_id: str):
    deleted = soft_delete_item(APPLICATIONS, get_user_id(), application_id)
    if not deleted:
        return error("Application not found.", 404)
    return ok({"id": application_id, "deleted": True})

