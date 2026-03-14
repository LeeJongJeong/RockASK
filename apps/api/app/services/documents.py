from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, cast

from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.documents import (
    DocumentDetailHeader,
    DocumentDetailResponse,
    DocumentHighlightItem,
    DocumentRecommendedQuestionItem,
    DocumentRelatedLinkItem,
    DocumentRelatedTargetType,
    DocumentStatus,
)
from app.services.dashboard import _format_relative_datetime, _format_visibility
from app.services.dashboard_mock import build_mock_dashboard_payload

logger = logging.getLogger(__name__)

MOCK_DOCUMENT_META_BY_ID: dict[str, dict[str, str]] = {
    "update-security": {
        "updated_at": "2026-03-14T14:12:00+09:00",
        "status": "approved",
    },
    "update-onboarding": {
        "updated_at": "2026-03-14T13:48:00+09:00",
        "status": "indexing",
    },
    "update-sre": {
        "updated_at": "2026-03-14T13:00:00+09:00",
        "status": "approved",
    },
}

MOCK_DOCUMENT_DETAIL_BODIES: dict[str, dict[str, Any]] = {
    "update-security": {
        "overview": "보안 점검 체크리스트 v3는 배포 전후 필수 확인 항목과 테스트 예외 규칙을 함께 정리한 문서입니다.",
        "highlights": [
            {"id": "highlight-1", "text": "민감 권한 점검 항목이 추가되었습니다."},
            {"id": "highlight-2", "text": "테스트 환경 예외 규칙이 별도 섹션으로 분리되었습니다."},
            {"id": "highlight-3", "text": "검수 완료 후 운영 반영 시 확인해야 할 승인 흐름이 명확해졌습니다."},
        ],
        "recommended_questions": [
            {"id": "rq-1", "text": "이번 버전에서 꼭 달라진 항목만 요약해 줘"},
            {"id": "rq-2", "text": "배포 전에 확인해야 하는 체크포인트만 뽑아 줘"},
            {"id": "rq-3", "text": "예외 허용 조건을 정책 문장 기준으로 설명해 줘"},
        ],
        "related_links": [
            {"id": "rel-1", "target_type": "knowledge_space", "target_id": "ks-strategy", "label": "2026 상반기 사업 계획", "hint": "전사 공통 정책이 모여 있는 공간"},
            {"id": "rel-2", "target_type": "knowledge_space", "target_id": "ks-engineering", "label": "기술 개발 본부 가이드라인", "hint": "운영/배포와 함께 보는 문서 공간"},
        ],
    },
    "update-onboarding": {
        "overview": "신입 입사자 온보딩 안내는 첫 주 일정, 필수 서류, 교육 순서, 부서별 준비 항목을 한 페이지에 정리한 문서입니다.",
        "highlights": [
            {"id": "highlight-4", "text": "입문 교육 일정과 필수 서명 문서 안내가 최신 버전으로 갱신되었습니다."},
            {"id": "highlight-5", "text": "직군별 장비/계정 준비 항목이 추가되었습니다."},
            {"id": "highlight-6", "text": "첫 주 담당 팀과 연락 창구가 표 형식으로 정리되었습니다."},
        ],
        "recommended_questions": [
            {"id": "rq-4", "text": "첫날에 바로 해야 하는 일만 다시 정리해 줘"},
            {"id": "rq-5", "text": "개발 직군 기준 준비물만 따로 보여 줘"},
            {"id": "rq-6", "text": "담당 팀과 연락 창구를 표로 만들어 줘"},
        ],
        "related_links": [
            {"id": "rel-3", "target_type": "chat", "target_id": "chat-1", "label": "온보딩 질문 대화 보기", "hint": "실제 검색 결과가 어떤 답변으로 이어졌는지 확인"},
            {"id": "rel-4", "target_type": "knowledge_space", "target_id": "ks-strategy", "label": "전사 공용 안내 공간", "hint": "공통 운영 문서가 모여 있는 공간"},
        ],
    },
    "update-sre": {
        "overview": "장애 보고서 작성 가이드는 사후 분석 템플릿과 영향 범위 기록 방식을 표준화한 운영 문서입니다.",
        "highlights": [
            {"id": "highlight-7", "text": "사후 분석 요약본에 서비스 영향 범위 필드가 추가되었습니다."},
            {"id": "highlight-8", "text": "재발 방지 항목을 액션 아이템 중심으로 재구성했습니다."},
            {"id": "highlight-9", "text": "운영팀 공지에 바로 붙일 수 있는 보고 문안 예시가 포함되었습니다."},
        ],
        "recommended_questions": [
            {"id": "rq-7", "text": "운영팀 공지용으로 5줄만 뽑아 줘"},
            {"id": "rq-8", "text": "백업 실패 사고에 맞는 작성 예시를 보여 줘"},
            {"id": "rq-9", "text": "이번 변경으로 필수 입력값이 뭐가 바뀌었는지 설명해 줘"},
        ],
        "related_links": [
            {"id": "rel-5", "target_type": "chat", "target_id": "chat-2", "label": "운영 변경 요약 대화 보기", "hint": "실제 질의와 응답 흐름 확인"},
            {"id": "rel-6", "target_type": "knowledge_space", "target_id": "ks-engineering", "label": "기술 개발 본부 가이드라인", "hint": "운영 절차를 함께 관리하는 지식 공간"},
        ],
    },
}

DOCUMENT_DETAIL_SQL = text(
    """
    SELECT
        d.id AS document_uuid,
        d.id::text AS document_id,
        d.title AS document_title,
        COALESCE(t.name, '미지정 팀') AS owner_team,
        d.visibility::text AS visibility_level,
        d.status::text AS document_status,
        COALESCE(dv.status::text, 'active') AS version_status,
        COALESCE(dv.updated_at, d.updated_at, d.created_at) AS updated_at,
        COALESCE(NULLIF(d.metadata ->> 'summary', ''), d.title || ' 문서가 갱신되었습니다.') AS summary_text,
        COALESCE(NULLIF(d.metadata ->> 'overview', ''), NULLIF(d.metadata ->> 'summary', ''), d.title || ' 문서의 상세 정보를 정리한 화면입니다.') AS overview_text,
        COALESCE(d.metadata, '{}'::jsonb)::text AS metadata_json,
        ks.id AS knowledge_space_uuid,
        COALESCE(NULLIF(ks.code, ''), ks.id::text) AS knowledge_space_id,
        COALESCE(ks.name, '연결 공간 없음') AS knowledge_space_name,
        COALESCE(NULLIF(BTRIM(ks.description), ''), COALESCE(t.name, '미지정 팀') || ' 운영 공간') AS knowledge_space_hint
    FROM rockask.documents AS d
    LEFT JOIN rockask.teams AS t ON t.id = d.owner_team_id
    LEFT JOIN rockask.document_versions AS dv ON dv.id = d.current_version_id
    LEFT JOIN rockask.knowledge_spaces AS ks ON ks.id = d.knowledge_space_id
    WHERE d.status <> 'deleted'
      AND d.id::text = :document_lookup
    LIMIT 1
    """
)

RELATED_CHAT_SQL = text(
    """
    WITH related_chats AS (
        SELECT DISTINCT ON (c.id)
            c.id::text AS target_id,
            COALESCE(NULLIF(c.title, ''), '새 대화') AS label,
            COALESCE(NULLIF(qr.query_text, ''), COALESCE(NULLIF(c.title, ''), '관련 대화')) AS hint,
            COALESCE(c.last_message_at, c.updated_at, c.created_at) AS last_message_at
        FROM rockask.citations AS cit
        INNER JOIN rockask.messages AS m ON m.id = cit.message_id
        INNER JOIN rockask.chats AS c ON c.id = m.chat_id
        LEFT JOIN LATERAL (
            SELECT qr.query_text
            FROM rockask.query_runs AS qr
            WHERE qr.chat_id = c.id
            ORDER BY qr.created_at DESC, qr.id DESC
            LIMIT 1
        ) AS qr ON TRUE
        WHERE cit.document_id = CAST(:document_uuid AS uuid)
          AND c.status <> 'deleted'
        ORDER BY c.id, COALESCE(c.last_message_at, c.updated_at, c.created_at) DESC
    )
    SELECT target_id, label, hint, last_message_at
    FROM related_chats
    ORDER BY last_message_at DESC
    LIMIT 1
    """
)

RELATED_DOCUMENT_SQL = text(
    """
    SELECT
        sibling.id::text AS target_id,
        sibling.title AS label,
        COALESCE(NULLIF(sibling.metadata ->> 'summary', ''), sibling.title || ' 문서가 함께 관리됩니다.') AS hint,
        COALESCE(sibling.updated_at, sibling.created_at) AS updated_at
    FROM rockask.documents AS sibling
    WHERE sibling.knowledge_space_id = CAST(:knowledge_space_uuid AS uuid)
      AND sibling.id <> CAST(:document_uuid AS uuid)
      AND sibling.status <> 'deleted'
    ORDER BY COALESCE(sibling.updated_at, sibling.created_at) DESC, sibling.id DESC
    LIMIT 1
    """
)
def get_document_detail_response(
    document_id: str, *, session: Session | None = None
) -> DocumentDetailResponse:
    mock_response = _build_mock_document_detail_response(document_id)
    if session is None:
        if mock_response is not None:
            return mock_response
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    try:
        row = session.execute(
            DOCUMENT_DETAIL_SQL,
            {"document_lookup": document_id},
        ).mappings().one_or_none()

        if row is None:
            if mock_response is not None:
                return mock_response
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

        metadata = _parse_metadata(row["metadata_json"])
        return DocumentDetailResponse(
            document=_map_document_header(row),
            overview=_build_overview(row, metadata),
            highlights=_build_highlights(row, metadata),
            recommended_questions=_build_recommended_questions(row, metadata),
            related_links=_build_related_links(session, row, metadata),
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        logger.exception("Failed to load document detail from database.")
        session.rollback()
        if mock_response is not None:
            return mock_response
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load document detail.",
        )



def _map_document_header(row: Any) -> DocumentDetailHeader:
    updated_at = cast(datetime, row["updated_at"])
    return DocumentDetailHeader(
        id=str(row["document_id"]),
        title=str(row["document_title"]),
        owner_team=str(row["owner_team"]),
        visibility=_format_visibility(str(row["visibility_level"])),
        status=_map_document_status(str(row["document_status"]), str(row["version_status"])),
        updated_at=updated_at,
        updated_relative=_format_relative_datetime(updated_at),
        summary=_truncate_text(str(row["summary_text"]), 180),
    )



def _build_overview(row: Any, metadata: dict[str, Any]) -> str:
    overview = metadata.get("overview")
    if isinstance(overview, str) and overview.strip():
        return _truncate_text(overview, 400)
    return _truncate_text(str(row["overview_text"]), 400)



def _build_highlights(row: Any, metadata: dict[str, Any]) -> list[DocumentHighlightItem]:
    raw_highlights = metadata.get("highlights")
    parsed_highlights = _parse_text_items(raw_highlights, prefix="highlight")
    if parsed_highlights:
        return [DocumentHighlightItem(id=item["id"], text=item["text"]) for item in parsed_highlights[:3]]

    document_id = str(row["document_id"])
    status_hint = _document_status_hint(_map_document_status(str(row["document_status"]), str(row["version_status"])))
    return [
        DocumentHighlightItem(
            id=f"{document_id}-highlight-1",
            text=_truncate_text(f"{row['owner_team']}에서 최근 갱신한 문서입니다.", 120),
        ),
        DocumentHighlightItem(
            id=f"{document_id}-highlight-2",
            text=_truncate_text(f"공개 범위는 {_format_visibility(str(row['visibility_level']))} 기준으로 관리됩니다.", 120),
        ),
        DocumentHighlightItem(
            id=f"{document_id}-highlight-3",
            text=status_hint,
        ),
    ]



def _build_recommended_questions(
    row: Any, metadata: dict[str, Any]
) -> list[DocumentRecommendedQuestionItem]:
    raw_questions = metadata.get("recommended_questions") or metadata.get("questions")
    parsed_questions = _parse_text_items(raw_questions, prefix="question")
    if parsed_questions:
        return [
            DocumentRecommendedQuestionItem(id=item["id"], text=item["text"])
            for item in parsed_questions[:3]
        ]

    document_id = str(row["document_id"])
    title = _truncate_text(str(row["document_title"]), 60)
    return [
        DocumentRecommendedQuestionItem(
            id=f"{document_id}-question-1",
            text=f"{title}의 핵심 변경점만 요약해 줘",
        ),
        DocumentRecommendedQuestionItem(
            id=f"{document_id}-question-2",
            text=f"{title}를 적용할 때 확인해야 할 체크포인트를 알려 줘",
        ),
        DocumentRecommendedQuestionItem(
            id=f"{document_id}-question-3",
            text=f"{title}와 함께 봐야 할 관련 문서를 보여 줘",
        ),
    ]



def _build_related_links(
    session: Session, row: Any, metadata: dict[str, Any]
) -> list[DocumentRelatedLinkItem]:
    raw_links = metadata.get("related_links")
    parsed_links = _parse_related_links(raw_links)
    if parsed_links:
        return parsed_links[:3]

    links: list[DocumentRelatedLinkItem] = []
    document_id = str(row["document_id"])
    document_uuid = str(row["document_uuid"])
    knowledge_space_uuid = row["knowledge_space_uuid"]
    knowledge_space_id = _normalize_optional_text(row["knowledge_space_id"])

    if knowledge_space_id:
        links.append(
            DocumentRelatedLinkItem(
                id=f"{document_id}-space",
                target_type="knowledge_space",
                target_id=knowledge_space_id,
                label=str(row["knowledge_space_name"]),
                hint=_truncate_text(str(row["knowledge_space_hint"]), 120),
            )
        )

    related_chat_row = session.execute(
        RELATED_CHAT_SQL,
        {"document_uuid": document_uuid},
    ).mappings().one_or_none()
    if related_chat_row is not None:
        links.append(
            DocumentRelatedLinkItem(
                id=f"{document_id}-chat",
                target_type="chat",
                target_id=str(related_chat_row["target_id"]),
                label=str(related_chat_row["label"]),
                hint=_truncate_text(str(related_chat_row["hint"]), 120),
            )
        )

    if knowledge_space_uuid is not None:
        related_document_row = session.execute(
            RELATED_DOCUMENT_SQL,
            {
                "knowledge_space_uuid": str(knowledge_space_uuid),
                "document_uuid": document_uuid,
            },
        ).mappings().one_or_none()
        if related_document_row is not None:
            links.append(
                DocumentRelatedLinkItem(
                    id=f"{document_id}-document",
                    target_type="document",
                    target_id=str(related_document_row["target_id"]),
                    label=str(related_document_row["label"]),
                    hint=_truncate_text(str(related_document_row["hint"]), 120),
                )
            )

    return links[:3]



def _build_mock_document_detail_response(document_id: str) -> DocumentDetailResponse | None:
    dashboard = build_mock_dashboard_payload()
    document = next((item for item in dashboard.recentUpdates if item.id == document_id), None)
    if document is None:
        return None

    meta = MOCK_DOCUMENT_META_BY_ID.get(document_id)
    body = MOCK_DOCUMENT_DETAIL_BODIES.get(document_id)
    if meta is None or body is None:
        return None

    updated_at = datetime.fromisoformat(meta["updated_at"])
    return DocumentDetailResponse(
        document=DocumentDetailHeader(
            id=document.id,
            title=document.title,
            owner_team=document.team,
            visibility=document.visibility,
            status=cast(DocumentStatus, meta["status"]),
            updated_at=updated_at,
            updated_relative=document.updatedRelative,
            summary=document.summary,
        ),
        overview=str(body["overview"]),
        highlights=[
            DocumentHighlightItem(id=str(item["id"]), text=str(item["text"]))
            for item in cast(list[dict[str, Any]], body["highlights"])
        ],
        recommended_questions=[
            DocumentRecommendedQuestionItem(id=str(item["id"]), text=str(item["text"]))
            for item in cast(list[dict[str, Any]], body["recommended_questions"])
        ],
        related_links=[
            DocumentRelatedLinkItem(
                id=str(item["id"]),
                target_type=cast(DocumentRelatedTargetType, item["target_type"]),
                target_id=str(item["target_id"]),
                label=str(item["label"]),
                hint=str(item["hint"]),
            )
            for item in cast(list[dict[str, Any]], body["related_links"])
        ],
    )

def _map_document_status(document_status: str, version_status: str) -> DocumentStatus:
    if document_status == "draft":
        return "draft"
    if document_status == "archived":
        return "archived"
    if version_status == "failed":
        return "error"
    if version_status in {"pending", "processing"}:
        return "indexing"
    return "approved"



def _document_status_hint(status: DocumentStatus) -> str:
    if status == "draft":
        return "초안 상태라 변경 가능성이 남아 있습니다."
    if status == "indexing":
        return "최신 버전을 색인 중이라 일부 검색 결과가 바뀔 수 있습니다."
    if status == "error":
        return "최신 버전 처리 중 오류가 있어 운영 확인이 필요합니다."
    if status == "archived":
        return "보관된 문서라 현재 운영 기준과 차이가 있을 수 있습니다."
    return "승인된 최신 기준 문서입니다."



def _parse_metadata(raw_value: Any) -> dict[str, Any]:
    if raw_value is None:
        return {}
    try:
        parsed = json.loads(str(raw_value))
    except (TypeError, json.JSONDecodeError):
        return {}
    return cast(dict[str, Any], parsed) if isinstance(parsed, dict) else {}



def _parse_text_items(raw_value: Any, *, prefix: str) -> list[dict[str, str]]:
    if not isinstance(raw_value, list):
        return []

    items: list[dict[str, str]] = []
    for index, item in enumerate(raw_value, start=1):
        if isinstance(item, dict):
            text_value = item.get("text")
            item_id = item.get("id")
        else:
            text_value = item
            item_id = None

        if not isinstance(text_value, str) or not text_value.strip():
            continue

        items.append(
            {
                "id": str(item_id) if item_id else f"{prefix}-{index}",
                "text": _truncate_text(text_value, 140),
            }
        )
    return items



def _parse_related_links(raw_value: Any) -> list[DocumentRelatedLinkItem]:
    if not isinstance(raw_value, list):
        return []

    links: list[DocumentRelatedLinkItem] = []
    for index, item in enumerate(raw_value, start=1):
        if not isinstance(item, dict):
            continue

        target_type = item.get("target_type")
        target_id = item.get("target_id")
        label = item.get("label")
        hint = item.get("hint")
        if target_type not in {"knowledge_space", "chat", "document"}:
            continue
        if not all(isinstance(value, str) and value.strip() for value in (target_id, label, hint)):
            continue

        links.append(
            DocumentRelatedLinkItem(
                id=str(item.get("id") or f"related-{index}"),
                target_type=cast(DocumentRelatedTargetType, target_type),
                target_id=target_id,
                label=_truncate_text(label, 80),
                hint=_truncate_text(hint, 120),
            )
        )
    return links



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