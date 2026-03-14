import pytest
from pydantic import ValidationError

from app.api.routes import preferences as preferences_route
from app.schemas.preferences import PreferencesUpdateRequest
from app.services.preferences import update_preferences


def test_preferences_route_contract_metadata() -> None:
    route = next(route for route in preferences_route.router.routes if route.path == "")

    assert route.methods == {"PATCH"}
    assert route.status_code == 204
    assert route.response_model is None


def test_preferences_request_normalizes_fields() -> None:
    request = PreferencesUpdateRequest(
        theme="light",
        last_scope_id="  global  ",
    )

    assert request.theme == "light"
    assert request.last_scope_id == "global"


def test_preferences_request_requires_one_field() -> None:
    with pytest.raises(ValidationError):
        PreferencesUpdateRequest()


def test_update_preferences_allows_mock_scope_without_session() -> None:
    update_preferences(
        request=PreferencesUpdateRequest(
            last_scope_id="global",
        )
    )


def test_update_preferences_allows_theme_only_without_session() -> None:
    update_preferences(
        request=PreferencesUpdateRequest(
            theme="dark",
        )
    )