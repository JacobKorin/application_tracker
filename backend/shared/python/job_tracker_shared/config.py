from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(slots=True)
class ServiceConfig:
    service_name: str
    port: int
    environment: str
    cors_origins: tuple[str, ...]
    jwt_secret: str
    postgres_url: str
    default_user_id: str
    default_user_email: str
    identity_service_url: str
    application_service_url: str
    notification_service_url: str

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @staticmethod
    def _parse_cors_origins(raw_value: str | None) -> tuple[str, ...]:
        if not raw_value:
            return ("*",)

        origins = tuple(origin.strip() for origin in raw_value.split(",") if origin.strip())
        return origins or ("*",)

    def validate(self) -> None:
        if not self.is_production:
            return

        if self.jwt_secret in {"change-me", "replace-with-a-long-random-secret"} or len(self.jwt_secret) < 32:
            raise ValueError("JWT_SECRET must be set to a strong 32+ character value in production.")

        if not self.postgres_url or self.postgres_url == "sqlite:///job_tracker.db":
            raise ValueError("POSTGRES_URL must be configured for production.")

        if not self.cors_origins or "*" in self.cors_origins:
            raise ValueError("CORS_ORIGIN must be an explicit origin list in production.")

    @classmethod
    def from_env(cls, default_name: str, default_port: int) -> "ServiceConfig":
        config = cls(
            service_name=os.getenv("SERVICE_NAME", default_name),
            port=int(os.getenv("PORT", str(default_port))),
            environment=os.getenv("APP_ENV", "development"),
            cors_origins=cls._parse_cors_origins(os.getenv("CORS_ORIGIN")),
            jwt_secret=os.getenv("JWT_SECRET", "change-me"),
            postgres_url=os.getenv("POSTGRES_URL", "sqlite:///job_tracker.db"),
            default_user_id=os.getenv("DEFAULT_USER_ID", "demo-user"),
            default_user_email=os.getenv("DEFAULT_USER_EMAIL", "demo@example.com"),
            identity_service_url=os.getenv("IDENTITY_SERVICE_URL", "http://localhost:8001"),
            application_service_url=os.getenv("APPLICATION_SERVICE_URL", "http://localhost:8002"),
            notification_service_url=os.getenv("NOTIFICATION_SERVICE_URL", "http://localhost:8003"),
        )
        config.validate()
        return config
