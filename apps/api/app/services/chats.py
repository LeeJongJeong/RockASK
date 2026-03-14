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

from app.schemas.chats import (
    ChatDetailHeader,
    ChatDetailResponse,
    ChatFollowUpItem,
    ChatListItem,
    ChatListQueryParams,
    ChatListResponse,
    ChatMessageItem,
    ChatMessageRole,
    ChatSourceItem,
    ChatSourceType,
    ChatStatus,
)
from app.services.dashboard import _format_relative_datetime
from app.services.dashboard_mock import build_mock_dashboard_payload

logger = logging.getLogger(__name__)

MOCK_CHAT_META_BY_ID: dict[str, dict[str, str]] = {
    "chat-1": {
        "created_at": "2026-03-14T10:24:00+09:00",
        "last_message_at": "2026-03-14T10:30:00+09:00",
        "last_message_preview": "First-week onboarding, security review, and account setup are bundled into one answer.",
        "status": "ready",
    },
    "chat-2": {
        "created_at": "2026-03-13T16:02:00+09:00",
        "last_message_at": "2026-03-13T16:20:00+09:00",
        "last_message_preview": "Backup cadence and restore test steps are summarized for operations.",
        "status": "ready",
    },
    "chat-3": {
        "created_at": "2026-03-11T14:10:00+09:00",
        "last_message_at": "2026-03-11T14:35:00+09:00",
        "last_message_preview": "Budget approvals and sign-off items were extracted into a short brief.",
        "status": "ready",
    },
}

MOCK_CHAT_DETAIL_BODIES: dict[str, dict[str, Any]] = {
    "chat-1": {
        "summary": "The user asked for an onboarding checklist grouped by first-week tasks and required documents.",
        "answer_snapshot": "Start with account setup, security acknowledgement, and team onboarding materials.",
        "messages": [
            {
                "id": "msg-101",
                "role": "user",
                "content": "Please bundle the onboarding guide and required first-week tasks into one answer.",
                "created_at": "2026-03-14T10:24:00+09:00",
                "note": None,
            },
            {
                "id": "msg-102",
                "role": "assistant",
                "content": "Begin with account issuance, security acknowledgement, and required onboarding materials.",
                "created_at": "2026-03-14T10:25:00+09:00",
                "note": "Grouped from onboarding and security documents.",
            },
        ],
        "sources": [
            {
                "id": "source-1",
                "source_type": "document",
                "target_id": "update-onboarding",
                "label": "Onboarding guide",
                "hint": "Required documents and first-week schedule.",
            },
            {
                "id": "source-2",
                "source_type": "knowledge_space",
                "target_id": "ks-strategy",
                "label": "Strategy knowledge space",
                "hint": "Shared operating guidance and linked documents.",
            },
        ],
        "follow_ups": [
            {"id": "followup-1", "text": "Show only first-day tasks."},
            {"id": "followup-2", "text": "List the account setup steps separately."},
            {"id": "followup-3", "text": "Create a short checklist version."},
        ],
    },
    "chat-2": {
        "summary": "The user requested a concise incident-response and backup summary.",
        "answer_snapshot": "Focus on backup cadence, restore tests, and the escalation path.",
        "messages": [
            {
                "id": "msg-201",
                "role": "user",
                "content": "Summarize the server backup policy and recovery checklist.",
                "created_at": "2026-03-13T16:02:00+09:00",
                "note": None,
            },
            {
                "id": "msg-202",
                "role": "assistant",
                "content": "Review backup cadence, restore validation, and alert escalation steps.",
                "created_at": "2026-03-13T16:08:00+09:00",
                "note": "Summarized from ops guide documents.",
            },
        ],
        "sources": [
            {
                "id": "source-3",
                "source_type": "document",
                "target_id": "update-sre",
                "label": "Ops report guide",
                "hint": "Post-incident and operational reporting guide.",
            },
            {
                "id": "source-4",
                "source_type": "knowledge_space",
                "target_id": "ks-engineering",
                "label": "Engineering knowledge space",
                "hint": "Ops and deployment guidance grouped together.",
            },
        ],
        "follow_ups": [
            {"id": "followup-4", "text": "Show only rollback steps."},
            {"id": "followup-5", "text": "Convert this into a short ops notice."},
            {"id": "followup-6", "text": "Turn this into a weekly checklist."},
        ],
    },
    "chat-3": {
        "summary": "The user asked for a leadership-ready budget summary.",
        "answer_snapshot": "Extract approval status, outstanding questions, and next sign-off items.",
        "messages": [
            {
                "id": "msg-301",
                "role": "user",
                "content": "Pull out only the budget decision points from the Q3 planning docs.",
                "created_at": "2026-03-11T14:10:00+09:00",
                "note": None,
            },
            {
                "id": "msg-302",
                "role": "assistant",
                "content": "I grouped approval points, open questions, and final sign-off into a short brief.",
                "created_at": "2026-03-11T14:18:00+09:00",
                "note": "Summarized from planning documents.",
            },
        ],
        "sources": [
            {
                "id": "source-5",
                "source_type": "knowledge_space",
                "target_id": "ks-strategy",
                "label": "Strategy knowledge space",
                "hint": "Planning and approval documents grouped together.",
            },
            {
                "id": "source-6",
                "source_type": "document",
                "target_id": "update-security",
                "label": "Security checklist",
                "hint": "Reference document for operational controls.",
            },
        ],
        "follow_ups": [
            {"id": "followup-7", "text": "Reduce this to a three-line brief."},
            {"id": "followup-8", "text": "Show only approval blockers."},
            {"id": "followup-9", "text": "Sort the items by urgency."},
        ],
    },
}

CHAT_LIST_BASE_SQL = """
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
        COALESCE(NULLIF(c.title, ''), 'Untitled chat') AS chat_title,
        COALESCE(a.name, 'Default assistant') AS assistant_name,
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
SELECT chat_uuid, chat_id, chat_title, assistant_name, last_message_preview, last_message_at, api_status
FROM chat_rows
"""

CHAT_DETAIL_HEADER_SQL = text(
    """
    WITH latest_query AS (
        SELECT DISTINCT ON (qr.chat_id)
            qr.chat_id,
            qr.query_status::text AS query_status
        FROM rockask.query_runs AS qr
        ORDER BY qr.chat_id, qr.created_at DESC, qr.id DESC
    ),
    last_message AS (
        SELECT m.chat_id, MAX(m.created_at) AS last_message_at
        FROM rockask.messages AS m
        GROUP BY m.chat_id
    )
    SELECT
        c.id AS chat_uuid,
        c.id::text AS chat_id,
        COALESCE(NULLIF(c.title, ''), 'Untitled chat') AS chat_title,
        COALESCE(a.name, 'Default assistant') AS assistant_name,
        c.created_at,
        COALESCE(c.last_message_at, lm.last_message_at, c.updated_at, c.created_at) AS last_message_at,
        CASE
            WHEN c.status = 'archived' THEN 'archived'
            WHEN lq.query_status IN ('queued', 'running') THEN 'processing'
            WHEN lq.query_status = 'failed' THEN 'error'
            ELSE 'ready'
        END AS api_status
    FROM rockask.chats AS c
    LEFT JOIN rockask.assistants AS a ON a.id = c.assistant_id
    LEFT JOIN latest_query AS lq ON lq.chat_id = c.id
    LEFT JOIN last_message AS lm ON lm.chat_id = c.id
    WHERE c.user_id = CAST(:user_id AS uuid)
      AND c.status <> 'deleted'
      AND c.id::text = :chat_lookup
    LIMIT 1
    """
)

CHAT_DETAIL_MESSAGES_SQL = text(
    """
    SELECT
        m.id::text AS message_id,
        m.role::text AS role,
        m.content,
        m.created_at,
        NULLIF(BTRIM(m.metadata ->> 'note'), '') AS note,
        COALESCE(m.metadata, '{}'::jsonb)::text AS metadata_json
    FROM rockask.messages AS m
    WHERE m.chat_id = CAST(:chat_uuid AS uuid)
      AND m.role IN ('user', 'assistant')
    ORDER BY m.created_at ASC, m.id ASC
    """
)

CHAT_DETAIL_DOCUMENT_SOURCES_SQL = text(
    """
    WITH ranked_docs AS (
        SELECT
            cit.id::text AS source_id,
            d.id::text AS target_id,
            d.title AS label,
            COALESCE(
                NULLIF(BTRIM(d.metadata ->> 'summary'), ''),
                COALESCE(ks.name, 'Related document') || ' summary'
            ) AS hint,
            ROW_NUMBER() OVER (PARTITION BY d.id ORDER BY cit.ordinal ASC, cit.created_at ASC, cit.id ASC) AS source_rank,
            MIN(cit.ordinal) OVER (PARTITION BY d.id) AS first_ordinal
        FROM rockask.citations AS cit
        INNER JOIN rockask.messages AS m ON m.id = cit.message_id
        INNER JOIN rockask.documents AS d ON d.id = cit.document_id
        LEFT JOIN rockask.knowledge_spaces AS ks ON ks.id = d.knowledge_space_id
        WHERE m.chat_id = CAST(:chat_uuid AS uuid)
    )
    SELECT source_id, target_id, label, hint, first_ordinal
    FROM ranked_docs
    WHERE source_rank = 1
    ORDER BY first_ordinal ASC, label ASC
    LIMIT 3
    """
)

CHAT_DETAIL_SPACE_SOURCES_SQL = text(
    """
    WITH ranked_spaces AS (
        SELECT
            'space-' || ks.id::text AS source_id,
            COALESCE(NULLIF(ks.code, ''), ks.id::text) AS target_id,
            ks.name AS label,
            COALESCE(
                NULLIF(BTRIM(ks.description), ''),
                COALESCE(t.name, 'Unassigned team') || ' operating space'
            ) AS hint,
            ROW_NUMBER() OVER (PARTITION BY ks.id ORDER BY cit.ordinal ASC, cit.created_at ASC, cit.id ASC) AS source_rank,
            MIN(cit.ordinal) OVER (PARTITION BY ks.id) AS first_ordinal
        FROM rockask.citations AS cit
        INNER JOIN rockask.messages AS m ON m.id = cit.message_id
        INNER JOIN rockask.documents AS d ON d.id = cit.document_id
        INNER JOIN rockask.knowledge_spaces AS ks ON ks.id = d.knowledge_space_id
        LEFT JOIN rockask.teams AS t ON t.id = ks.owner_team_id
        WHERE m.chat_id = CAST(:chat_uuid AS uuid)
    )
    SELECT source_id, target_id, label, hint, first_ordinal
    FROM ranked_spaces
    WHERE source_rank = 1
    ORDER BY first_ordinal ASC, label ASC
    LIMIT 2
    """
)


def list_chats_response(params: ChatListQueryParams, *, session: Session | None = None) -> ChatListResponse:
    if session is None:
        return _build_mock_list_response(params)

    try:
        user_id = _resolve_active_user_id(session)
        if user_id is None:
            return _build_mock_list_response(params)

        cursor_last_message_at, cursor_chat_id = _decode_cursor(params.cursor)
        query, query_params = _build_chat_list_query(
            user_id=user_id,
            params=params,
            cursor_last_message_at=cursor_last_message_at,
            cursor_chat_id=cursor_chat_id,
        )
        rows = session.execute(query, query_params).mappings().all()
        items = [_map_chat_row(row) for row in rows[: params.limit]]
        next_cursor = _build_next_cursor(items[-1]) if len(rows) > params.limit and items else None
        return ChatListResponse(items=items, next_cursor=next_cursor)
    except HTTPException:
        raise
    except SQLAlchemyError:
        logger.exception("Falling back to mock chat list because database read failed.")
        session.rollback()
        return _build_mock_list_response(params)


def get_chat_detail_response(chat_id: str, *, session: Session | None = None) -> ChatDetailResponse:
    mock_response = _build_mock_detail_response(chat_id)
    if session is None:
        if mock_response is not None:
            return mock_response
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found.")

    try:
        user_id = _resolve_active_user_id(session)
        if user_id is None:
            if mock_response is not None:
                return mock_response
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found.")

        header_row = session.execute(
            CHAT_DETAIL_HEADER_SQL,
            {"user_id": user_id, "chat_lookup": chat_id},
        ).mappings().one_or_none()
        if header_row is None:
            if mock_response is not None:
                return mock_response
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found.")

        chat_uuid = str(header_row["chat_uuid"])
        message_rows = session.execute(CHAT_DETAIL_MESSAGES_SQL, {"chat_uuid": chat_uuid}).mappings().all()
        document_source_rows = session.execute(
            CHAT_DETAIL_DOCUMENT_SOURCES_SQL,
            {"chat_uuid": chat_uuid},
        ).mappings().all()
        knowledge_space_source_rows = session.execute(
            CHAT_DETAIL_SPACE_SOURCES_SQL,
            {"chat_uuid": chat_uuid},
        ).mappings().all()

        messages = [_map_chat_message_row(row) for row in message_rows]
        latest_assistant_row = _find_latest_assistant_row(message_rows)
        return ChatDetailResponse(
            chat=_map_chat_detail_header(header_row),
            summary=_build_chat_summary(header_row, messages),
            answer_snapshot=_build_answer_snapshot(messages),
            messages=messages,
            sources=[
                *[
                    _map_chat_source_row(row, source_type="document")
                    for row in document_source_rows
                ],
                *[
                    _map_chat_source_row(row, source_type="knowledge_space")
                    for row in knowledge_space_source_rows
                ],
            ],
            follow_ups=_build_follow_ups(chat_id, header_row, latest_assistant_row),
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        logger.exception("Failed to load chat detail from database.")
        session.rollback()
        if mock_response is not None:
            return mock_response
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load chat detail.",
        )


def _resolve_active_user_id(session: Session) -> str | None:
    return session.execute(
        text(
            "SELECT id::text FROM rockask.users WHERE status = 'active' ORDER BY last_login_at DESC NULLS LAST, created_at ASC LIMIT 1"
        )
    ).scalar_one_or_none()


def _build_chat_list_query(
    *,
    user_id: str,
    params: ChatListQueryParams,
    cursor_last_message_at: datetime | None,
    cursor_chat_id: str | None,
) -> tuple[Any, dict[str, object]]:
    filters: list[str] = []
    query_params: dict[str, object] = {
        "user_id": user_id,
        "limit_plus_one": params.limit + 1,
    }

    if params.status is None:
        filters.append("api_status <> 'archived'")
    else:
        filters.append("api_status = :status_filter")
        query_params["status_filter"] = params.status

    if cursor_last_message_at is not None and cursor_chat_id is not None:
        filters.append(
            "(last_message_at < :cursor_last_message_at OR "
            "(last_message_at = :cursor_last_message_at AND chat_uuid < CAST(:cursor_chat_id AS uuid)))"
        )
        query_params["cursor_last_message_at"] = cursor_last_message_at
        query_params["cursor_chat_id"] = cursor_chat_id

    where_clause = " AND\n    ".join(filters) if filters else "1 = 1"
    query = text(
        f"""
        {CHAT_LIST_BASE_SQL}
        WHERE {where_clause}
        ORDER BY last_message_at DESC, chat_uuid DESC
        LIMIT :limit_plus_one
        """
    )
    return query, query_params


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


def _map_chat_detail_header(row: Any) -> ChatDetailHeader:
    created_at = cast(datetime, row["created_at"])
    last_message_at = cast(datetime, row["last_message_at"])
    return ChatDetailHeader(
        id=str(row["chat_id"]),
        title=str(row["chat_title"]),
        assistant_name=str(row["assistant_name"]),
        status=cast(ChatStatus, str(row["api_status"])),
        created_at=created_at,
        last_message_at=last_message_at,
        last_message_relative=_format_relative_datetime(last_message_at),
    )


def _map_chat_message_row(row: Any) -> ChatMessageItem:
    return ChatMessageItem(
        id=str(row["message_id"]),
        role=cast(ChatMessageRole, str(row["role"])),
        content=str(row["content"]),
        created_at=cast(datetime, row["created_at"]),
        note=_normalize_optional_text(row["note"]),
    )


def _map_chat_source_row(row: Any, *, source_type: ChatSourceType) -> ChatSourceItem:
    return ChatSourceItem(
        id=str(row["source_id"]),
        source_type=source_type,
        target_id=str(row["target_id"]),
        label=str(row["label"]),
        hint=_truncate_text(str(row["hint"]), 120),
    )


def _build_mock_list_response(params: ChatListQueryParams) -> ChatListResponse:
    items = _build_mock_list_items()
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


def _build_mock_list_items() -> list[ChatListItem]:
    dashboard = build_mock_dashboard_payload()
    items: list[ChatListItem] = []
    for chat in dashboard.recentChats:
        meta = MOCK_CHAT_META_BY_ID.get(
            chat.id,
            {
                "created_at": "2026-03-14T09:00:00+09:00",
                "last_message_at": "2026-03-14T09:10:00+09:00",
                "last_message_preview": "Latest chat preview is being prepared.",
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


def _build_mock_detail_response(chat_id: str) -> ChatDetailResponse | None:
    dashboard = build_mock_dashboard_payload()
    chat = next((item for item in dashboard.recentChats if item.id == chat_id), None)
    if chat is None:
        return None

    meta = MOCK_CHAT_META_BY_ID.get(chat_id)
    body = MOCK_CHAT_DETAIL_BODIES.get(chat_id)
    if meta is None or body is None:
        return None

    created_at = datetime.fromisoformat(meta["created_at"])
    last_message_at = datetime.fromisoformat(meta["last_message_at"])
    return ChatDetailResponse(
        chat=ChatDetailHeader(
            id=chat.id,
            title=chat.title,
            assistant_name=chat.assistantName,
            status=cast(ChatStatus, meta["status"]),
            created_at=created_at,
            last_message_at=last_message_at,
            last_message_relative=chat.lastMessageRelative,
        ),
        summary=str(body["summary"]),
        answer_snapshot=str(body["answer_snapshot"]),
        messages=[
            ChatMessageItem(
                id=str(item["id"]),
                role=cast(ChatMessageRole, item["role"]),
                content=str(item["content"]),
                created_at=datetime.fromisoformat(str(item["created_at"])),
                note=_normalize_optional_text(item["note"]),
            )
            for item in cast(list[dict[str, Any]], body["messages"])
        ],
        sources=[
            ChatSourceItem(
                id=str(item["id"]),
                source_type=cast(ChatSourceType, item["source_type"]),
                target_id=str(item["target_id"]),
                label=str(item["label"]),
                hint=str(item["hint"]),
            )
            for item in cast(list[dict[str, Any]], body["sources"])
        ],
        follow_ups=[
            ChatFollowUpItem(id=str(item["id"]), text=str(item["text"]))
            for item in cast(list[dict[str, Any]], body["follow_ups"])
        ],
    )


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
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid cursor.") from exc


def _build_next_cursor(item: ChatListItem) -> str:
    payload = json.dumps(
        {"last_message_at": item.last_message_at.isoformat(), "id": item.id},
        separators=(",", ":"),
    ).encode("utf-8")
    return base64.b64encode(payload).decode("ascii")


def _build_chat_summary(header_row: Any, messages: list[ChatMessageItem]) -> str:
    user_messages = [message for message in messages if message.role == "user"]
    if user_messages:
        return _truncate_text(user_messages[-1].content, 220)
    return _truncate_text(str(header_row["chat_title"]), 220)


def _build_answer_snapshot(messages: list[ChatMessageItem]) -> str:
    assistant_messages = [message for message in messages if message.role == "assistant"]
    if assistant_messages:
        return _truncate_text(assistant_messages[-1].content, 260)
    return "No assistant answer has been recorded yet."


def _build_follow_ups(
    chat_id: str, header_row: Any, latest_assistant_row: Any | None
) -> list[ChatFollowUpItem]:
    metadata = _parse_metadata(latest_assistant_row["metadata_json"]) if latest_assistant_row else {}
    raw_follow_ups = metadata.get("follow_ups")
    if isinstance(raw_follow_ups, list):
        follow_up_items = [
            ChatFollowUpItem(
                id=f"{chat_id}-followup-{index + 1}",
                text=_truncate_text(str(item), 120),
            )
            for index, item in enumerate(raw_follow_ups)
            if str(item).strip()
        ]
        if follow_up_items:
            return follow_up_items[:3]

    title = str(header_row["chat_title"])
    return [
        ChatFollowUpItem(id=f"{chat_id}-followup-1", text="Turn the answer into a checklist."),
        ChatFollowUpItem(
            id=f"{chat_id}-followup-2",
            text=f"Show only documents related to {_truncate_text(title, 40)}.",
        ),
        ChatFollowUpItem(id=f"{chat_id}-followup-3", text="Convert this into a short brief."),
    ]


def _find_latest_assistant_row(message_rows: list[Any]) -> Any | None:
    for row in reversed(message_rows):
        if str(row["role"]) == "assistant":
            return row
    return None


def _parse_metadata(raw_value: Any) -> dict[str, Any]:
    if raw_value is None:
        return {}
    try:
        parsed = json.loads(str(raw_value))
    except (TypeError, json.JSONDecodeError):
        return {}
    return cast(dict[str, Any], parsed) if isinstance(parsed, dict) else {}


def _truncate_text(value: str, limit: int) -> str:
    normalized = " ".join(value.split()).strip()
    if len(normalized) <= limit:
        return normalized
    return f"{normalized[: limit - 3]}..."


def _normalize_optional_text(value: Any) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None
