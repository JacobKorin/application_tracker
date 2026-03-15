from __future__ import annotations

from flask import Blueprint, current_app, request

from job_tracker_shared.http import forward_json

gateway_bp = Blueprint("gateway", __name__)


SERVICE_MAP = {
    "auth": ("identity_service_url", "/v1/auth"),
    "settings": ("identity_service_url", "/v1/settings"),
    "applications": ("application_service_url", "/v1/applications"),
    "tasks": ("application_service_url", "/v1/tasks"),
    "contacts": ("application_service_url", "/v1/contacts"),
    "reminders": ("application_service_url", "/v1/reminders"),
    "notifications": ("notification_service_url", "/v1/notifications"),
    "notification-preferences": ("notification_service_url", "/v1/notification-preferences"),
}


def _target_url(resource: str, path: str) -> str:
    config = current_app.config["SERVICE_CONFIG"]
    config_attr, base_path = SERVICE_MAP[resource]
    base_url = getattr(config, config_attr)
    suffix = f"/{path}" if path else ""
    return f"{base_url}{base_path}{suffix}"


def _proxy(resource: str, path: str = ""):
    url = _target_url(resource, path)
    headers = {}
    for header in ("Authorization", "X-User-Id", "X-Idempotency-Key"):
        value = request.headers.get(header)
        if value:
            headers[header] = value
    payload = request.get_json(silent=True)
    status, body = forward_json(request.method, url, payload, headers)
    return body, status


@gateway_bp.route("/v1/auth", defaults={"path": ""}, methods=["GET", "POST"])
@gateway_bp.route("/v1/auth/<path:path>", methods=["GET", "POST"])
def auth_proxy(path: str):
    return _proxy("auth", path)


@gateway_bp.route("/v1/settings", defaults={"path": ""}, methods=["GET", "PATCH"])
@gateway_bp.route("/v1/settings/<path:path>", methods=["GET", "PATCH"])
def settings_proxy(path: str):
    return _proxy("settings", path)


@gateway_bp.route("/v1/applications", defaults={"path": ""}, methods=["GET", "POST"])
@gateway_bp.route("/v1/applications/<path:path>", methods=["GET", "PATCH", "DELETE"])
def applications_proxy(path: str):
    return _proxy("applications", path)


@gateway_bp.route("/v1/tasks", defaults={"path": ""}, methods=["GET", "POST"])
@gateway_bp.route("/v1/tasks/<path:path>", methods=["GET", "PATCH", "DELETE"])
def tasks_proxy(path: str):
    return _proxy("tasks", path)


@gateway_bp.route("/v1/contacts", defaults={"path": ""}, methods=["GET", "POST"])
@gateway_bp.route("/v1/contacts/<path:path>", methods=["GET", "PATCH", "DELETE"])
def contacts_proxy(path: str):
    return _proxy("contacts", path)


@gateway_bp.route("/v1/reminders", defaults={"path": ""}, methods=["GET", "POST"])
@gateway_bp.route("/v1/reminders/<path:path>", methods=["GET", "PATCH", "DELETE"])
def reminders_proxy(path: str):
    return _proxy("reminders", path)


@gateway_bp.route("/v1/notifications", defaults={"path": ""}, methods=["GET"])
@gateway_bp.route("/v1/notifications/<path:path>", methods=["GET"])
def notifications_proxy(path: str):
    return _proxy("notifications", path)


@gateway_bp.route("/v1/notification-preferences", defaults={"path": ""}, methods=["GET", "PATCH"])
@gateway_bp.route("/v1/notification-preferences/<path:path>", methods=["GET", "PATCH"])
def notification_preferences_proxy(path: str):
    return _proxy("notification-preferences", path)

