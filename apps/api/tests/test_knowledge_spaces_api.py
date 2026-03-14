from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_knowledge_spaces_returns_contract_without_database() -> None:
    response = client.get("/api/v1/knowledge-spaces")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"items", "next_cursor"}
    assert len(body["items"]) >= 1

    first = body["items"][0]
    assert set(first.keys()) == {
        "id",
        "name",
        "owner_team",
        "contact_name",
        "status",
        "visibility",
        "doc_count",
        "last_updated_at",
        "last_updated_relative",
    }
    assert first["status"] in {"active", "indexing", "error", "archived"}



def test_get_knowledge_spaces_respects_limit_and_emits_cursor_without_database() -> None:
    response = client.get("/api/v1/knowledge-spaces", params={"limit": 1})

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    assert isinstance(body["next_cursor"], str)



def test_get_knowledge_spaces_rejects_invalid_cursor() -> None:
    response = client.get("/api/v1/knowledge-spaces", params={"cursor": "not-a-valid-cursor"})

    assert response.status_code == 422
    assert response.json()["detail"] == "Invalid cursor."



def test_get_knowledge_spaces_filters_by_status_without_database() -> None:
    response = client.get("/api/v1/knowledge-spaces", params={"status": "active"})

    assert response.status_code == 200
    assert all(item["status"] == "active" for item in response.json()["items"])



def test_get_knowledge_spaces_rejects_invalid_visibility_filter() -> None:
    response = client.get("/api/v1/knowledge-spaces", params={"visibility": "invalid"})

    assert response.status_code == 422
    assert response.json()["detail"] == "Invalid visibility filter."