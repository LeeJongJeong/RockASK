from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_patch_preferences_returns_no_content_without_database() -> None:
    response = client.patch(
        "/api/v1/preferences",
        json={
            "theme": "dark",
            "last_scope_id": "global",
        },
    )

    assert response.status_code == 204
    assert response.content == b""


def test_patch_preferences_requires_payload_values() -> None:
    response = client.patch("/api/v1/preferences", json={})

    assert response.status_code == 422