from .auth import auth_bp
from .health import health_bp
from .settings import settings_bp


def register_routes(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(settings_bp)

