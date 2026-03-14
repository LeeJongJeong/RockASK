from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.queries import QueryCreateRequest, QueryCreateResponse
from app.services.dashboard_mock import build_mock_dashboard_payload

logger = logging.getLogger(__name__)


def build_query_submission(
    *, request: QueryCreateRequest, session: Session | None = None
) -> QueryCreateResponse:
    if request.scope_id in _mock_scope_ids():
        return _build_mock_query_submission()

    if session is None:
        return _build_mock_query_submission()

    try:
        user_id = _select_active_user_id(session)

        if user_id is None:
            return _build_mock_query_submission()

        scope_id = _resolve_scope_id(session, request.scope_id)

        if scope_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Search scope not found.",
            )

        prompt_template = _resolve_prompt_template(session, request.prompt_template_id)

        return _persist_query_submission(
            session=session,
            request=request,
            user_id=user_id,
            scope_id=scope_id,
            prompt_template=prompt_template,
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        session.rollback()
        logger.exception("Falling back to mock query submission because database write failed.")
        return _build_mock_query_submission()


def _persist_query_submission(
    *,
    session: Session,
    request: QueryCreateRequest,
    user_id: UUID,
    scope_id: UUID,
    prompt_template: dict[str, UUID | None] | None,
) -> QueryCreateResponse:
    chat_id = uuid4()
    user_message_id = uuid4()
    query_run_id = uuid4()
    now = datetime.now(UTC)
    assistant_id = prompt_template["assistant_id"] if prompt_template else None
    prompt_template_id = prompt_template["prompt_template_id"] if prompt_template else None
    chat_title = _build_chat_title(request.query)
    chat_metadata = json.dumps(
        {
            "created_from": "dashboard",
            "query_source": request.source,
        }
    )
    user_message_metadata = json.dumps(
        {
            "created_from": "dashboard",
            "query_source": request.source,
            "prompt_template_id": request.prompt_template_id,
        }
    )

    session.execute(
        text(
            """
            INSERT INTO rockask.chats (
                id,
                user_id,
                assistant_id,
                scope_id,
                title,
                status,
                last_message_at,
                metadata
            )
            VALUES (
                :chat_id,
                :user_id,
                :assistant_id,
                :scope_id,
                :title,
                'active',
                :last_message_at,
                CAST(:metadata AS jsonb)
            )
            """
        ),
        {
            "chat_id": chat_id,
            "user_id": user_id,
            "assistant_id": assistant_id,
            "scope_id": scope_id,
            "title": chat_title,
            "last_message_at": now,
            "metadata": chat_metadata,
        },
    )

    session.execute(
        text(
            """
            INSERT INTO rockask.messages (
                id,
                chat_id,
                role,
                content,
                metadata,
                created_at
            )
            VALUES (
                :message_id,
                :chat_id,
                'user',
                :content,
                CAST(:metadata AS jsonb),
                :created_at
            )
            """
        ),
        {
            "message_id": user_message_id,
            "chat_id": chat_id,
            "content": request.query,
            "metadata": user_message_metadata,
            "created_at": now,
        },
    )

    session.execute(
        text(
            """
            INSERT INTO rockask.query_runs (
                id,
                chat_id,
                user_id,
                assistant_id,
                scope_id,
                prompt_template_id,
                user_message_id,
                query_text,
                query_status,
                created_at
            )
            VALUES (
                :query_run_id,
                :chat_id,
                :user_id,
                :assistant_id,
                :scope_id,
                :prompt_template_id,
                :user_message_id,
                :query_text,
                'queued',
                :created_at
            )
            """
        ),
        {
            "query_run_id": query_run_id,
            "chat_id": chat_id,
            "user_id": user_id,
            "assistant_id": assistant_id,
            "scope_id": scope_id,
            "prompt_template_id": prompt_template_id,
            "user_message_id": user_message_id,
            "query_text": request.query,
            "created_at": now,
        },
    )

    session.commit()

    return QueryCreateResponse(
        query_id=str(query_run_id),
        chat_id=str(chat_id),
        redirect_url=f"/chats/{chat_id}",
    )


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


def _resolve_prompt_template(
    session: Session, prompt_template_id: str | None
) -> dict[str, UUID | None] | None:
    if prompt_template_id is None:
        return None

    row = session.execute(
        text(
            """
            SELECT
                id AS prompt_template_id,
                assistant_id
            FROM rockask.prompt_templates
            WHERE is_active = TRUE
              AND (code = :prompt_template_id OR id::text = :prompt_template_id)
            LIMIT 1
            """
        ),
        {"prompt_template_id": prompt_template_id},
    ).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt template not found.",
        )

    return {
        "prompt_template_id": row["prompt_template_id"],
        "assistant_id": row["assistant_id"],
    }


def _build_chat_title(query: str) -> str:
    if len(query) <= 80:
        return query

    return f"{query[:77].rstrip()}..."


def _build_mock_query_submission() -> QueryCreateResponse:
    chat_id = f"chat-{uuid4()}"
    query_id = f"query-{uuid4()}"

    return QueryCreateResponse(
        query_id=query_id,
        chat_id=chat_id,
        redirect_url=f"/chats/{chat_id}",
    )


def _mock_scope_ids() -> set[str]:
    return {scope.id for scope in build_mock_dashboard_payload().scopes}