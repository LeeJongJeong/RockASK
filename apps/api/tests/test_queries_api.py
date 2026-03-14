from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_query_returns_contract_without_database() -> None:
    response = client.post(
        "/api/v1/queries",
        json={
            "query": "신규 입사자 온보딩 절차를 요약해줘",
            "scope_id": "global",
            "source": "dashboard_header",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert set(body.keys()) == {"query_id", "chat_id", "redirect_url"}
    assert body["redirect_url"].startswith("/chats/")


def test_create_query_rejects_blank_query() -> None:
    response = client.post(
        "/api/v1/queries",
        json={
            "query": "   ",
            "scope_id": "global",
            "source": "dashboard_header",
        },
    )

    assert response.status_code == 422