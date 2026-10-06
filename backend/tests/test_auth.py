"""Tests for authentication endpoints: register, login, protected route."""

import pytest
from fastapi.testclient import TestClient

REGISTER_URL = "/auth/register"
LOGIN_URL = "/auth/login"
ME_URL = "/users/me"

VALID_USER = {
    "name": "Alice",
    "email": "alice@example.com",
    "password": "SecurePass1",
}


# ── Register ──────────────────────────────────────────────────────────────────

def test_register_success(client: TestClient):
    """Registering a new user returns 201 and a JWT token."""
    resp = client.post(REGISTER_URL, json=VALID_USER)
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client: TestClient):
    """Registering with an already-used email returns 409."""
    client.post(REGISTER_URL, json=VALID_USER)
    resp = client.post(REGISTER_URL, json=VALID_USER)
    assert resp.status_code == 409
    assert "already exists" in resp.json()["detail"]


def test_register_weak_password(client: TestClient):
    """Password without a digit is rejected with 422."""
    resp = client.post(
        REGISTER_URL,
        json={"name": "Bob", "email": "bob@example.com", "password": "onlyletters"},
    )
    assert resp.status_code == 422


def test_register_short_password(client: TestClient):
    """Password shorter than 8 chars is rejected with 422."""
    resp = client.post(
        REGISTER_URL,
        json={"name": "Carol", "email": "carol@example.com", "password": "Ab1"},
    )
    assert resp.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────

def test_login_success(client: TestClient):
    """Logging in with valid credentials returns a JWT token."""
    client.post(REGISTER_URL, json=VALID_USER)
    resp = client.post(
        LOGIN_URL,
        json={"email": VALID_USER["email"], "password": VALID_USER["password"]},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client: TestClient):
    """Wrong password returns 401."""
    client.post(REGISTER_URL, json=VALID_USER)
    resp = client.post(
        LOGIN_URL,
        json={"email": VALID_USER["email"], "password": "WrongPass9"},
    )
    assert resp.status_code == 401


def test_login_unknown_email(client: TestClient):
    """Login with an unregistered email returns 401."""
    resp = client.post(
        LOGIN_URL,
        json={"email": "nobody@example.com", "password": "SomePass1"},
    )
    assert resp.status_code == 401


# ── Protected route ────────────────────────────────────────────────────────────

def test_get_me_authenticated(client: TestClient):
    """GET /users/me with a valid token returns the user profile."""
    reg = client.post(REGISTER_URL, json=VALID_USER)
    token = reg.json()["access_token"]
    resp = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == VALID_USER["email"]
    assert data["name"] == VALID_USER["name"]
    assert "hashed_password" not in data


def test_get_me_unauthenticated(client: TestClient):
    """GET /users/me without a token returns 401."""
    resp = client.get(ME_URL)
    assert resp.status_code == 401


def test_get_me_invalid_token(client: TestClient):
    """GET /users/me with a garbage token returns 401."""
    resp = client.get(ME_URL, headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401


# ── Profile update ────────────────────────────────────────────────────────────

def test_update_profile(client: TestClient):
    """PUT /users/me updates the user name."""
    reg = client.post(REGISTER_URL, json=VALID_USER)
    token = reg.json()["access_token"]
    resp = client.put(
        ME_URL,
        json={"name": "Alice Updated"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Alice Updated"


def test_update_email_conflict(client: TestClient):
    """PUT /users/me with a taken email returns 409."""
    # Register two users
    client.post(REGISTER_URL, json=VALID_USER)
    client.post(
        REGISTER_URL,
        json={"name": "Bob", "email": "bob@example.com", "password": "BobPass1"},
    )
    # Login as Bob and try to steal Alice's email
    login = client.post(
        LOGIN_URL,
        json={"email": "bob@example.com", "password": "BobPass1"},
    )
    token = login.json()["access_token"]
    resp = client.put(
        ME_URL,
        json={"email": VALID_USER["email"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 409
