def signup_and_get_token(client, email="user@example.com"):
    res = client.post(
        "/api/auth/signup",
        json={"email": email, "password": "supersecret", "name": "Test User"},
    )
    return res.json()["token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_requires_auth(client):
    res = client.get("/api/expenses")
    assert res.status_code in (401, 403)


def test_create_and_list_expenses(client):
    token = signup_and_get_token(client)
    create = client.post(
        "/api/expenses",
        json={"amount": 42.5, "category": "Food", "date": "2026-01-15T00:00:00"},
        headers=auth_headers(token),
    )
    assert create.status_code == 201

    listed = client.get("/api/expenses", headers=auth_headers(token))
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["category"] == "Food"


def test_does_not_leak_other_users_expenses(client):
    token_a = signup_and_get_token(client, "a@example.com")
    token_b = signup_and_get_token(client, "b@example.com")

    client.post(
        "/api/expenses",
        json={"amount": 10, "category": "Transit", "date": "2026-01-01T00:00:00"},
        headers=auth_headers(token_a),
    )

    listed = client.get("/api/expenses", headers=auth_headers(token_b))
    assert listed.json() == []


def test_update_and_delete_expense(client):
    token = signup_and_get_token(client)
    create = client.post(
        "/api/expenses",
        json={"amount": 20, "category": "Coffee", "date": "2026-01-01T00:00:00"},
        headers=auth_headers(token),
    )
    expense_id = create.json()["id"]

    updated = client.patch(
        f"/api/expenses/{expense_id}", json={"amount": 25}, headers=auth_headers(token)
    )
    assert updated.status_code == 200
    assert updated.json()["amount"] == 25

    deleted = client.delete(f"/api/expenses/{expense_id}", headers=auth_headers(token))
    assert deleted.status_code == 204


def test_cannot_modify_another_users_expense(client):
    token_a = signup_and_get_token(client, "owner@example.com")
    token_b = signup_and_get_token(client, "intruder@example.com")

    create = client.post(
        "/api/expenses",
        json={"amount": 15, "category": "Books", "date": "2026-01-01T00:00:00"},
        headers=auth_headers(token_a),
    )
    expense_id = create.json()["id"]

    res = client.delete(f"/api/expenses/{expense_id}", headers=auth_headers(token_b))
    assert res.status_code == 404


def test_category_summary(client):
    token = signup_and_get_token(client)
    for amount, category in [(10, "Food"), (20, "Food"), (5, "Transit")]:
        client.post(
            "/api/expenses",
            json={"amount": amount, "category": category, "date": "2026-01-01T00:00:00"},
            headers=auth_headers(token),
        )

    res = client.get("/api/expenses/summary/by-category", headers=auth_headers(token))
    assert res.status_code == 200
    totals = {row["category"]: row["total"] for row in res.json()}
    assert totals["Food"] == 30
    assert totals["Transit"] == 5
