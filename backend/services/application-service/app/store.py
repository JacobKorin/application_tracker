from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


APPLICATIONS: dict[str, dict] = {
    "demo-user": [
        {
            "id": "app-demo-1",
            "company": "Open Roles Inc.",
            "title": "Backend Engineer",
            "status": "applied",
            "location": "Remote",
            "salary_range": "$120k-$150k",
            "applied_at": "2026-03-01T14:00:00+00:00",
            "notes": ["Strong Python fit", "Reach out to hiring manager on Monday"],
            "interview_date": None,
            "stage_history": [
                {"stage": "saved", "timestamp": "2026-02-27T10:00:00+00:00"},
                {"stage": "applied", "timestamp": "2026-03-01T14:00:00+00:00"},
            ],
            "deleted": False,
        }
    ]
}

TASKS: dict[str, list[dict]] = {
    "demo-user": [
        {
            "id": "task-demo-1",
            "title": "Send follow-up email",
            "application_id": "app-demo-1",
            "due_at": "2026-03-18T16:00:00+00:00",
            "completed": False,
            "deleted": False,
        }
    ]
}

CONTACTS: dict[str, list[dict]] = {
    "demo-user": [
        {
            "id": "contact-demo-1",
            "application_id": "app-demo-1",
            "name": "Taylor Morgan",
            "title": "Engineering Manager",
            "email": "taylor@example.com",
            "deleted": False,
        }
    ]
}

REMINDERS: dict[str, list[dict]] = {
    "demo-user": [
        {
            "id": "reminder-demo-1",
            "title": "Prepare system design notes",
            "application_id": "app-demo-1",
            "task_id": None,
            "scheduled_for": "2026-03-19T18:00:00+00:00",
            "channel": "push",
            "deleted": False,
        }
    ]
}


def _user_bucket(collection: dict[str, list[dict]], user_id: str) -> list[dict]:
    return collection.setdefault(user_id, [])


def list_items(collection: dict[str, list[dict]], user_id: str) -> list[dict]:
    return [deepcopy(item) for item in _user_bucket(collection, user_id) if not item.get("deleted")]


def get_item(collection: dict[str, list[dict]], user_id: str, item_id: str) -> dict | None:
    for item in _user_bucket(collection, user_id):
        if item["id"] == item_id and not item.get("deleted"):
            return item
    return None


def create_item(collection: dict[str, list[dict]], user_id: str, payload: dict) -> dict:
    item = {"id": str(uuid4()), **payload, "deleted": False}
    _user_bucket(collection, user_id).append(item)
    return deepcopy(item)


def update_item(collection: dict[str, list[dict]], user_id: str, item_id: str, payload: dict) -> dict | None:
    item = get_item(collection, user_id, item_id)
    if item is None:
        return None
    item.update(payload)
    return deepcopy(item)


def soft_delete_item(collection: dict[str, list[dict]], user_id: str, item_id: str) -> bool:
    item = get_item(collection, user_id, item_id)
    if item is None:
        return False
    item["deleted"] = True
    item["deleted_at"] = utc_now()
    return True

