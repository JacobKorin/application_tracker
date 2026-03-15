from __future__ import annotations

from flask import Blueprint, request
from werkzeug.security import check_password_hash, generate_password_hash

from job_tracker_shared.db import get_session
from job_tracker_shared.responses import error, ok

from ..models import User
from ..serializers import serialize_user

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
    session.commit()
    return ok({"user": serialize_user(user), "token": f"dev-token:{user.id}"}, 201)


@auth_bp.post("/sign-in")
def sign_in():
    session = get_session()
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")

    user = session.query(User).filter(User.email == email).first()
    if user and check_password_hash(user.password_hash, password or ""):
        return ok({"user": serialize_user(user), "token": f"dev-token:{user.id}"})

    return error("Invalid credentials.", 401)


@auth_bp.post("/password-reset")
def password_reset():
    payload = request.get_json(silent=True) or {}
    return ok({"message": "Password reset requested.", "email": payload.get("email"), "status": "queued"})


@auth_bp.post("/verify-email")
def verify_email():
    session = get_session()
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id", "demo-user")
    user = session.get(User, user_id)
    if not user:
        return error("User not found.", 404)
    user.email_verified = True
    session.commit()
    return ok({"user": serialize_user(user)})


@auth_bp.post("/oauth/google/callback")
def google_callback():
    session = get_session()
    user = session.query(User).filter(User.email == "demo@example.com").first()
    if user is None:
        user = User(
            id="demo-user",
            email="demo@example.com",
            password_hash=generate_password_hash("demo-password"),
            name="Demo User",
            email_verified=True,
        )
        session.add(user)
        session.commit()
    return ok(
        {
            "message": "Google OAuth is stubbed in this scaffold.",
            "token": "dev-token:demo-user",
            "user": serialize_user(user),
        }
    )
