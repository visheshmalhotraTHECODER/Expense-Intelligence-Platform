def test_signup_creates_user_and_returns_token(client):
    res = client.post(
        "/api/auth/signup",
        json={"email": "ada@example.com", "password": "supersecret", "name": "Ada Lovelace"},
    )
    assert res.status_code == 201
    body = res.json()
    assert "token" in body
    assert body["user"]["email"] == "ada@example.com"
    assert "password_hash" not in body["user"]


def test_signup_rejects_duplicate_email(client):
    client.post(
        "/api/auth/signup",
        json={"email": "dup@example.com", "password": "supersecret", "name": "First"},
    )
    res = client.post(
        "/api/auth/signup",
        json={"email": "dup@example.com", "password": "anotherpass", "name": "Second"},
    )
    assert res.status_code == 409


def test_signup_rejects_invalid_payload(client):
    res = client.post(
        "/api/auth/signup",
        json={"email": "not-an-email", "password": "short", "name": ""},
    )
    assert res.status_code == 422


def test_login_with_correct_credentials(client):
    client.post(
        "/api/auth/signup",
        json={"email": "grace@example.com", "password": "supersecret", "name": "Grace Hopper"},
    )
    res = client.post(
        "/api/auth/login", json={"email": "grace@example.com", "password": "supersecret"}
    )
    assert res.status_code == 200
    assert "token" in res.json()


def test_login_rejects_wrong_password(client):
    client.post(
        "/api/auth/signup",
        json={
            "email": "margaret@example.com",
            "password": "supersecret",
            "name": "Margaret Hamilton",
        },
    )
    res = client.post(
        "/api/auth/login", json={"email": "margaret@example.com", "password": "wrongpassword"}
    )
    assert res.status_code == 401
