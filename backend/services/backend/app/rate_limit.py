from __future__ import annotations

from datetime import datetime, timedelta, timezone

from flask import request
from sqlalchemy import delete

from job_tracker_shared.responses import error

from .models import AuthRateLimitEvent

WINDOW_SECONDS = 15 * 60
MAX_ATTEMPTS = {
    "sign_in": 10,
    "sign_up": 5,
}


def _normalize_email(email: str | None) -> str | None:
    return email.strip().lower() if email else None


def _client_ip() -> str | None:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr


def check_rate_limit(session, action: str, email: str | None):
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=WINDOW_SECONDS)
    session.execute(delete(AuthRateLimitEvent).where(AuthRateLimitEvent.created_at < cutoff))
    session.flush()

    normalized_email = _normalize_email(email)
    ip_address = _client_ip()
    attempts = (
        session.query(AuthRateLimitEvent)
        .filter(
            AuthRateLimitEvent.action == action,
            AuthRateLimitEvent.created_at >= cutoff,
            (
                (AuthRateLimitEvent.email == normalized_email)
                | (AuthRateLimitEvent.ip_address == ip_address)
            ),
        )
        .count()
    )
    if attempts >= MAX_ATTEMPTS[action]:
        return error("Too many attempts. Please wait and try again.", 429)
    return None


def record_rate_limit_event(session, action: str, email: str | None):
    session.add(
        AuthRateLimitEvent(
            action=action,
            email=_normalize_email(email),
            ip_address=_client_ip(),
        )
    )
    session.commit()


def clear_rate_limit_events(session, action: str, email: str | None):
    normalized_email = _normalize_email(email)
    ip_address = _client_ip()
    session.execute(
        delete(AuthRateLimitEvent).where(
            AuthRateLimitEvent.action == action,
            (
                (AuthRateLimitEvent.email == normalized_email)
                | (AuthRateLimitEvent.ip_address == ip_address)
            ),
        )
    )
    session.commit()
