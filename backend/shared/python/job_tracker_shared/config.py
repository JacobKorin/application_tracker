from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(slots=True)
class ServiceConfig:
    service_name: str
    port: int
    environment: str
    cors_origin: str
    jwt_secret: str
    postgres_url: str
    default_user_id: str
    default_user_email: str
    identity_service_url: str
    application_service_url: str
    notification_service_url: str

    @classmethod
    def from_env(cls, default_name: str, default_port: int) -> "ServiceConfig":
        return cls(
            service_name=os.getenv("SERVICE_NAME", default_name),
            port=int(os.getenv("PORT", str(default_port))),
            environment=os.getenv("APP_ENV", "development"),
            cors_origin=os.getenv("CORS_ORIGIN", "*"),
            jwt_secret=os.getenv("JWT_SECRET", "change-me"),
            postgres_url=os.getenv("POSTGRES_URL", "sqlite:///job_tracker.db"),
            default_user_id=os.getenv("DEFAULT_USER_ID", "demo-user"),
            default_user_email=os.getenv("DEFAULT_USER_EMAIL", "demo@example.com"),
            identity_service_url=os.getenv("IDENTITY_SERVICE_URL", "http://localhost:8001"),
            application_service_url=os.getenv("APPLICATION_SERVICE_URL", "http://localhost:8002"),
            notification_service_url=os.getenv("NOTIFICATION_SERVICE_URL", "http://localhost:8003"),
        )
