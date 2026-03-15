from __future__ import annotations

from flask import request


def get_user_id() -> str:
    token = request.headers.get("Authorization", "")
    if token.startswith("Bearer dev-token:"):
        return token.removeprefix("Bearer dev-token:")
    return request.headers.get("X-User-Id", "demo-user")

