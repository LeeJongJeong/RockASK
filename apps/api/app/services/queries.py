from __future__ import annotations

import json
import logging
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.queries import CreateQueryRequest, CreateQueryResponse

logger = logging.getLogger(__name__)
MOCK_SCOPE_CODES = {"global", "eng", "hr", "mine"}


def create_query_response(
    payload: CreateQueryRequest, *, session: Session | None = None
) -> CreateQueryResponse:
    if session is None:
        return _build_mock_response()

    try:
        user_id = _resolve_active_user_id(session)
        if user_id is None:
            return _build_mock_response()

        scope_id = _resolve_scope_id(session, payload.scope_id)
        if scope_id is None:
            return _build_mock_response()

        prompt_template_id = _resolve_prompt_template_id(session, payload.prompt_template_id)
        chat_id = session.execute(
            text(
                """
                INSERT INTO rockask.chats (user_id, scope_id, title, metadata, last_message_at)
                VALUES (
                    CAST(:user_id AS uuid),
                    CAST(:scope_id AS uuid),
                    :title,
                    CAST(:metadata AS jsonb),
                    NOW()
                )
                RETURNING id::text
                """
            ),
            {
                "user_id": user_id,
                "scope_id": scope_id,
                "title": _build_chat_title(payload.query),
                "metadata": json.dumps({"source": payload.source}),
            },
        ).scalar_one()

        user_message_id = session.execute(
            text(
                """
                INSERT INTO rockask.messages (chat_id, role, content, metadata)
                VALUES (
                    CAST(:chat_id AS uuid),
                    'user',
                    :content,
                    CAST(:metadata AS jsonb)
                )
                RETURNING id::text
                """
            ),
            {
                "chat_id": chat_id,
                "content": payload.query,
                "metadata": json.dumps(
                    {
                        "source": payload.source,
                        "scope_code": payload.scope_id,
                        "prompt_template_code": payload.prompt_template_id,
                    }
                ),
            },
        ).scalar_one()

        query_id = session.execute(
            text(
                """
                INSERT INTO rockask.query_runs (
                    chat_id,
                    user_id,
                    scope_id,
                    prompt_template_id,
                    user_message_id,
                    query_text,
                    query_status
                )
                VALUES (
                    CAST(:chat_id AS uuid),
                    CAST(:user_id AS uuid),
                    CAST(:scope_id AS uuid),
                    CAST(:prompt_template_id AS uuid),
                    CAST(:user_message_id AS uuid),
                    :query_text,
                    'queued'
                )
                RETURNING id::text
                """
            ),
            {
                "chat_id": chat_id,
                "user_id": user_id,
                "scope_id": scope_id,
                "prompt_template_id": prompt_template_id,
                "user_message_id": user_message_id,
                "query_text": payload.query,
            },
        ).scalar_one()

        session.commit()
        return CreateQueryResponse(
            query_id=query_id,
            chat_id=chat_id,
            redirect_url=f"/chats/{chat_id}",
        )
    except SQLAlchemyError:
        logger.exception("Falling back to mock query response because database write failed.")
        session.rollback()
        return _build_mock_response()


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
    if raw_scope_id in MOCK_SCOPE_CODES:
        scope_id = session.execute(
            text(
                """
                SELECT id::text
                FROM rockask.search_scopes
                WHERE code = :scope_code
                LIMIT 1
                """
            ),
            {"scope_code": raw_scope_id},
        ).scalar_one_or_none()
        if scope_id:
            return scope_id

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


def _resolve_prompt_template_id(session: Session, raw_prompt_template_id: str | None) -> str | None:
    if raw_prompt_template_id is None:
        return None

    return session.execute(
        text(
            """
            SELECT id::text
            FROM rockask.prompt_templates
            WHERE id::text = :prompt_lookup OR code = :prompt_lookup
            LIMIT 1
            """
        ),
        {"prompt_lookup": raw_prompt_template_id},
    ).scalar_one_or_none()


def _build_chat_title(query: str) -> str:
    return query if len(query) <= 60 else f"{query[:57]}..."


def _build_mock_response() -> CreateQueryResponse:
    chat_id = f"chat-{uuid4()}"
    return CreateQueryResponse(
        query_id=f"query-{uuid4()}",
        chat_id=chat_id,
        redirect_url=f"/chats/{chat_id}",
    )