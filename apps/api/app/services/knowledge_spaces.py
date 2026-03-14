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

from app.schemas.knowledge_spaces import (
    KnowledgeSpaceDetailHeader,
    KnowledgeSpaceDetailResponse,
    KnowledgeSpaceLinkedDocumentItem,
    KnowledgeSpaceListItem,
    KnowledgeSpaceListQueryParams,
    KnowledgeSpaceListResponse,
    KnowledgeSpaceRuleItem,
    KnowledgeSpaceStatus,
    KnowledgeSpaceTopicItem,
)
from app.services.dashboard import _format_relative_datetime, _format_visibility
from app.services.dashboard_mock import build_mock_dashboard_payload

logger = logging.getLogger(__name__)

MOCK_LAST_UPDATED_BY_ID: dict[str, str] = {
    "ks-strategy": "2026-03-14T13:05:00+09:00",
    "ks-engineering": "2026-03-14T14:55:00+09:00",
}

MOCK_KNOWLEDGE_SPACE_DETAIL_BODIES: dict[str, dict[str, Any]] = {
    "ks-strategy": {
        "overview": "\uc804\uc0ac \uacc4\ud68d, \uc608\uc0b0, \uc6b0\uc120\uc21c\uc704 \ubb38\uc11c\ub97c \ubaa8\uc544 \ub454 \uacf5\uac04\uc785\ub2c8\ub2e4.",
        "stewardship": "\uc804\ub7b5\uae30\ud68d\uc2e4\uc5d0\uc11c \uad6c\uc870\uc640 \uacf5\uac1c \ubc94\uc704\ub97c \uad00\ub9ac\ud558\uace0 \ucd5c\uc2e0\uc131\uc744 \uc810\uac80\ud569\ub2c8\ub2e4.",
        "coverage_topics": [
            {"id": "topic-1", "text": "\uc0ac\uc5c5 \ubaa9\ud45c\uc640 \ubd84\uae30 \uc6b0\uc120\uc21c\uc704"},
            {"id": "topic-2", "text": "\uc608\uc0b0 \ud655\uc778\uacfc \uacb0\uc7ac \ud750\ub984"},
            {"id": "topic-3", "text": "\uacbd\uc601 \ud68c\uc758\uc6a9 \ube0c\ub9ac\ud551 \uc790\ub8cc"},
        ],
        "operating_rules": [
            {"id": "rule-1", "text": "\ub9ac\ub354 \ub9ac\ubdf0\uac00 \ub05d\ub09c \ubb38\uc11c\ub9cc \uc804\uc0ac \uacf5\uc720 \ubc94\uc704\ub85c \uacf5\uac1c\ud569\ub2c8\ub2e4."},
            {"id": "rule-2", "text": "\uc608\uc0b0 \uc218\uce58\uac00 \ubc14\ub00c\uba74 24\uc2dc\uac04 \uc548\uc5d0 \ubcc0\uacbd \uc774\ub825\uc744 \ubc18\uc601\ud569\ub2c8\ub2e4."},
            {"id": "rule-3", "text": "\ud68c\uc758 \uc694\uc57d\uacfc \uc6d0\ubb38 \ub9c1\ud06c\ub97c \ud568\uaed8 \uc81c\uacf5\ud569\ub2c8\ub2e4."},
        ],
        "linked_documents": [
            {
                "id": "link-1",
                "target_type": "document",
                "target_id": "update-security",
                "label": "\ubcf4\uc548 \uc810\uac80 \uccb4\ud06c\ub9ac\uc2a4\ud2b8 v3",
                "hint": "\uc804\uc0ac \uacf5\ud1b5 \uae30\uc900\uc744 \uc815\ub9ac\ud55c \uc6b4\uc601 \ubb38\uc11c",
            },
            {
                "id": "link-2",
                "target_type": "document",
                "target_id": "update-onboarding",
                "label": "\uc2e0\uaddc \uc785\uc0ac\uc790 \uc628\ubcf4\ub529 \uc548\ub0b4",
                "hint": "\uacf5\ud1b5 \uc6b4\uc601 \ubb38\uc11c \uc608\uc2dc",
            },
        ],
    },
    "ks-engineering": {
        "overview": "\uae30\uc220 \uac1c\ubc1c\uacfc \uc6b4\uc601 \uac00\uc774\ub4dc\ub97c \ud568\uaed8 \ubcf4\ub294 \uacf5\uac04\uc785\ub2c8\ub2e4.",
        "stewardship": "\ud50c\ub7ab\ud3fc\uac1c\ubc1c\ud300\uacfc SRE\uac00 \ud568\uaed8 \uc720\uc9c0\ud558\uba70 \ubc30\ud3ec \uc9c1\ud6c4 \ubb38\uc11c\ub97c \uac31\uc2e0\ud569\ub2c8\ub2e4.",
        "coverage_topics": [
            {"id": "topic-4", "text": "\uc6b4\uc601 \uc7a5\uc560 \ub300\uc751 \uc808\ucc28"},
            {"id": "topic-5", "text": "\ubc30\ud3ec\uc640 \ubc31\uc5c5 \uccb4\ud06c\ub9ac\uc2a4\ud2b8"},
            {"id": "topic-6", "text": "\ucd5c\uadfc \ubcc0\uacbd\ub41c \uae30\uc220 \uac00\uc774\ub4dc"},
        ],
        "operating_rules": [
            {"id": "rule-4", "text": "\uc6b4\uc601 \uac00\uc774\ub4dc\uac00 \ubc14\ub00c\uba74 \ubcf4\uace0 \ud15c\ud50c\ub9bf\uae4c\uc9c0 \ud568\uaed8 \uc218\uc815\ud569\ub2c8\ub2e4."},
            {"id": "rule-5", "text": "\ubc30\ud3ec \ub2e4\uc74c \uc601\uc5c5\uc77c \uc548\uc5d0 \uc778\ub371\uc2f1 \uc0c1\ud0dc\ub97c \ub2e4\uc2dc \ud655\uc778\ud569\ub2c8\ub2e4."},
            {"id": "rule-6", "text": "\uad8c\ud55c \ubc94\uc704\ub294 \uae30\uc220 \ubcf8\ubd80 \uacf5\uac1c \uae30\uc900\uc744 \ub530\ub985\ub2c8\ub2e4."},
        ],
        "linked_documents": [
            {
                "id": "link-3",
                "target_type": "document",
                "target_id": "update-sre",
                "label": "\uc6b4\uc601 \ubcf4\uace0\uc11c \uc791\uc131 \uac00\uc774\ub4dc",
                "hint": "\uc0ac\ud6c4 \ubd84\uc11d\uacfc \uc601\ud5a5 \ubc94\uc704 \uae30\ub85d \ud15c\ud50c\ub9bf",
            },
            {
                "id": "link-4",
                "target_type": "document",
                "target_id": "update-security",
                "label": "\ubcf4\uc548 \uc810\uac80 \uccb4\ud06c\ub9ac\uc2a4\ud2b8 v3",
                "hint": "\ubc30\ud3ec \uc804\ud6c4 \uacf5\ud1b5 \uc810\uac80 \ud56d\ubaa9",
            },
        ],
    },
}

VISIBILITY_FILTER_MAP = {
    "private": "private",
    "team": "team",
    "organization": "organization",
    "restricted": "restricted",
    "\uac1c\uc778 \ubb38\uc11c": "private",
    "\ud300 \uacf5\uac1c": "team",
    "\uc804\uc0ac \uacf5\uac1c": "organization",
    "\uc81c\ud55c \uacf5\uac1c": "restricted",
}

KNOWLEDGE_SPACE_LIST_BASE_SQL = """
WITH space_rows AS (
    SELECT
        COALESCE(NULLIF(ks.code, ''), ks.id::text) AS knowledge_space_id,
        ks.name AS knowledge_space_name,
        COALESCE(t.name, '\ubbf8\uc9c0\uc815 \ud300') AS owner_team,
        COALESCE(u.name, '\ubbf8\uc9c0\uc815') AS contact_name,
        ks.status::text AS knowledge_space_status,
        ks.visibility::text AS visibility_level,
        COUNT(d.id) FILTER (WHERE d.status = 'active') AS document_count,
        COALESCE(MAX(COALESCE(dv.updated_at, d.updated_at, d.created_at)), ks.updated_at, ks.created_at) AS last_updated_at
    FROM rockask.knowledge_spaces AS ks
    LEFT JOIN rockask.teams AS t ON t.id = ks.owner_team_id
    LEFT JOIN rockask.users AS u ON u.id = ks.contact_user_id
    LEFT JOIN rockask.documents AS d ON d.knowledge_space_id = ks.id AND d.status <> 'deleted'
    LEFT JOIN rockask.document_versions AS dv ON dv.id = d.current_version_id
    GROUP BY ks.code, ks.id, ks.name, t.name, u.name, ks.status, ks.visibility, ks.updated_at, ks.created_at
)
SELECT
    knowledge_space_id,
    knowledge_space_name,
    owner_team,
    contact_name,
    knowledge_space_status,
    visibility_level,
    document_count,
    last_updated_at
FROM space_rows
"""

KNOWLEDGE_SPACE_DETAIL_SQL = text(
    """
    SELECT
        ks.id AS knowledge_space_uuid,
        COALESCE(NULLIF(ks.code, ''), ks.id::text) AS knowledge_space_id,
        ks.name AS knowledge_space_name,
        COALESCE(t.name, '\ubbf8\uc9c0\uc815 \ud300') AS owner_team,
        COALESCE(u.name, '\ubbf8\uc9c0\uc815') AS contact_name,
        ks.status::text AS knowledge_space_status,
        ks.visibility::text AS visibility_level,
        COUNT(d.id) FILTER (WHERE d.status = 'active') AS document_count,
        COALESCE(MAX(COALESCE(dv.updated_at, d.updated_at, d.created_at)), ks.updated_at, ks.created_at) AS last_updated_at,
        COALESCE(NULLIF(BTRIM(ks.description), ''), NULLIF(ks.metadata ->> 'overview', ''), ks.name || ' \uad00\ub828 \ubb38\uc11c\ub97c \ubaa8\uc544 \ub454 \uacf5\uac04\uc785\ub2c8\ub2e4.') AS overview_text,
        COALESCE(
            NULLIF(ks.metadata ->> 'stewardship', ''),
            CASE
                WHEN t.name IS NOT NULL AND u.name IS NOT NULL THEN t.name || '\uc5d0\uc11c \uc6b4\uc601\ud558\uba70 \ubb38\uc758\ub294 ' || u.name || '\uc5d0\uac8c \uc804\ub2ec\ub429\ub2c8\ub2e4.'
                WHEN t.name IS NOT NULL THEN t.name || '\uc5d0\uc11c \uc6b4\uc601\ud558\ub294 \uc9c0\uc2dd \uacf5\uac04\uc785\ub2c8\ub2e4.'
                ELSE '\uc6b4\uc601 \ub2f4\ub2f9 \uc815\ubcf4\ub97c \ud655\uc778 \uc911\uc785\ub2c8\ub2e4.'
            END
        ) AS stewardship_text,
        COALESCE(ks.metadata, '{}'::jsonb)::text AS metadata_json
    FROM rockask.knowledge_spaces AS ks
    LEFT JOIN rockask.teams AS t ON t.id = ks.owner_team_id
    LEFT JOIN rockask.users AS u ON u.id = ks.contact_user_id
    LEFT JOIN rockask.documents AS d ON d.knowledge_space_id = ks.id AND d.status <> 'deleted'
    LEFT JOIN rockask.document_versions AS dv ON dv.id = d.current_version_id
    WHERE COALESCE(NULLIF(ks.code, ''), ks.id::text) = :knowledge_space_lookup
       OR ks.id::text = :knowledge_space_lookup
    GROUP BY ks.id, ks.code, ks.name, t.name, u.name, ks.status, ks.visibility, ks.description, ks.metadata, ks.updated_at, ks.created_at
    LIMIT 1
    """
)

KNOWLEDGE_SPACE_LINKED_DOCUMENTS_SQL = text(
    """
    SELECT
        d.id::text AS target_id,
        d.title AS label,
        COALESCE(NULLIF(d.metadata ->> 'summary', ''), d.title || ' \ubb38\uc11c') AS hint,
        COALESCE(dv.updated_at, d.updated_at, d.created_at) AS updated_at
    FROM rockask.documents AS d
    LEFT JOIN rockask.document_versions AS dv ON dv.id = d.current_version_id
    WHERE d.knowledge_space_id = CAST(:knowledge_space_uuid AS uuid)
      AND d.status = 'active'
    ORDER BY COALESCE(dv.updated_at, d.updated_at, d.created_at) DESC, d.id DESC
    LIMIT 3
    """
)


def list_knowledge_spaces_response(
    params: KnowledgeSpaceListQueryParams, *, session: Session | None = None
) -> KnowledgeSpaceListResponse:
    if session is None:
        return _build_mock_list_response(params)

    try:
        if not _has_knowledge_space_data(session):
            return _build_mock_list_response(params)

        cursor_last_updated_at, cursor_id = _decode_cursor(params.cursor)
        query, query_params = _build_list_query(
            params,
            cursor_last_updated_at=cursor_last_updated_at,
            cursor_id=cursor_id,
        )
        rows = session.execute(query, query_params).mappings().all()

        items = [_map_space_row(row) for row in rows[: params.limit]]
        next_cursor = _build_next_cursor(items[-1]) if len(rows) > params.limit and items else None
        return KnowledgeSpaceListResponse(items=items, next_cursor=next_cursor)
    except HTTPException:
        raise
    except SQLAlchemyError:
        logger.exception("Falling back to mock knowledge space list because database read failed.")
        session.rollback()
        return _build_mock_list_response(params)


def get_knowledge_space_detail_response(
    knowledge_space_id: str, *, session: Session | None = None
) -> KnowledgeSpaceDetailResponse:
    mock_response = _build_mock_detail_response(knowledge_space_id)
    if session is None:
        if mock_response is not None:
            return mock_response
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge space not found.")

    try:
        row = session.execute(
            KNOWLEDGE_SPACE_DETAIL_SQL,
            {"knowledge_space_lookup": knowledge_space_id},
        ).mappings().one_or_none()

        if row is None:
            if mock_response is not None:
                return mock_response
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Knowledge space not found.",
            )

        metadata = _parse_metadata(row["metadata_json"])
        linked_document_rows = session.execute(
            KNOWLEDGE_SPACE_LINKED_DOCUMENTS_SQL,
            {"knowledge_space_uuid": str(row["knowledge_space_uuid"])},
        ).mappings().all()
        linked_documents = _build_linked_documents(row, metadata, linked_document_rows)

        return KnowledgeSpaceDetailResponse(
            space=_map_space_detail_header(row),
            overview=_build_overview(row, metadata),
            stewardship=_build_stewardship(row, metadata),
            coverage_topics=_build_coverage_topics(row, metadata, linked_documents),
            operating_rules=_build_operating_rules(row, metadata),
            linked_documents=linked_documents,
        )
    except HTTPException:
        raise
    except SQLAlchemyError:
        logger.exception("Failed to load knowledge space detail from database.")
        session.rollback()
        if mock_response is not None:
            return mock_response
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load knowledge space detail.",
        )


def _has_knowledge_space_data(session: Session) -> bool:
    return bool(
        session.execute(text("SELECT EXISTS (SELECT 1 FROM rockask.knowledge_spaces)")).scalar_one_or_none()
    )


def _build_list_query(
    params: KnowledgeSpaceListQueryParams,
    *,
    cursor_last_updated_at: datetime | None,
    cursor_id: str | None,
) -> tuple[Any, dict[str, object]]:
    filters: list[str] = []
    query_params: dict[str, object] = {"limit_plus_one": params.limit + 1}

    if params.status is None:
        filters.append("knowledge_space_status <> 'archived'")
    else:
        filters.append("knowledge_space_status = :status_filter")
        query_params["status_filter"] = params.status

    visibility_filter = _normalize_visibility_filter(params.visibility)
    if visibility_filter is not None:
        filters.append("visibility_level = :visibility_filter")
        query_params["visibility_filter"] = visibility_filter

    if cursor_last_updated_at is not None and cursor_id is not None:
        filters.append(
            "(last_updated_at < :cursor_last_updated_at OR "
            "(last_updated_at = :cursor_last_updated_at AND knowledge_space_id < :cursor_id))"
        )
        query_params["cursor_last_updated_at"] = cursor_last_updated_at
        query_params["cursor_id"] = cursor_id

    where_clause = " AND\n    ".join(filters) if filters else "1 = 1"
    query = text(
        f"""
        {KNOWLEDGE_SPACE_LIST_BASE_SQL}
        WHERE {where_clause}
        ORDER BY last_updated_at DESC, knowledge_space_id DESC
        LIMIT :limit_plus_one
        """
    )
    return query, query_params


def _map_space_row(row: Any) -> KnowledgeSpaceListItem:
    last_updated_at = cast(datetime, row["last_updated_at"])
    return KnowledgeSpaceListItem(
        id=str(row["knowledge_space_id"]),
        name=str(row["knowledge_space_name"]),
        owner_team=str(row["owner_team"]),
        contact_name=str(row["contact_name"]),
        status=cast(KnowledgeSpaceStatus, str(row["knowledge_space_status"])),
        visibility=_format_visibility(str(row["visibility_level"])),
        doc_count=int(row["document_count"] or 0),
        last_updated_at=last_updated_at.isoformat(),
        last_updated_relative=_format_relative_datetime(last_updated_at),
    )


def _map_space_detail_header(row: Any) -> KnowledgeSpaceDetailHeader:
    last_updated_at = cast(datetime, row["last_updated_at"])
    return KnowledgeSpaceDetailHeader(
        id=str(row["knowledge_space_id"]),
        name=str(row["knowledge_space_name"]),
        owner_team=str(row["owner_team"]),
        contact_name=str(row["contact_name"]),
        status=cast(KnowledgeSpaceStatus, str(row["knowledge_space_status"])),
        visibility=_format_visibility(str(row["visibility_level"])),
        doc_count=int(row["document_count"] or 0),
        last_updated_at=last_updated_at,
        last_updated_relative=_format_relative_datetime(last_updated_at),
    )


def _build_overview(row: Any, metadata: dict[str, Any]) -> str:
    overview = metadata.get("overview")
    if isinstance(overview, str) and overview.strip():
        return _truncate_text(overview, 420)
    return _truncate_text(str(row["overview_text"]), 420)


def _build_stewardship(row: Any, metadata: dict[str, Any]) -> str:
    stewardship = metadata.get("stewardship")
    if isinstance(stewardship, str) and stewardship.strip():
        return _truncate_text(stewardship, 240)
    return _truncate_text(str(row["stewardship_text"]), 240)


def _build_coverage_topics(
    row: Any,
    metadata: dict[str, Any],
    linked_documents: list[KnowledgeSpaceLinkedDocumentItem],
) -> list[KnowledgeSpaceTopicItem]:
    parsed_topics = _parse_text_items(metadata.get("coverage_topics"), prefix="topic")
    if parsed_topics:
        return [
            KnowledgeSpaceTopicItem(id=item["id"], text=item["text"])
            for item in parsed_topics[:3]
        ]

    knowledge_space_id = str(row["knowledge_space_id"])
    default_topics = [document.label for document in linked_documents[:3]]
    if len(default_topics) < 3:
        default_topics.append(f"{row['owner_team']} \uc6b4\uc601 \uae30\uc900\uacfc \uc790\uc8fc \ubb3b\ub294 \uc9c8\ubb38")
    if len(default_topics) < 3:
        default_topics.append("\ucd5c\uadfc \uc5c5\ub370\uc774\ud2b8\uc640 \uc5f0\uacb0 \ubb38\uc11c \uac80\ud1a0")
    if len(default_topics) < 3:
        default_topics.append(f"{row['knowledge_space_name']} \ud575\uc2ec \ubb38\uc11c")

    return [
        KnowledgeSpaceTopicItem(
            id=f"{knowledge_space_id}-topic-{index}",
            text=_truncate_text(text_value, 100),
        )
        for index, text_value in enumerate(default_topics[:3], start=1)
    ]


def _build_operating_rules(
    row: Any, metadata: dict[str, Any]
) -> list[KnowledgeSpaceRuleItem]:
    parsed_rules = _parse_text_items(metadata.get("operating_rules"), prefix="rule")
    if parsed_rules:
        return [
            KnowledgeSpaceRuleItem(id=item["id"], text=item["text"])
            for item in parsed_rules[:3]
        ]

    knowledge_space_id = str(row["knowledge_space_id"])
    owner_team = str(row["owner_team"])
    contact_name = str(row["contact_name"])
    visibility = _format_visibility(str(row["visibility_level"]))
    defaults = [
        "\ucd5c\uc2e0 \ud65c\uc131 \ubb38\uc11c\ub97c \uae30\uc900\uc73c\ub85c \uac80\uc0c9\uacfc \ub2f5\ubcc0 \ucd9c\ucc98\ub97c \uc81c\uacf5\ud569\ub2c8\ub2e4.",
        f"\uacf5\uac1c \ubc94\uc704\ub294 {visibility} \uae30\uc900\uc73c\ub85c \uad00\ub9ac\ud569\ub2c8\ub2e4.",
        f"\uc218\uc815 \uc694\uccad\uacfc \uc6b4\uc601 \ubb38\uc758\ub294 {contact_name} \ub610\ub294 {owner_team}\uc5d0\uc11c \ud655\uc778\ud569\ub2c8\ub2e4.",
    ]
    return [
        KnowledgeSpaceRuleItem(
            id=f"{knowledge_space_id}-rule-{index}",
            text=_truncate_text(text_value, 120),
        )
        for index, text_value in enumerate(defaults, start=1)
    ]


def _build_linked_documents(
    row: Any,
    metadata: dict[str, Any],
    linked_document_rows: list[Any],
) -> list[KnowledgeSpaceLinkedDocumentItem]:
    parsed_links = _parse_linked_documents(metadata.get("linked_documents"))
    if parsed_links:
        return parsed_links[:3]

    knowledge_space_id = str(row["knowledge_space_id"])
    return [
        KnowledgeSpaceLinkedDocumentItem(
            id=f"{knowledge_space_id}-document-{index}",
            target_type="document",
            target_id=str(document_row["target_id"]),
            label=str(document_row["label"]),
            hint=_truncate_text(str(document_row["hint"]), 120),
        )
        for index, document_row in enumerate(linked_document_rows[:3], start=1)
    ]


def _build_mock_list_response(params: KnowledgeSpaceListQueryParams) -> KnowledgeSpaceListResponse:
    items: list[KnowledgeSpaceListItem] = []
    dashboard = build_mock_dashboard_payload()
    for space in dashboard.knowledgeSpaces:
        items.append(
            KnowledgeSpaceListItem(
                id=space.id,
                name=space.name,
                owner_team=space.ownerTeam,
                contact_name=space.contactName,
                status=cast(KnowledgeSpaceStatus, space.status),
                visibility=_format_visibility(space.visibility),
                doc_count=space.docCount,
                last_updated_at=MOCK_LAST_UPDATED_BY_ID.get(space.id, "2026-03-14T09:00:00+09:00"),
                last_updated_relative=space.lastUpdatedRelative,
            )
        )

    if params.status is None:
        items = [item for item in items if item.status != "archived"]
    else:
        items = [item for item in items if item.status == params.status]

    if params.visibility is not None:
        normalized_filter = _normalize_visibility_filter(params.visibility)
        items = [
            item
            for item in items
            if VISIBILITY_FILTER_MAP.get(item.visibility, item.visibility) == normalized_filter
        ]

    cursor_last_updated_at, cursor_id = _decode_cursor(params.cursor)
    if cursor_last_updated_at is not None and cursor_id is not None:
        items = [
            item
            for item in items
            if datetime.fromisoformat(item.last_updated_at) < cursor_last_updated_at
            or (
                datetime.fromisoformat(item.last_updated_at) == cursor_last_updated_at
                and item.id < cursor_id
            )
        ]

    items.sort(
        key=lambda item: (datetime.fromisoformat(item.last_updated_at), item.id),
        reverse=True,
    )
    visible_items = items[: params.limit]
    next_cursor = _build_next_cursor(visible_items[-1]) if len(items) > params.limit and visible_items else None
    return KnowledgeSpaceListResponse(items=visible_items, next_cursor=next_cursor)


def _build_mock_detail_response(
    knowledge_space_id: str,
) -> KnowledgeSpaceDetailResponse | None:
    dashboard = build_mock_dashboard_payload()
    space = next((item for item in dashboard.knowledgeSpaces if item.id == knowledge_space_id), None)
    if space is None:
        return None

    body = MOCK_KNOWLEDGE_SPACE_DETAIL_BODIES.get(knowledge_space_id)
    if body is None:
        return None

    last_updated_at = datetime.fromisoformat(
        MOCK_LAST_UPDATED_BY_ID.get(knowledge_space_id, "2026-03-14T09:00:00+09:00")
    )
    return KnowledgeSpaceDetailResponse(
        space=KnowledgeSpaceDetailHeader(
            id=space.id,
            name=space.name,
            owner_team=space.ownerTeam,
            contact_name=space.contactName,
            status=cast(KnowledgeSpaceStatus, space.status),
            visibility=_format_visibility(space.visibility),
            doc_count=space.docCount,
            last_updated_at=last_updated_at,
            last_updated_relative=space.lastUpdatedRelative,
        ),
        overview=str(body["overview"]),
        stewardship=str(body["stewardship"]),
        coverage_topics=[
            KnowledgeSpaceTopicItem(id=str(item["id"]), text=str(item["text"]))
            for item in cast(list[dict[str, Any]], body["coverage_topics"])
        ],
        operating_rules=[
            KnowledgeSpaceRuleItem(id=str(item["id"]), text=str(item["text"]))
            for item in cast(list[dict[str, Any]], body["operating_rules"])
        ],
        linked_documents=[
            KnowledgeSpaceLinkedDocumentItem(
                id=str(item["id"]),
                target_type="document",
                target_id=str(item["target_id"]),
                label=str(item["label"]),
                hint=str(item["hint"]),
            )
            for item in cast(list[dict[str, Any]], body["linked_documents"])
        ],
    )


def _normalize_visibility_filter(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = VISIBILITY_FILTER_MAP.get(value)
    if normalized is not None:
        return normalized
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid visibility filter.")


def _decode_cursor(cursor: str | None) -> tuple[datetime | None, str | None]:
    if cursor is None:
        return None, None

    try:
        decoded = base64.b64decode(cursor.encode("ascii"), validate=True)
        payload = json.loads(decoded.decode("utf-8"))
        last_updated_at = datetime.fromisoformat(str(payload["last_updated_at"]))
        space_id = str(payload["id"])
        if not space_id:
            raise ValueError("Missing knowledge space id in cursor.")
        return last_updated_at, space_id
    except (binascii.Error, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid cursor.") from exc


def _build_next_cursor(item: KnowledgeSpaceListItem) -> str:
    payload = json.dumps(
        {"last_updated_at": item.last_updated_at, "id": item.id},
        separators=(",", ":"),
    ).encode("utf-8")
    return base64.b64encode(payload).decode("ascii")


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
                "text": _truncate_text(text_value, 120),
            }
        )
    return items


def _parse_linked_documents(raw_value: Any) -> list[KnowledgeSpaceLinkedDocumentItem]:
    if not isinstance(raw_value, list):
        return []

    linked_documents: list[KnowledgeSpaceLinkedDocumentItem] = []
    for index, item in enumerate(raw_value, start=1):
        if not isinstance(item, dict):
            continue

        target_type = item.get("target_type", "document")
        target_id = item.get("target_id")
        label = item.get("label")
        hint = item.get("hint")
        if target_type != "document":
            continue
        if not all(isinstance(value, str) and value.strip() for value in (target_id, label, hint)):
            continue

        linked_documents.append(
            KnowledgeSpaceLinkedDocumentItem(
                id=str(item.get("id") or f"linked-document-{index}"),
                target_type="document",
                target_id=target_id,
                label=_truncate_text(label, 80),
                hint=_truncate_text(hint, 120),
            )
        )
    return linked_documents


def _truncate_text(value: str, limit: int) -> str:
    normalized = " ".join(value.split()).strip()
    if len(normalized) <= limit:
        return normalized
    return f"{normalized[: limit - 3]}..."
