from __future__ import annotations

from .models import (
    Application,
    Contact,
    NotificationLog,
    NotificationPreference,
    Reminder,
    Task,
    User,
    UserSettings,
)


def _iso(value):
    return value.isoformat() if value else None


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "email_verified": user.email_verified,
    }


def serialize_settings(settings: UserSettings) -> dict:
    return {
        "user_id": settings.user_id,
        "timezone": settings.timezone,
        "theme": settings.theme,
        "weekly_summary": settings.weekly_summary,
    }


def serialize_application(application: Application) -> dict:
    return {
        "id": application.id,
        "company": application.company,
        "title": application.title,
        "status": application.status,
        "location": application.location,
        "salary_range": application.salary_range,
        "applied_at": _iso(application.applied_at),
        "notes": application.notes or [],
        "interview_date": _iso(application.interview_date),
        "stage_history": [
            {"stage": event.stage, "timestamp": _iso(event.timestamp)} for event in application.stage_events
        ],
    }


def serialize_task(task: Task) -> dict:
    return {
        "id": task.id,
        "title": task.title,
        "application_id": task.application_id,
        "due_at": _iso(task.due_at),
        "completed": task.completed,
    }


def serialize_contact(contact: Contact) -> dict:
    return {
        "id": contact.id,
        "application_id": contact.application_id,
        "name": contact.name,
        "title": contact.title,
        "email": contact.email,
    }


def serialize_reminder(reminder: Reminder) -> dict:
    return {
        "id": reminder.id,
        "title": reminder.title,
        "application_id": reminder.application_id,
        "task_id": reminder.task_id,
        "scheduled_for": _iso(reminder.scheduled_for),
        "channel": reminder.channel,
    }


def serialize_notification_preference(preference: NotificationPreference) -> dict:
    return {
        "user_id": preference.user_id,
        "push_enabled": preference.push_enabled,
        "email_enabled": preference.email_enabled,
        "quiet_hours_start": preference.quiet_hours_start,
        "quiet_hours_end": preference.quiet_hours_end,
    }


def serialize_notification(notification: NotificationLog) -> dict:
    return {
        "id": notification.id,
        "title": notification.title,
        "channel": notification.channel,
        "status": notification.status,
        "sent_at": _iso(notification.sent_at),
        "idempotency_key": notification.idempotency_key,
    }

