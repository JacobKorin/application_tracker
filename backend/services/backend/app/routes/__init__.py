from .applications import applications_bp
from .auth import auth_bp
from .contacts import contacts_bp
from .health import health_bp
from .notifications import notifications_bp
from .preferences import preferences_bp
from .reminders import reminders_bp
from .settings import settings_bp
from .tasks import tasks_bp


def register_routes(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(applications_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(reminders_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(preferences_bp)

