from .applications import applications_bp
from .contacts import contacts_bp
from .health import health_bp
from .reminders import reminders_bp
from .tasks import tasks_bp


def register_routes(app):
    app.register_blueprint(health_bp)
    app.register_blueprint(applications_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(contacts_bp)
    app.register_blueprint(reminders_bp)

