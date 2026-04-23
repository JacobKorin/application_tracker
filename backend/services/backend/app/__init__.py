from __future__ import annotations

from flask import Flask
from flask_cors import CORS

from job_tracker_shared.auth import AuthError
from job_tracker_shared.config import ServiceConfig
from job_tracker_shared.db import init_db
from job_tracker_shared.logging import configure_logging
from job_tracker_shared.responses import error

from .routes import register_routes


def create_app() -> Flask:
    config = ServiceConfig.from_env("backend", 8000)
    configure_logging(config.service_name)

    app = Flask(__name__)
    app.config["SERVICE_CONFIG"] = config
    cors_origins: str | list[str]
    cors_origins = "*" if "*" in config.cors_origins else list(config.cors_origins)
    CORS(
        app,
        resources={
            r"/v1/*": {"origins": cors_origins},
            r"/health": {"origins": cors_origins},
            r"/ready": {"origins": cors_origins},
        },
    )
    init_db(app)

    @app.errorhandler(AuthError)
    def handle_auth_error(exc: AuthError):
        return error(exc.message, exc.status_code)

    register_routes(app)
    return app
