from __future__ import annotations

from flask import Blueprint, request
from werkzeug.security import check_password_hash, generate_password_hash

from job_tracker_shared.auth import create_access_token, get_user_id
from job_tracker_shared.db import get_session
from job_tracker_shared.responses import error, ok

from ..models import NotificationPreference, User, UserSettings
from ..serializers import serialize_settings, serialize_user

auth_bp = Blueprint("auth", __name__, url_prefix="/v1/auth")


@auth_bp.post("/sign-up")
def sign_up():
    session = get_session()
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")
    name = payload.get("name", "New User")
    if not email or not password:
        return error("Email and password are required.", 400)
    if session.query(User).filter(User.email == email).first():
        return error("Email is already registered.", 409)

    user = User(email=email, password_hash=generate_password_hash(password), name=name, email_verified=False)
    session.add(user)
    session.flush()
    session.add(UserSettings(user_id=user.id))
    session.add(NotificationPreference(user_id=user.id))
    session.commit()
    return ok({"user": serialize_user(user), "token": create_access_token(user.id, user.email, user.name)}, 201)


@auth_bp.post("/sign-in")
def sign_in():
    session = get_session()
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")

    user = session.query(User).filter(User.email == email).first()
    if user and check_password_hash(user.password_hash, password or ""):
        return ok({"user": serialize_user(user), "token": create_access_token(user.id, user.email, user.name)})

    return error("Invalid credentials.", 401)


@auth_bp.post("/password-reset")
def password_reset():
    payload = request.get_json(silent=True) or {}
    return ok({"message": "Password reset requested.", "email": payload.get("email"), "status": "queued"})


@auth_bp.post("/verify-email")
def verify_email():
    session = get_session()
    user_id = get_user_id()
    user = session.get(User, user_id)
    if not user:
        return error("User not found.", 404)
    user.email_verified = True
    session.commit()
    return ok({"user": serialize_user(user)})


@auth_bp.post("/oauth/google/callback")
def google_callback():
    return ok({"message": "Google OAuth is not configured in this environment yet."}, 501)


@auth_bp.get("/me")
def get_me():
    session = get_session()
    user = session.get(User, get_user_id())
    if user is None:
        return error("User not found.", 404)

    payload = {
        "user": serialize_user(user),
        "settings": serialize_settings(user.settings) if user.settings else None,
    }
    return ok(payload)
