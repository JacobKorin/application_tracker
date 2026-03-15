from __future__ import annotations

from flask import Flask
from flask_cors import CORS

from job_tracker_shared.config import ServiceConfig
from job_tracker_shared.logging import configure_logging

from .routes import register_routes


def create_app() -> Flask:
    config = ServiceConfig.from_env("api-gateway", 8000)
    configure_logging(config.service_name)

    app = Flask(__name__)
    app.config["SERVICE_CONFIG"] = config
    CORS(app, resources={r"/v1/*": {"origins": config.cors_origin}})
    register_routes(app)
    return app

