from .health import health_bp
from .notifications import notifications_bp
from .preferences import preferences_bp


def register_routes(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(preferences_bp)

