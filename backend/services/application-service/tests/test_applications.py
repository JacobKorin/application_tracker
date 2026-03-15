from app import create_app


def test_application_stage_history_is_appended_on_status_change():
    app = create_app()
    client = app.test_client()

    create_response = client.post("/v1/applications", json={"company": "Acme", "title": "Engineer"})
    application = create_response.get_json()["data"]

    response = client.patch(f"/v1/applications/{application['id']}", json={"status": "interview"})

    assert response.status_code == 200
    updated = response.get_json()["data"]
    assert updated["status"] == "interview"
    assert len(updated["stage_history"]) == 2


def test_reminder_requires_parent_reference():
    app = create_app()
    client = app.test_client()

    response = client.post(
        "/v1/reminders",
        json={"title": "Ping recruiter", "scheduled_for": "2026-03-20T10:00:00+00:00"},
    )

    assert response.status_code == 400

