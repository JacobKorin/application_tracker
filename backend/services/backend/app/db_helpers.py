from __future__ import annotations

from datetime import datetime

from werkzeug.security import generate_password_hash

from .models import NotificationPreference, User, UserSettings


def parse_datetime(value: str | None):
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized)


def ensure_user(session, user_id: str, default_email: str) -> User:
    user = session.get(User, user_id)
    if user is not None:
        return user

    email = default_email if user_id == "demo-user" else f"{user_id}@example.local"
    user = User(
        id=user_id,
        email=email,
        password_hash=generate_password_hash("demo-password"),
        name="Demo User" if user_id == "demo-user" else user_id,
        email_verified=user_id == "demo-user",
    )
    session.add(user)
    session.flush()

    session.add(UserSettings(user_id=user.id))
    session.add(NotificationPreference(user_id=user.id))
    session.flush()
    return user

