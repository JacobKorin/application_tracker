from app import create_app
import jwt


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


def test_sign_in_rate_limit_is_scoped_to_email_and_ip_pair():
    app = create_app()
    client = app.test_client()

    sign_up_and_get_token(client, "first@example.com", "demo-password", "First User")
    sign_up_and_get_token(client, "second@example.com", "demo-password", "Second User")

    for _ in range(10):
        response = client.post(
            "/v1/auth/sign-in",
            json={"email": "first@example.com", "password": "wrong-password"},
        )
        assert response.status_code == 401

    limited = client.post(
        "/v1/auth/sign-in",
        json={"email": "first@example.com", "password": "wrong-password"},
    )
    other_email = client.post(
        "/v1/auth/sign-in",
        json={"email": "second@example.com", "password": "demo-password"},
    )

    assert limited.status_code == 429
    assert other_email.status_code == 200


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


def test_user_cannot_attach_task_to_another_users_application():
    app = create_app()
    client = app.test_client()
    owner_token = sign_up_and_get_token(client, "owner@example.com", "secret123", "Owner")
    attacker_token = sign_up_and_get_token(client, "attacker@example.com", "secret123", "Attacker")

    application_id = client.post(
        "/v1/applications",
        json={"company": "Acme", "title": "Engineer"},
        headers={"Authorization": f"Bearer {owner_token}"},
    ).get_json()["data"]["id"]

    response = client.post(
        "/v1/tasks",
        json={"title": "Stolen link", "application_id": application_id},
        headers={"Authorization": f"Bearer {attacker_token}"},
    )

    assert response.status_code == 404


def test_user_cannot_attach_contact_to_another_users_application():
    app = create_app()
    client = app.test_client()
    owner_token = sign_up_and_get_token(client, "owner-contact@example.com", "secret123", "Owner")
    attacker_token = sign_up_and_get_token(client, "attacker-contact@example.com", "secret123", "Attacker")

    application_id = client.post(
        "/v1/applications",
        json={"company": "North Peak", "title": "Analyst"},
        headers={"Authorization": f"Bearer {owner_token}"},
    ).get_json()["data"]["id"]

    response = client.post(
        "/v1/contacts",
        json={"name": "Recruiter", "application_id": application_id},
        headers={"Authorization": f"Bearer {attacker_token}"},
    )

    assert response.status_code == 404


def test_user_cannot_attach_reminder_to_another_users_task():
    app = create_app()
    client = app.test_client()
    owner_token = sign_up_and_get_token(client, "owner-reminder@example.com", "secret123", "Owner")
    attacker_token = sign_up_and_get_token(client, "attacker-reminder@example.com", "secret123", "Attacker")

    task_id = client.post(
        "/v1/tasks",
        json={"title": "Owner task"},
        headers={"Authorization": f"Bearer {owner_token}"},
    ).get_json()["data"]["id"]

    response = client.post(
        "/v1/reminders",
        json={
            "title": "Sneaky reminder",
            "task_id": task_id,
            "scheduled_for": "2026-03-20T10:00:00+00:00",
        },
        headers={"Authorization": f"Bearer {attacker_token}"},
    )

    assert response.status_code == 404


def test_user_cannot_reassign_task_to_another_users_application():
    app = create_app()
    client = app.test_client()
    owner_token = sign_up_and_get_token(client, "owner-patch-task@example.com", "secret123", "Owner")
    attacker_token = sign_up_and_get_token(client, "attacker-patch-task@example.com", "secret123", "Attacker")

    owner_application_id = client.post(
        "/v1/applications",
        json={"company": "Acme", "title": "Engineer"},
        headers={"Authorization": f"Bearer {owner_token}"},
    ).get_json()["data"]["id"]
    attacker_task_id = client.post(
        "/v1/tasks",
        json={"title": "Attacker task"},
        headers={"Authorization": f"Bearer {attacker_token}"},
    ).get_json()["data"]["id"]

    response = client.patch(
        f"/v1/tasks/{attacker_task_id}",
        json={"application_id": owner_application_id},
        headers={"Authorization": f"Bearer {attacker_token}"},
    )

    assert response.status_code == 404


def test_user_cannot_reassign_reminder_to_another_users_task():
    app = create_app()
    client = app.test_client()
    owner_token = sign_up_and_get_token(client, "owner-patch-reminder@example.com", "secret123", "Owner")
    attacker_token = sign_up_and_get_token(client, "attacker-patch-reminder@example.com", "secret123", "Attacker")

    owner_task_id = client.post(
        "/v1/tasks",
        json={"title": "Owner task"},
        headers={"Authorization": f"Bearer {owner_token}"},
    ).get_json()["data"]["id"]
    attacker_reminder_id = client.post(
        "/v1/reminders",
        json={
            "title": "Attacker reminder",
            "scheduled_for": "2026-03-20T10:00:00+00:00",
            "application_id": None,
            "task_id": client.post(
                "/v1/tasks",
                json={"title": "Attacker task"},
                headers={"Authorization": f"Bearer {attacker_token}"},
            ).get_json()["data"]["id"],
        },
        headers={"Authorization": f"Bearer {attacker_token}"},
    ).get_json()["data"]["id"]

    response = client.patch(
        f"/v1/reminders/{attacker_reminder_id}",
        json={"task_id": owner_task_id},
        headers={"Authorization": f"Bearer {attacker_token}"},
    )

    assert response.status_code == 404


def test_notification_dispatch_ignores_client_supplied_user_id():
    app = create_app()
    client = app.test_client()
    owner_token = sign_up_and_get_token(client, "notify-owner@example.com", "secret123", "Owner")
    attacker_token = sign_up_and_get_token(client, "notify-attacker@example.com", "secret123", "Attacker")

    headers = {"X-Idempotency-Key": "notify-owner", "Authorization": f"Bearer {owner_token}"}
    dispatch_response = client.post(
        "/v1/notifications/dispatch",
        json={"title": "Owner notification", "channel": "email", "user_id": "bogus-user"},
        headers=headers,
    )
    assert dispatch_response.status_code == 201

    attacker_notifications = client.get(
        "/v1/notifications",
        headers={"Authorization": f"Bearer {attacker_token}"},
    )
    assert attacker_notifications.status_code == 200
    assert attacker_notifications.get_json()["data"] == []

    owner_notifications = client.get(
        "/v1/notifications",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert owner_notifications.status_code == 200
    assert len(owner_notifications.get_json()["data"]) == 1


def test_invalid_jwt_is_rejected():
    app = create_app()
    client = app.test_client()

    forged_token = jwt.encode(
        {
            "sub": "fake-user",
            "email": "attacker@example.com",
            "name": "Attacker",
            "iat": 1,
            "exp": 4102444800,
            "iss": "backend",
        },
        "wrong-secret",
        algorithm="HS256",
    )

    response = client.get(
        "/v1/applications",
        headers={"Authorization": f"Bearer {forged_token}"},
    )

    assert response.status_code == 401


def test_settings_reject_unsupported_fields():
    app = create_app()
    client = app.test_client()
    token = sign_up_and_get_token(client)

    response = client.patch(
        "/v1/settings",
        json={"timezone": "America/Toronto", "user_id": "attacker"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "Unsupported settings field" in response.get_json()["error"]["message"]


def test_notification_preferences_reject_unsupported_fields():
    app = create_app()
    client = app.test_client()
    token = sign_up_and_get_token(client)

    response = client.patch(
        "/v1/notification-preferences",
        json={"push_enabled": True, "user_id": "attacker"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert "Unsupported notification preference field" in response.get_json()["error"]["message"]


def test_production_requires_strong_jwt_secret_and_explicit_cors(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("JWT_SECRET", "too-short")
    monkeypatch.setenv("CORS_ORIGIN", "*")
    monkeypatch.setenv("POSTGRES_URL", "postgresql://tracker:password@internal-db/tracker")

    from job_tracker_shared.config import ServiceConfig

    try:
        ServiceConfig.from_env("backend", 8000)
    except ValueError as exc:
        message = str(exc)
    else:
        raise AssertionError("Expected production config validation to fail.")

    assert "JWT_SECRET" in message or "CORS_ORIGIN" in message


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


def test_tasks_are_listed_with_open_due_items_first():
    app = create_app()
    client = app.test_client()
    token = sign_up_and_get_token(client, "tasks-order@example.com", "secret123", "Order User")
    headers = {"Authorization": f"Bearer {token}"}

    due_open = client.post(
        "/v1/tasks",
        json={"title": "Due soon", "due_at": "2026-03-18T10:00:00+00:00"},
        headers=headers,
    ).get_json()["data"]["id"]
    client.post(
        "/v1/tasks",
        json={"title": "No due date"},
        headers=headers,
    )
    client.post(
        "/v1/tasks",
        json={"title": "Completed task", "completed": True, "due_at": "2026-03-17T10:00:00+00:00"},
        headers=headers,
    )

    response = client.get("/v1/tasks", headers=headers)

    assert response.status_code == 200
    items = response.get_json()["data"]
    assert items[0]["id"] == due_open
    assert items[-1]["completed"] is True


def test_reminders_are_listed_by_scheduled_time():
    app = create_app()
    client = app.test_client()
    token = sign_up_and_get_token(client, "reminder-order@example.com", "secret123", "Reminder User")
    headers = {"Authorization": f"Bearer {token}"}

    first_reminder_id = client.post(
        "/v1/reminders",
        json={
            "title": "Soonest reminder",
            "scheduled_for": "2026-03-18T10:00:00+00:00",
            "application_id": client.post(
                "/v1/applications",
                json={"company": "Acme", "title": "Engineer"},
                headers=headers,
            ).get_json()["data"]["id"],
        },
        headers=headers,
    ).get_json()["data"]["id"]
    client.post(
        "/v1/reminders",
        json={
            "title": "Later reminder",
            "scheduled_for": "2026-03-19T10:00:00+00:00",
            "task_id": client.post(
                "/v1/tasks",
                json={"title": "Reminder parent"},
                headers=headers,
            ).get_json()["data"]["id"],
        },
        headers=headers,
    )

    response = client.get("/v1/reminders", headers=headers)

    assert response.status_code == 200
    items = response.get_json()["data"]
    assert items[0]["id"] == first_reminder_id
