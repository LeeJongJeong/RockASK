from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_document_detail_returns_contract_without_database() -> None:
    response = client.get("/api/v1/documents/update-security")

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {
        "document",
        "overview",
        "highlights",
        "recommended_questions",
        "related_links",
    }
    assert body["document"]["id"] == "update-security"
    assert body["document"]["status"] in {"draft", "indexing", "approved", "archived", "error"}
    assert len(body["highlights"]) >= 1
    assert len(body["recommended_questions"]) >= 1



def test_get_document_detail_returns_not_found_for_unknown_document_without_database() -> None:
    response = client.get("/api/v1/documents/document-unknown")

    assert response.status_code == 404
    assert response.json()["detail"] == "Document not found."