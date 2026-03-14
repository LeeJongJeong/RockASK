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
    KnowledgeSpaceListItem,
    KnowledgeSpaceListQueryParams,
    KnowledgeSpaceListResponse,
    KnowledgeSpaceStatus,
)
from app.services.dashboard import _format_relative_datetime, _format_visibility
from app.services.dashboard_mock import build_mock_dashboard_payload

logger = logging.getLogger(__name__)

MOCK_LAST_UPDATED_BY_ID: dict[str, str] = {
    "ks-strategy": "2026-03-14T13:05:00+09:00",
    "ks-engineering": "2026-03-14T14:55:00+09:00",
}

VISIBILITY_FILTER_MAP = {
    "private": "private",
    "team": "team",
    "organization": "organization",
    "restricted": "restricted",
    "?? ??": "private",
    "? ??": "team",
    "?? ??": "organization",
    "?? ??": "restricted",
}

KNOWLEDGE_SPACE_LIST_BASE_SQL = """
WITH space_rows AS (
    SELECT
        COALESCE(NULLIF(ks.code, ''), ks.id::text) AS knowledge_space_id,
        ks.name AS knowledge_space_name,
        COALESCE(t.name, '??? ?') AS owner_team,
        COALESCE(u.name, '???') AS contact_name,
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


def list_knowledge_spaces_response(
    params: KnowledgeSpaceListQueryParams, *, session: Session | None = None
) -> KnowledgeSpaceListResponse:
    if session is None:
        return _build_mock_response(params)

    try:
        if not _has_knowledge_space_data(session):
            return _build_mock_response(params)

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
        return _build_mock_response(params)


def _has_knowledge_space_data(session: Session) -> bool:
    return bool(
        session.execute(text("SELECT EXISTS (SELECT 1 FROM rockask.knowledge_spaces)"))
        .scalar_one_or_none()
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


def _build_mock_response(params: KnowledgeSpaceListQueryParams) -> KnowledgeSpaceListResponse:
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
