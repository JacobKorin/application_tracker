from app import create_app


def test_dispatch_notification_is_idempotent():
    app = create_app()
    client = app.test_client()
    payload = {"title": "Follow up", "channel": "email", "user_id": "demo-user"}

    first = client.post("/v1/notifications/dispatch", json=payload, headers={"X-Idempotency-Key": "abc"})
    second = client.post("/v1/notifications/dispatch", json=payload, headers={"X-Idempotency-Key": "abc"})

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.get_json()["data"]["status"] == "duplicate"

