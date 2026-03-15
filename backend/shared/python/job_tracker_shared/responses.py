from __future__ import annotations

from flask import jsonify


def ok(data: dict | list, status: int = 200):
    return jsonify({"data": data}), status


def error(message: str, status: int = 400, details: dict | None = None):
    payload = {"error": {"message": message}}
    if details:
        payload["error"]["details"] = details
    return jsonify(payload), status

