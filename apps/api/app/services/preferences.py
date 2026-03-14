from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.preferences import PreferencesUpdateRequest
from app.services.dashboard_mock import build_mock_dashboard_payload

logger = logging.getLogger(__name__)


def update_preferences(*, request: PreferencesUpdateRequest, session: Session | None = None) -> None:
    if session is None:
        return

    try:
        user_id = _select_active_user_id(session)

        if user_id is None:
            return

        apply_last_scope = request.last_scope_id is not None
        resolved_last_scope_id: UUID | None = None

        if request.last_scope_id is not None:
            if request.last_scope_id in _mock_scope_ids():
                apply_last_scope = False
            else:
                resolved_last_scope_id = _resolve_scope_id(session, request.last_scope_id)

                if resolved_last_scope_id is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Search scope not found.",
                    )

        if request.theme is None and not apply_last_scope:
            return

        session.execute(
            text(
                """
                INSERT INTO rockask.user_preferences (
                    user_id,
                    theme,
                    last_scope_id
                )
                VALUES (
                    :user_id,
                    COALESCE(CAST(:theme AS rockask.theme_preference), 'system'::rockask.theme_preference),
                    :last_scope_id
                )
                ON CONFLICT (user_id) DO UPDATE SET
                    theme = COALESCE(CAST(:theme AS rockask.theme_preference), rockask.user_preferences.theme),
                    last_scope_id = CASE
                        WHEN :apply_last_scope THEN :last_scope_id
                        ELSE rockask.user_preferences.last_scope_id
                    END
                """
            ),
            {
                "user_id": user_id,
                "theme": request.theme,
                "last_scope_id": resolved_last_scope_id,
                "apply_last_scope": apply_last_scope,
            },
        )
        session.commit()
    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        session.rollback()
        logger.exception("Failed to update user preferences.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Preferences update failed.",
        ) from exc


def _select_active_user_id(session: Session) -> UUID | None:
    row = session.execute(
        text(
            """
            SELECT id
            FROM rockask.users
            WHERE status = 'active'
            ORDER BY last_login_at DESC NULLS LAST, created_at ASC
            LIMIT 1
            """
        )
    ).mappings().first()

    if row is None:
        return None

    return row["id"]


def _resolve_scope_id(session: Session, scope_id: str) -> UUID | None:
    row = session.execute(
        text(
            """
            SELECT id
            FROM rockask.search_scopes
            WHERE id::text = :scope_id
              AND is_active = TRUE
            LIMIT 1
            """
        ),
        {"scope_id": scope_id},
    ).mappings().first()

    if row is None:
        return None

    return row["id"]


def _mock_scope_ids() -> set[str]:
    return {scope.id for scope in build_mock_dashboard_payload().scopes}