from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from flask import current_app, request
from jwt import InvalidTokenError


class AuthError(Exception):
    def __init__(self, message: str, status_code: int = 401):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def create_access_token(user_id: str, email: str, name: str) -> str:
    config = current_app.config["SERVICE_CONFIG"]
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=14)).timestamp()),
        "iss": config.service_name,
    }
    return jwt.encode(payload, config.jwt_secret, algorithm="HS256")


def get_token_payload() -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise AuthError("Authentication required.")

    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        raise AuthError("Authentication required.")

    config = current_app.config["SERVICE_CONFIG"]
    try:
        return jwt.decode(
            token,
            config.jwt_secret,
            algorithms=["HS256"],
            issuer=config.service_name,
            options={"require": ["sub", "exp", "iat", "iss"]},
        )
    except InvalidTokenError:
        raise AuthError("Invalid or expired token.")


def get_user_id() -> str:
    payload = get_token_payload()
    user_id = payload.get("sub")
    if not user_id:
        raise AuthError("Invalid token payload.")
    return str(user_id)
