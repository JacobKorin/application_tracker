from app import create_app


def test_sign_in_with_demo_user():
    app = create_app()
    client = app.test_client()

    response = client.post(
        "/v1/auth/sign-in",
        json={"email": "demo@example.com", "password": "demo-password"},
    )

    assert response.status_code == 200
    assert response.get_json()["data"]["token"] == "dev-token:demo-user"

