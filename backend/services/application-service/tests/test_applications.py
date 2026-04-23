from app import create_app
from job_tracker_shared.auth import create_access_token


def auth_headers(app):
    with app.app_context():
        token = create_access_token("demo-user", "demo@example.com", "Demo User")
    return {"Authorization": f"Bearer {token}"}


def test_application_stage_history_is_appended_on_status_change():
    app = create_app()
    client = app.test_client()
    headers = auth_headers(app)

    create_response = client.post(
        "/v1/applications",
        json={"company": "Acme", "title": "Engineer"},
        headers=headers,
    )
    application = create_response.get_json()["data"]

    response = client.patch(
        f"/v1/applications/{application['id']}",
        json={"status": "interview"},
        headers=headers,
    )

    assert response.status_code == 200
    updated = response.get_json()["data"]
    assert updated["status"] == "interview"
    assert len(updated["stage_history"]) == 2


def test_reminder_requires_parent_reference():
    app = create_app()
    client = app.test_client()
    headers = auth_headers(app)

    response = client.post(
        "/v1/reminders",
        json={"title": "Ping recruiter", "scheduled_for": "2026-03-20T10:00:00+00:00"},
        headers=headers,
    )

    assert response.status_code == 400

