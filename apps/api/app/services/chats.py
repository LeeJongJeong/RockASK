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
        "last_message_preview": "첫 주에는 계정 발급, 보안 서약, 필수 협업 툴 접속 확인을 먼저 진행하면 됩니다.",
        "status": "ready",
    },
    "chat-2": {
        "created_at": "2026-03-13T16:02:00+09:00",
        "last_message_at": "2026-03-13T16:20:00+09:00",
        "last_message_preview": "정기 백업 주기와 복구 테스트 기준으로 우선 확인하면 됩니다.",
        "status": "ready",
    },
    "chat-3": {
        "created_at": "2026-03-11T14:10:00+09:00",
        "last_message_at": "2026-03-11T14:35:00+09:00",
        "last_message_preview": "승인 절차, 검토 팀, 최종 결재 포인트만 먼저 추려서 보고용으로 정리할 수 있습니다.",
        "status": "ready",
    },
}

MOCK_CHAT_DETAIL_BODIES: dict[str, dict[str, Any]] = {
    "chat-1": {
        "summary": "신입 입사자의 첫 주 일정, 필수 교육, 계정 발급 순서를 한 번에 묶어 달라는 요청입니다.",
        "answer_snapshot": "온보딩 답변은 첫날 준비, 첫 주 체크리스트, 누락 시 확인할 담당 팀 순서로 정리하는 것이 가장 재사용성이 높습니다.",
        "messages": [
            {"id": "msg-101", "role": "user", "content": "신입 입사자 온보딩 문서와 필수 교육 일정을 한 번에 정리해 줘.", "created_at": "2026-03-14T10:24:00+09:00", "note": None},
            {"id": "msg-102", "role": "assistant", "content": "첫날에는 계정 발급, 보안 서약, 필수 협업 툴 접속 확인을 우선 진행하고 첫 주 안에 온보딩 교육 일정을 마치는 흐름으로 정리할 수 있습니다.", "created_at": "2026-03-14T10:25:00+09:00", "note": "온보딩 체크리스트와 인사 교육 일정 문서를 근거로 요약"},
            {"id": "msg-103", "role": "user", "content": "개발 직군 기준으로 필요한 시스템 권한까지 같이 묶어 줘.", "created_at": "2026-03-14T10:28:00+09:00", "note": None},
            {"id": "msg-104", "role": "assistant", "content": "개발 직군은 기본 협업 도구 외에도 저장소, 배포 대시보드, 로그 조회 권한을 첫 주 체크리스트에 같이 넣는 편이 안전합니다.", "created_at": "2026-03-14T10:30:00+09:00", "note": None},
        ],
        "sources": [
            {"id": "source-1", "source_type": "document", "target_id": "update-onboarding", "label": "신입 입사자 온보딩 안내", "hint": "첫 주 일정과 필수 서류 목록"},
            {"id": "source-2", "source_type": "knowledge_space", "target_id": "ks-strategy", "label": "사업 계획/공용 안내 공간", "hint": "팀 합류 전에 함께 보는 공통 가이드와 업무 맥락"},
        ],
        "follow_ups": [
            {"id": "followup-1", "text": "첫날 해야 하는 일만 체크리스트 형식으로 다시 정리해 줘"},
            {"id": "followup-2", "text": "개발 직군 기준으로 필요한 시스템 권한만 따로 뽑아 줘"},
            {"id": "followup-3", "text": "교육 일정과 담당 팀을 표로 만들어 줘"},
        ],
    },
    "chat-2": {
        "summary": "운영 변경 사항을 백업 절차와 복구 점검 관점으로 다시 요약해 달라는 요청입니다.",
        "answer_snapshot": "정기 백업 주기, 복구 테스트, 알림 에스컬레이션 순서로 보는 것이 운영팀 전달용으로 가장 안정적입니다.",
        "messages": [
            {"id": "msg-201", "role": "user", "content": "아일랜드 서버 백업 정책 핵심만 요약해줘.", "created_at": "2026-03-13T16:02:00+09:00", "note": None},
            {"id": "msg-202", "role": "assistant", "content": "백업 주기, 보관 기간, 복구 테스트 기준을 먼저 보는 게 운영 전달에 가장 중요합니다.", "created_at": "2026-03-13T16:08:00+09:00", "note": "운영 가이드와 장애 보고서 템플릿 기준으로 요약"},
            {"id": "msg-203", "role": "user", "content": "운영팀이 바로 확인할 항목만 다시 뽑아줘.", "created_at": "2026-03-13T16:13:00+09:00", "note": None},
            {"id": "msg-204", "role": "assistant", "content": "백업 성공 여부, 복구 테스트 결과, 경보 수신 상태, 실패 시 에스컬레이션 경로 네 가지를 우선 확인하면 됩니다.", "created_at": "2026-03-13T16:20:00+09:00", "note": None},
        ],
        "sources": [
            {"id": "source-3", "source_type": "document", "target_id": "update-sre", "label": "장애 보고서 작성 가이드", "hint": "운영 이슈와 사후 분석 구조를 정리한 문서"},
            {"id": "source-4", "source_type": "knowledge_space", "target_id": "ks-engineering", "label": "기술개발본부 가이드라인", "hint": "운영 절차와 백업 기준이 함께 정리된 공간"},
        ],
        "follow_ups": [
            {"id": "followup-4", "text": "백업 실패 시 대응 순서만 다시 정리해 줘"},
            {"id": "followup-5", "text": "운영 공지 문안으로 바꿔 줘"},
            {"id": "followup-6", "text": "주간 점검 체크리스트로 변환해 줘"},
        ],
    },
    "chat-3": {
        "summary": "예산 문서에서 승인 절차와 의사결정 포인트만 추려 달라는 요청입니다.",
        "answer_snapshot": "결재 단계, 승인 담당, 이번 주 안에 결정해야 할 항목 중심으로 다시 읽어내는 것이 보고용으로 적합합니다.",
        "messages": [
            {"id": "msg-301", "role": "user", "content": "Q3 마케팅 예산 문서에서 승인 절차만 뽑아줘.", "created_at": "2026-03-11T14:10:00+09:00", "note": None},
            {"id": "msg-302", "role": "assistant", "content": "승인 대상 항목, 검토 팀, 최종 결재 단계 순으로 정리하면 회의 전에 빠르게 공유하기 좋습니다.", "created_at": "2026-03-11T14:18:00+09:00", "note": "사업 계획 관련 문서를 근거로 요약"},
            {"id": "msg-303", "role": "user", "content": "회의에서 바로 읽을 수 있게 더 짧게 정리해줘.", "created_at": "2026-03-11T14:25:00+09:00", "note": None},
            {"id": "msg-304", "role": "assistant", "content": "이번 주 내 결재 필요 항목 2건과 추가 확인이 필요한 항목 1건만 먼저 공유하면 됩니다.", "created_at": "2026-03-11T14:35:00+09:00", "note": None},
        ],
        "sources": [
            {"id": "source-5", "source_type": "knowledge_space", "target_id": "ks-strategy", "label": "2026 상반기 사업계획서", "hint": "예산과 우선순위 문서가 모여 있는 공간"},
            {"id": "source-6", "source_type": "document", "target_id": "update-security", "label": "보안 점검 체크리스트 v3", "hint": "승인 전 필수 점검 항목 참고 문서"},
        ],
        "follow_ups": [
            {"id": "followup-7", "text": "리더 보고용 3줄 요약으로 줄여 줘"},
            {"id": "followup-8", "text": "승인 대기 항목만 따로 뽑아 줘"},
            {"id": "followup-9", "text": "리스크 항목 기준으로 다시 분류해 줘"},
        ],
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
    SELECT chat_uuid, chat_id, chat_title, assistant_name, last_message_preview, last_message_at, api_status
    FROM chat_rows
    WHERE ((:status_filter IS NULL AND api_status <> 'archived') OR (:status_filter IS NOT NULL AND api_status = :status_filter))
      AND (
        :cursor_last_message_at IS NULL
        OR last_message_at < :cursor_last_message_at
        OR (last_message_at = :cursor_last_message_at AND chat_uuid < CAST(:cursor_chat_id AS uuid))
      )
    ORDER BY last_message_at DESC, chat_uuid DESC
    LIMIT :limit_plus_one
    """
)

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
        COALESCE(NULLIF(c.title, ''), '새 대화') AS chat_title,
        COALESCE(a.name, '기본 어시스턴트') AS assistant_name,
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
            COALESCE(NULLIF(BTRIM(d.metadata ->> 'summary'), ''), COALESCE(ks.name, '관련 문서') || ' 관련 문서') AS hint,
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
            COALESCE(NULLIF(BTRIM(ks.description), ''), COALESCE(t.name, '미지정 팀') || ' 운영 공간') AS hint,
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
        rows = session.execute(
            CHAT_LIST_SQL,
            {"user_id": user_id, "status_filter": params.status, "cursor_last_message_at": cursor_last_message_at, "cursor_chat_id": cursor_chat_id, "limit_plus_one": params.limit + 1},
        ).mappings().all()
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
        header_row = session.execute(CHAT_DETAIL_HEADER_SQL, {"user_id": user_id, "chat_lookup": chat_id}).mappings().one_or_none()
        if header_row is None:
            if mock_response is not None:
                return mock_response
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found.")
        chat_uuid = str(header_row["chat_uuid"])
        message_rows = session.execute(CHAT_DETAIL_MESSAGES_SQL, {"chat_uuid": chat_uuid}).mappings().all()
        document_source_rows = session.execute(CHAT_DETAIL_DOCUMENT_SOURCES_SQL, {"chat_uuid": chat_uuid}).mappings().all()
        knowledge_space_source_rows = session.execute(CHAT_DETAIL_SPACE_SOURCES_SQL, {"chat_uuid": chat_uuid}).mappings().all()
        messages = [_map_chat_message_row(row) for row in message_rows]
        latest_assistant_row = _find_latest_assistant_row(message_rows)
        return ChatDetailResponse(
            chat=_map_chat_detail_header(header_row),
            summary=_build_chat_summary(header_row, messages),
            answer_snapshot=_build_answer_snapshot(messages),
            messages=messages,
            sources=[*[_map_chat_source_row(row, source_type="document") for row in document_source_rows], *[_map_chat_source_row(row, source_type="knowledge_space") for row in knowledge_space_source_rows]],
            follow_ups=_build_follow_ups(chat_id, header_row, latest_assistant_row),
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        logger.exception("Failed to load chat detail from database.")
        session.rollback()
        if mock_response is not None:
            return mock_response
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to load chat detail.")


def _resolve_active_user_id(session: Session) -> str | None:
    return session.execute(text("SELECT id::text FROM rockask.users WHERE status = 'active' ORDER BY last_login_at DESC NULLS LAST, created_at ASC LIMIT 1")).scalar_one_or_none()


def _map_chat_row(row: Any) -> ChatListItem:
    last_message_at = cast(datetime, row["last_message_at"])
    return ChatListItem(id=str(row["chat_id"]), title=str(row["chat_title"]), assistant_name=str(row["assistant_name"]), last_message_preview=_normalize_optional_text(row["last_message_preview"]), last_message_at=last_message_at, last_message_relative=_format_relative_datetime(last_message_at), status=cast(ChatStatus, str(row["api_status"])))


def _map_chat_detail_header(row: Any) -> ChatDetailHeader:
    created_at = cast(datetime, row["created_at"])
    last_message_at = cast(datetime, row["last_message_at"])
    return ChatDetailHeader(id=str(row["chat_id"]), title=str(row["chat_title"]), assistant_name=str(row["assistant_name"]), status=cast(ChatStatus, str(row["api_status"])), created_at=created_at, last_message_at=last_message_at, last_message_relative=_format_relative_datetime(last_message_at))


def _map_chat_message_row(row: Any) -> ChatMessageItem:
    return ChatMessageItem(id=str(row["message_id"]), role=cast(ChatMessageRole, str(row["role"])), content=str(row["content"]), created_at=cast(datetime, row["created_at"]), note=_normalize_optional_text(row["note"]))


def _map_chat_source_row(row: Any, *, source_type: ChatSourceType) -> ChatSourceItem:
    return ChatSourceItem(id=str(row["source_id"]), source_type=source_type, target_id=str(row["target_id"]), label=str(row["label"]), hint=_truncate_text(str(row["hint"]), 120))


def _build_mock_list_response(params: ChatListQueryParams) -> ChatListResponse:
    items = _build_mock_list_items()
    if params.status is None:
        items = [item for item in items if item.status != "archived"]
    else:
        items = [item for item in items if item.status == params.status]
    cursor_last_message_at, cursor_chat_id = _decode_cursor(params.cursor)
    if cursor_last_message_at is not None and cursor_chat_id is not None:
        items = [item for item in items if item.last_message_at < cursor_last_message_at or (item.last_message_at == cursor_last_message_at and item.id < cursor_chat_id)]
    items.sort(key=lambda item: (item.last_message_at, item.id), reverse=True)
    visible_items = items[: params.limit]
    next_cursor = _build_next_cursor(visible_items[-1]) if len(items) > params.limit and visible_items else None
    return ChatListResponse(items=visible_items, next_cursor=next_cursor)


def _build_mock_list_items() -> list[ChatListItem]:
    dashboard = build_mock_dashboard_payload()
    items: list[ChatListItem] = []
    for chat in dashboard.recentChats:
        meta = MOCK_CHAT_META_BY_ID.get(chat.id, {"created_at": "2026-03-14T09:00:00+09:00", "last_message_at": "2026-03-14T09:10:00+09:00", "last_message_preview": "최근 대화 미리보기를 준비 중입니다.", "status": "ready"})
        last_message_at = datetime.fromisoformat(meta["last_message_at"])
        items.append(ChatListItem(id=chat.id, title=chat.title, assistant_name=chat.assistantName, last_message_preview=meta["last_message_preview"], last_message_at=last_message_at, last_message_relative=chat.lastMessageRelative, status=cast(ChatStatus, meta["status"])))
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
        chat=ChatDetailHeader(id=chat.id, title=chat.title, assistant_name=chat.assistantName, status=cast(ChatStatus, meta["status"]), created_at=created_at, last_message_at=last_message_at, last_message_relative=chat.lastMessageRelative),
        summary=str(body["summary"]),
        answer_snapshot=str(body["answer_snapshot"]),
        messages=[ChatMessageItem(id=str(item["id"]), role=cast(ChatMessageRole, item["role"]), content=str(item["content"]), created_at=datetime.fromisoformat(str(item["created_at"])), note=_normalize_optional_text(item["note"])) for item in cast(list[dict[str, Any]], body["messages"])],
        sources=[ChatSourceItem(id=str(item["id"]), source_type=cast(ChatSourceType, item["source_type"]), target_id=str(item["target_id"]), label=str(item["label"]), hint=str(item["hint"])) for item in cast(list[dict[str, Any]], body["sources"])],
        follow_ups=[ChatFollowUpItem(id=str(item["id"]), text=str(item["text"])) for item in cast(list[dict[str, Any]], body["follow_ups"])],
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
    payload = json.dumps({"last_message_at": item.last_message_at.isoformat(), "id": item.id}, separators=(",", ":")).encode("utf-8")
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
    return "대표 답변 스냅샷을 아직 만들지 못했습니다."


def _build_follow_ups(chat_id: str, header_row: Any, latest_assistant_row: Any | None) -> list[ChatFollowUpItem]:
    metadata = _parse_metadata(latest_assistant_row["metadata_json"]) if latest_assistant_row else {}
    raw_follow_ups = metadata.get("follow_ups")
    if isinstance(raw_follow_ups, list):
        follow_up_items = [ChatFollowUpItem(id=f"{chat_id}-followup-{index + 1}", text=_truncate_text(str(item), 120)) for index, item in enumerate(raw_follow_ups) if str(item).strip()]
        if follow_up_items:
            return follow_up_items[:3]
    title = str(header_row["chat_title"])
    return [
        ChatFollowUpItem(id=f"{chat_id}-followup-1", text="핵심만 다시 체크리스트로 정리해 줘"),
        ChatFollowUpItem(id=f"{chat_id}-followup-2", text=f"{_truncate_text(title, 50)}와 관련된 문서만 보여 줘"),
        ChatFollowUpItem(id=f"{chat_id}-followup-3", text="팀 공유용 짧은 요약으로 바꿔 줘"),
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