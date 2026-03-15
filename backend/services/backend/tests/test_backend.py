from app import create_app


def sign_up_and_get_token(client, email="demo@example.com", password="demo-password", name="Demo User"):
    response = client.post(
        "/v1/auth/sign-up",
        json={"email": email, "password": password, "name": name},
    )

    assert response.status_code == 201
    return response.get_json()["data"]["token"]


def test_health_endpoint():
    app = create_app()
    client = app.test_client()

    response = client.get("/health")

    assert response.status_code == 200
    assert response.get_json()["data"]["service"] == "backend"


def test_sign_in_with_demo_user():
    app = create_app()
    client = app.test_client()

    sign_up_and_get_token(client)

    response = client.post(
        "/v1/auth/sign-in",
        json={"email": "demo@example.com", "password": "demo-password"},
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["token"].count(".") == 2


def test_sign_up_does_not_enumerate_existing_accounts():
    app = create_app()
    client = app.test_client()

    first = client.post(
        "/v1/auth/sign-up",
        json={"email": "demo@example.com", "password": "demo-password", "name": "Demo User"},
    )
    second = client.post(
        "/v1/auth/sign-up",
        json={"email": "demo@example.com", "password": "different-password", "name": "Another Name"},
    )

    assert first.status_code == 201
    assert second.status_code == 202
    assert second.get_json()["data"]["message"] == "If the account can be created, you may now sign in."


def test_sign_in_is_rate_limited_after_repeated_failures():
    app = create_app()
    client = app.test_client()

    sign_up_and_get_token(client, "demo@example.com", "demo-password", "Demo User")

    for _ in range(10):
        response = client.post(
            "/v1/auth/sign-in",
            json={"email": "demo@example.com", "password": "wrong-password"},
        )
        assert response.status_code == 401

    limited = client.post(
        "/v1/auth/sign-in",
        json={"email": "demo@example.com", "password": "wrong-password"},
    )

    assert limited.status_code == 429
    assert limited.get_json()["error"]["message"] == "Too many attempts. Please wait and try again."


def test_protected_route_requires_valid_token():
    app = create_app()
    client = app.test_client()

    response = client.get("/v1/applications")

    assert response.status_code == 401


def test_user_cannot_view_another_users_application():
    app = create_app()
    client = app.test_client()

    first_token = sign_up_and_get_token(client, "first@example.com", "secret123", "First User")
    second_token = sign_up_and_get_token(client, "second@example.com", "secret123", "Second User")

    create_response = client.post(
        "/v1/applications",
        json={"company": "Acme", "title": "Engineer"},
        headers={"Authorization": f"Bearer {first_token}"},
    )
    application_id = create_response.get_json()["data"]["id"]

    response = client.get(
        f"/v1/applications/{application_id}",
        headers={"Authorization": f"Bearer {second_token}"},
    )

    assert response.status_code == 404


def test_reminder_requires_parent_reference():
    app = create_app()
    client = app.test_client()
    token = sign_up_and_get_token(client)

    response = client.post(
        "/v1/reminders",
        json={"title": "Ping recruiter", "scheduled_for": "2026-03-20T10:00:00+00:00"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400


def test_dispatch_notification_is_idempotent():
    app = create_app()
    client = app.test_client()
    token = sign_up_and_get_token(client)
    payload = {"title": "Follow up", "channel": "email"}

    headers = {"X-Idempotency-Key": "abc", "Authorization": f"Bearer {token}"}
    first = client.post("/v1/notifications/dispatch", json=payload, headers=headers)
    second = client.post("/v1/notifications/dispatch", json=payload, headers=headers)

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.get_json()["data"]["status"] == "duplicate"


def test_applications_support_search_filter_sort_and_pagination():
    app = create_app()
    client = app.test_client()
    token = sign_up_and_get_token(client, "search@example.com", "secret123", "Search User")
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/v1/applications",
        json={"company": "Beta Labs", "title": "Backend Engineer", "status": "applied", "location": "Remote"},
        headers=headers,
    )
    client.post(
        "/v1/applications",
        json={"company": "Acme Corp", "title": "Platform Engineer", "status": "saved", "location": "Toronto"},
        headers=headers,
    )
    client.post(
        "/v1/applications",
        json={"company": "Zenith", "title": "Data Engineer", "status": "interview", "location": "Remote"},
        headers=headers,
    )

    response = client.get(
        "/v1/applications?q=Engineer&status=interview&sort=company_desc&page=1&per_page=1",
        headers=headers,
    )

    assert response.status_code == 200
    payload = response.get_json()["data"]
    assert payload["pagination"]["total"] == 1
    assert payload["pagination"]["per_page"] == 1
    assert len(payload["items"]) == 1
    assert payload["items"][0]["company"] == "Zenith"
    assert payload["filters"]["q"] == "Engineer"
    assert payload["filters"]["status"] == "interview"
    assert payload["filters"]["sort"] == "company_desc"
