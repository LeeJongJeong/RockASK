from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_chats_returns_contract_without_database() -> None:
    response = client.get("/api/v1/chats")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"items", "next_cursor"}
    assert len(body["items"]) == 3

    first = body["items"][0]
    assert set(first.keys()) == {
        "id",
        "title",
        "assistant_name",
        "last_message_preview",
        "last_message_at",
        "last_message_relative",
        "status",
    }
    assert first["status"] in {"ready", "processing", "archived", "error"}


def test_get_chats_respects_limit_and_emits_cursor_without_database() -> None:
    response = client.get("/api/v1/chats", params={"limit": 1})

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    assert isinstance(body["next_cursor"], str)



def test_get_chats_rejects_invalid_cursor() -> None:
    response = client.get("/api/v1/chats", params={"cursor": "not-a-valid-cursor"})

    assert response.status_code == 422
    assert response.json()["detail"] == "Invalid cursor."