from app import create_app


def test_health_endpoint():
    app = create_app()
    client = app.test_client()

    response = client.get("/health")

    assert response.status_code == 200
    assert response.get_json()["data"]["service"] == "backend"


def test_sign_in_with_demo_user():
    app = create_app()
    client = app.test_client()

    response = client.post(
        "/v1/auth/sign-in",
        json={"email": "demo@example.com", "password": "demo-password"},
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["token"] == "dev-token:demo-user"


def test_reminder_requires_parent_reference():
    app = create_app()
    client = app.test_client()

    response = client.post(
        "/v1/reminders",
        json={"title": "Ping recruiter", "scheduled_for": "2026-03-20T10:00:00+00:00"},
    )

    assert response.status_code == 400


def test_dispatch_notification_is_idempotent():
    app = create_app()
    client = app.test_client()
    payload = {"title": "Follow up", "channel": "email", "user_id": "demo-user"}

    first = client.post("/v1/notifications/dispatch", json=payload, headers={"X-Idempotency-Key": "abc"})
    second = client.post("/v1/notifications/dispatch", json=payload, headers={"X-Idempotency-Key": "abc"})

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.get_json()["data"]["status"] == "duplicate"
