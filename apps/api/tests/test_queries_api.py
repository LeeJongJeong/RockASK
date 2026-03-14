import pytest
from pydantic import ValidationError

from app.api.routes import queries as queries_route
from app.schemas.queries import QueryCreateRequest, QueryCreateResponse
from app.services.queries import build_query_submission


def test_queries_route_contract_metadata() -> None:
    route = next(route for route in queries_route.router.routes if route.path == "")

    assert route.methods == {"POST"}
    assert route.status_code == 201
    assert route.response_model is QueryCreateResponse


def test_query_request_normalizes_documented_fields() -> None:
    request = QueryCreateRequest(
        query="  신규   입사자   규정 정리해줘  ",
        scope_id="  global  ",
        source="dashboard_prompt",
        prompt_template_id="  prompt-onboarding  ",
    )

    assert request.query == "신규 입사자 규정 정리해줘"
    assert request.scope_id == "global"
    assert request.source == "dashboard_prompt"
    assert request.prompt_template_id == "prompt-onboarding"


def test_query_request_rejects_blank_query() -> None:
    with pytest.raises(ValidationError):
        QueryCreateRequest(
            query="   ",
            scope_id="global",
            source="dashboard_header",
        )


def test_build_query_submission_returns_mock_contract_for_mock_scope() -> None:
    response = build_query_submission(
        request=QueryCreateRequest(
            query="온보딩 절차 정리해줘",
            scope_id="global",
            source="dashboard_hero",
        )
    )

    assert response.query_id.startswith("query-")
    assert response.chat_id.startswith("chat-")
    assert response.redirect_url == f"/chats/{response.chat_id}"