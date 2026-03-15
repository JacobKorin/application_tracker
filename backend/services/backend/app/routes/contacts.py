from __future__ import annotations

from flask import current_app
from flask import Blueprint, request

from job_tracker_shared.db import get_session
from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..db_helpers import ensure_user
from ..models import Contact, utc_now
from ..serializers import serialize_contact

contacts_bp = Blueprint("contacts", __name__, url_prefix="/v1/contacts")


@contacts_bp.get("")
def list_contacts():
    session = get_session()
    user_id = get_user_id()
    contacts = (
        session.query(Contact)
        .filter(Contact.user_id == user_id, Contact.deleted_at.is_(None))
        .order_by(Contact.updated_at.desc())
        .all()
    )
    return ok([serialize_contact(contact) for contact in contacts])


@contacts_bp.post("")
def create_contact():
    session = get_session()
    payload = request.get_json(silent=True) or {}
    if not payload.get("name"):
        return error("Name is required.", 400)
    user_id = get_user_id()
    default_email = current_app.config["SERVICE_CONFIG"].default_user_email
    ensure_user(session, user_id, default_email)
    item = Contact(
        user_id=user_id,
        application_id=payload.get("application_id"),
        name=payload["name"],
        title=payload.get("title"),
        email=payload.get("email"),
    )
    session.add(item)
    session.commit()
    return ok(serialize_contact(item), 201)


@contacts_bp.get("/<contact_id>")
def get_contact(contact_id: str):
    session = get_session()
    contact = session.get(Contact, contact_id)
    if contact is None or contact.user_id != get_user_id() or contact.deleted_at is not None:
        return error("Contact not found.", 404)
    return ok(serialize_contact(contact))


@contacts_bp.patch("/<contact_id>")
def patch_contact(contact_id: str):
    session = get_session()
    contact = session.get(Contact, contact_id)
    if contact is None or contact.user_id != get_user_id() or contact.deleted_at is not None:
        return error("Contact not found.", 404)
    payload = request.get_json(silent=True) or {}
    for field in ("application_id", "name", "title", "email"):
        if field in payload:
            setattr(contact, field, payload[field])
    session.commit()
    return ok(serialize_contact(contact))


@contacts_bp.delete("/<contact_id>")
def delete_contact(contact_id: str):
    session = get_session()
    contact = session.get(Contact, contact_id)
    if contact is None or contact.user_id != get_user_id() or contact.deleted_at is not None:
        return error("Contact not found.", 404)
    contact.deleted_at = utc_now()
    session.commit()
    return ok({"id": contact_id, "deleted": True})
