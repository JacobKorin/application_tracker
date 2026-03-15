from __future__ import annotations

from uuid import uuid4

from flask import Blueprint, request

from job_tracker_shared.responses import error, ok

from ..state import USERS

auth_bp = Blueprint("auth", __name__, url_prefix="/v1/auth")


@auth_bp.post("/sign-up")
def sign_up():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")
    name = payload.get("name", "New User")
    if not email or not password:
        return error("Email and password are required.", 400)

    user_id = str(uuid4())
    USERS[user_id] = {
        "id": user_id,
        "email": email,
        "password": password,
        "name": name,
        "email_verified": False,
    }
    return ok({"user": USERS[user_id], "token": f"dev-token:{user_id}"}, 201)


@auth_bp.post("/sign-in")
def sign_in():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")

    for user in USERS.values():
        if user["email"] == email and user["password"] == password:
            return ok({"user": user, "token": f"dev-token:{user['id']}"})

    return error("Invalid credentials.", 401)


@auth_bp.post("/password-reset")
def password_reset():
    payload = request.get_json(silent=True) or {}
    return ok({"message": "Password reset requested.", "email": payload.get("email"), "status": "queued"})


@auth_bp.post("/verify-email")
def verify_email():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id", "demo-user")
    user = USERS.get(user_id)
    if not user:
        return error("User not found.", 404)
    user["email_verified"] = True
    return ok({"user": user})


@auth_bp.post("/oauth/google/callback")
def google_callback():
    return ok(
        {
            "message": "Google OAuth is stubbed in this scaffold.",
            "token": "dev-token:demo-user",
            "user": USERS["demo-user"],
        }
    )

