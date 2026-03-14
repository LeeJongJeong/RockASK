from __future__ import annotations

import base64
import binascii
import json
import logging
from datetime import datetime
from typing import Any, cast

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.chats import ChatListItem, ChatListQueryParams, ChatListResponse, ChatStatus
from app.services.dashboard import _format_relative_datetime
from app.services.dashboard_mock import build_mock_dashboard_payload

logger = logging.getLogger(__name__)

MOCK_CHAT_META_BY_ID: dict[str, dict[str, str]] = {
    "chat-1": {
        "last_message_at": "2026-03-14T10:30:00+09:00",
        "last_message_preview": "첫 주에는 계정 발급, 보안 서약, 필수 협업 툴 접속 확인을 먼저 진행하면 됩니다.",
        "status": "ready",
    },
    "chat-2": {
        "last_message_at": "2026-03-13T16:20:00+09:00",
        "last_message_preview": "정기 백업 주기와 복구 테스트 기준으로 우선 확인하면 됩니다.",
        "status": "ready",
    },
    "chat-3": {
        "last_message_at": "2026-03-11T14:35:00+09:00",
        "last_message_preview": "승인 절차, 검토 팀, 최종 결재 포인트만 먼저 추려서 보고용으로 정리할 수 있습니다.",
        "status": "ready",
    },
}

CHAT_LIST_SQL = text(
    """
    WITH latest_query AS (
        SELECT DISTINCT ON (qr.chat_id)
            qr.chat_id,
            qr.query_status::text AS query_status
        FROM rockask.query_runs AS qr
        ORDER BY qr.chat_id, qr.created_at DESC, qr.id DESC
    ),
    latest_message AS (
        SELECT DISTINCT ON (m.chat_id)
            m.chat_id,
            NULLIF(BTRIM(m.content), '') AS last_message_preview,
            m.created_at AS message_created_at
        FROM rockask.messages AS m
        WHERE NULLIF(BTRIM(m.content), '') IS NOT NULL
        ORDER BY
            m.chat_id,
            m.created_at DESC,
            CASE WHEN m.role = 'assistant' THEN 0 ELSE 1 END,
            m.id DESC
    ),
    chat_rows AS (
        SELECT
            c.id AS chat_uuid,
            c.id::text AS chat_id,
            COALESCE(NULLIF(c.title, ''), '새 대화') AS chat_title,
            COALESCE(a.name, '기본 어시스턴트') AS assistant_name,
            lm.last_message_preview,
            COALESCE(c.last_message_at, lm.message_created_at, c.updated_at, c.created_at) AS last_message_at,
            CASE
                WHEN c.status = 'archived' THEN 'archived'
                WHEN lq.query_status IN ('queued', 'running') THEN 'processing'
                WHEN lq.query_status = 'failed' THEN 'error'
                ELSE 'ready'
            END AS api_status
        FROM rockask.chats AS c
        LEFT JOIN rockask.assistants AS a ON a.id = c.assistant_id
        LEFT JOIN latest_query AS lq ON lq.chat_id = c.id
        LEFT JOIN latest_message AS lm ON lm.chat_id = c.id
        WHERE c.user_id = CAST(:user_id AS uuid)
          AND c.status <> 'deleted'
    )
    SELECT
        chat_uuid,
        chat_id,
        chat_title,
        assistant_name,
        last_message_preview,
        last_message_at,
        api_status
    FROM chat_rows
    WHERE (
        (:status_filter IS NULL AND api_status <> 'archived')
        OR (:status_filter IS NOT NULL AND api_status = :status_filter)
    )
      AND (
        :cursor_last_message_at IS NULL
        OR last_message_at < :cursor_last_message_at
        OR (
            last_message_at = :cursor_last_message_at
            AND chat_uuid < CAST(:cursor_chat_id AS uuid)
        )
      )
    ORDER BY last_message_at DESC, chat_uuid DESC
    LIMIT :limit_plus_one
    """
)


def list_chats_response(
    params: ChatListQueryParams, *, session: Session | None = None
) -> ChatListResponse:
    if session is None:
        return _build_mock_response(params)

    try:
        user_id = _resolve_active_user_id(session)
        if user_id is None:
            return _build_mock_response(params)

        cursor_last_message_at, cursor_chat_id = _decode_cursor(params.cursor)
        rows = session.execute(
            CHAT_LIST_SQL,
            {
                "user_id": user_id,
                "status_filter": params.status,
                "cursor_last_message_at": cursor_last_message_at,
                "cursor_chat_id": cursor_chat_id,
                "limit_plus_one": params.limit + 1,
            },
        ).mappings().all()

        items = [_map_chat_row(row) for row in rows[: params.limit]]
        next_cursor = _build_next_cursor(items[-1]) if len(rows) > params.limit and items else None
        return ChatListResponse(items=items, next_cursor=next_cursor)
    except HTTPException:
        raise
    except SQLAlchemyError:
        logger.exception("Falling back to mock chat list because database read failed.")
        session.rollback()
        return _build_mock_response(params)


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


def _map_chat_row(row: Any) -> ChatListItem:
    last_message_at = cast(datetime, row["last_message_at"])
    return ChatListItem(
        id=str(row["chat_id"]),
        title=str(row["chat_title"]),
        assistant_name=str(row["assistant_name"]),
        last_message_preview=_normalize_optional_text(row["last_message_preview"]),
        last_message_at=last_message_at,
        last_message_relative=_format_relative_datetime(last_message_at),
        status=cast(ChatStatus, str(row["api_status"])),
    )


def _build_mock_response(params: ChatListQueryParams) -> ChatListResponse:
    items = _build_mock_items()

    if params.status is None:
        items = [item for item in items if item.status != "archived"]
    else:
        items = [item for item in items if item.status == params.status]

    cursor_last_message_at, cursor_chat_id = _decode_cursor(params.cursor)
    if cursor_last_message_at is not None and cursor_chat_id is not None:
        items = [
            item
            for item in items
            if item.last_message_at < cursor_last_message_at
            or (item.last_message_at == cursor_last_message_at and item.id < cursor_chat_id)
        ]

    items.sort(key=lambda item: (item.last_message_at, item.id), reverse=True)
    visible_items = items[: params.limit]
    next_cursor = _build_next_cursor(visible_items[-1]) if len(items) > params.limit and visible_items else None
    return ChatListResponse(items=visible_items, next_cursor=next_cursor)


def _build_mock_items() -> list[ChatListItem]:
    dashboard = build_mock_dashboard_payload()
    items: list[ChatListItem] = []

    for chat in dashboard.recentChats:
        meta = MOCK_CHAT_META_BY_ID.get(
            chat.id,
            {
                "last_message_at": "2026-03-14T09:00:00+09:00",
                "last_message_preview": "최근 대화 미리보기를 준비 중입니다.",
                "status": "ready",
            },
        )
        last_message_at = datetime.fromisoformat(meta["last_message_at"])
        items.append(
            ChatListItem(
                id=chat.id,
                title=chat.title,
                assistant_name=chat.assistantName,
                last_message_preview=meta["last_message_preview"],
                last_message_at=last_message_at,
                last_message_relative=chat.lastMessageRelative,
                status=cast(ChatStatus, meta["status"]),
            )
        )

    items.sort(key=lambda item: (item.last_message_at, item.id), reverse=True)
    return items


def _decode_cursor(cursor: str | None) -> tuple[datetime | None, str | None]:
    if cursor is None:
        return None, None

    try:
        decoded = base64.b64decode(cursor.encode("ascii"), validate=True)
        payload = json.loads(decoded.decode("utf-8"))
        last_message_at = datetime.fromisoformat(str(payload["last_message_at"]))
        chat_id = str(payload["id"])
        if not chat_id:
            raise ValueError("Missing chat id in cursor.")
        return last_message_at, chat_id
    except (binascii.Error, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid cursor.",
        ) from exc


def _build_next_cursor(item: ChatListItem) -> str:
    payload = json.dumps(
        {"last_message_at": item.last_message_at.isoformat(), "id": item.id},
        separators=(",", ":"),
    ).encode("utf-8")
    return base64.b64encode(payload).decode("ascii")


def _normalize_optional_text(value: Any) -> str | None:
    if value is None:
        return None

    normalized = str(value).strip()
    return normalized or None