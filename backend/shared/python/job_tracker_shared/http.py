from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any


def forward_json(method: str, url: str, payload: dict[str, Any] | None, headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    data = None
    request_headers = dict(headers)
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        request_headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url=url, data=data, method=method, headers=request_headers)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = response.read().decode("utf-8")
            parsed = json.loads(body) if body else {}
            return response.status, parsed
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8")
        parsed = json.loads(body) if body else {"error": {"message": "Downstream error"}}
        return exc.code, parsed

