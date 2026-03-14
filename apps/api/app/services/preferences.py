from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.preferences import UpdatePreferencesRequest
from app.services.queries import MOCK_SCOPE_CODES

logger = logging.getLogger(__name__)


def update_preferences(payload: UpdatePreferencesRequest, *, session: Session | None = None) -> None:
    if session is None:
        return

    try:
        user_id = _resolve_active_user_id(session)
        if user_id is None:
            return

        resolved_scope_id = None
        last_scope_provided = payload.last_scope_id is not None
        if payload.last_scope_id is not None:
            resolved_scope_id = _resolve_scope_id(session, payload.last_scope_id)
            if resolved_scope_id is None and payload.last_scope_id in MOCK_SCOPE_CODES:
                return

        session.execute(
            text(
                """
                INSERT INTO rockask.user_preferences (
                    user_id,
                    theme,
                    last_scope_id,
                    dashboard_prefs
                )
                VALUES (
                    CAST(:user_id AS uuid),
                    COALESCE(CAST(:theme AS rockask.theme_preference), 'system'::rockask.theme_preference),
                    CAST(:last_scope_id AS uuid),
                    '{}'::jsonb
                )
                ON CONFLICT (user_id)
                DO UPDATE SET
                    theme = COALESCE(
                        CAST(:theme AS rockask.theme_preference),
                        rockask.user_preferences.theme
                    ),
                    last_scope_id = CASE
                        WHEN :last_scope_provided THEN CAST(:last_scope_id AS uuid)
                        ELSE rockask.user_preferences.last_scope_id
                    END,
                    updated_at = NOW()
                """
            ),
            {
                "user_id": user_id,
                "theme": payload.theme,
                "last_scope_id": resolved_scope_id,
                "last_scope_provided": last_scope_provided,
            },
        )
        session.commit()
    except SQLAlchemyError:
        logger.exception("Ignoring preferences update because database write failed.")
        session.rollback()


def _resolve_active_user_id(session: Session) -> str | None:
    return session.execute(
        text(
            """
            SELECT id::text
            FROM rockask.users
            WHERE status = 'active'
            ORDER BY last_login_at DESC NULLS LAST, created_at ASC
            LIMIT 1
            """
        )
    ).scalar_one_or_none()


def _resolve_scope_id(session: Session, raw_scope_id: str) -> str | None:
    return session.execute(
        text(
            """
            SELECT id::text
            FROM rockask.search_scopes
            WHERE id::text = :scope_lookup OR code = :scope_lookup
            LIMIT 1
            """
        ),
        {"scope_lookup": raw_scope_id},
    ).scalar_one_or_none()