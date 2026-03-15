from __future__ import annotations

from flask import Blueprint, request

from job_tracker_shared.auth import get_user_id
from job_tracker_shared.responses import error, ok

from ..state import CONTACTS, create_item, get_item, list_items, soft_delete_item, update_item

contacts_bp = Blueprint("contacts", __name__, url_prefix="/v1/contacts")


@contacts_bp.get("")
def list_contacts():
    return ok(list_items(CONTACTS, get_user_id()))


@contacts_bp.post("")
def create_contact():
    payload = request.get_json(silent=True) or {}
    if not payload.get("name"):
        return error("Name is required.", 400)
    item = create_item(CONTACTS, get_user_id(), payload)
    return ok(item, 201)


@contacts_bp.get("/<contact_id>")
def get_contact(contact_id: str):
    contact = get_item(CONTACTS, get_user_id(), contact_id)
    if contact is None:
        return error("Contact not found.", 404)
    return ok(contact)


@contacts_bp.patch("/<contact_id>")
def patch_contact(contact_id: str):
    updated = update_item(CONTACTS, get_user_id(), contact_id, request.get_json(silent=True) or {})
    if updated is None:
        return error("Contact not found.", 404)
    return ok(updated)


@contacts_bp.delete("/<contact_id>")
def delete_contact(contact_id: str):
    if not soft_delete_item(CONTACTS, get_user_id(), contact_id):
        return error("Contact not found.", 404)
    return ok({"id": contact_id, "deleted": True})

