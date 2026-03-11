from __future__ import annotations

import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_mock import build_mock_dashboard_payload

logger = logging.getLogger(__name__)
SEOUL_TZ = ZoneInfo("Asia/Seoul")
VISIBILITY_LABELS = {
    "private": "개인 문서",
    "team": "팀 공개",
    "organization": "전사 공개",
    "restricted": "제한 공개",
}


def build_dashboard_payload(*, session: Session | None = None) -> DashboardResponse:
    if session is None:
        return build_mock_dashboard_payload()

    try:
        if not _has_dashboard_data(session):
            return build_mock_dashboard_payload()

        return DashboardResponse.model_validate(
            {
                "profile": _build_profile(session),
                "health": _build_health(session),
                "summary": _build_summary(session),
                "scopes": _build_scopes(session),
                "knowledgeSpaces": _build_knowledge_spaces(session),
                "recentUpdates": _build_recent_updates(session),
                "recommendedPrompts": _build_recommended_prompts(session),
                "recentChats": _build_recent_chats(session),
                "alerts": _build_alerts(session),
                "meta": {"source": "api"},
            }
        )
    except SQLAlchemyError:
        logger.exception("Falling back to mock dashboard payload because database aggregation failed.")
        return build_mock_dashboard_payload()


def _has_dashboard_data(session: Session) -> bool:
    row = session.execute(
        text(
            """
            SELECT
                EXISTS (SELECT 1 FROM rockask.users) AS has_users,
                EXISTS (SELECT 1 FROM rockask.documents) AS has_documents,
                EXISTS (SELECT 1 FROM rockask.search_scopes) AS has_scopes
            """
        )
    ).mappings().one()
    return bool(row["has_users"] or row["has_documents"] or row["has_scopes"])


def _build_profile(session: Session) -> dict[str, str]:
    row = session.execute(
        text(
            """
            SELECT
                u.name AS user_name,
                COALESCE(t.name, '미지정 팀') AS team_name
            FROM rockask.users AS u
            LEFT JOIN rockask.teams AS t ON t.id = u.team_id
            WHERE u.status = 'active'
            ORDER BY u.last_login_at DESC NULLS LAST, u.created_at ASC
            LIMIT 1
            """
        )
    ).mappings().first()

    if row is None:
        return {"name": "미확인 사용자", "team": "미지정 팀", "initials": "?"}

    name = str(row["user_name"])
    return {
        "name": name,
        "team": str(row["team_name"]),
        "initials": name.strip()[0] if name.strip() else "?",
    }


def _build_health(session: Session) -> dict[str, str | int]:
    now = datetime.now(SEOUL_TZ)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    day_ago = now - timedelta(days=1)

    last_sync_at = session.execute(
        text(
            """
            SELECT MAX(sync_at) AS last_sync_at
            FROM (
                SELECT last_synced_at AS sync_at
                FROM rockask.content_sources
                WHERE last_synced_at IS NOT NULL
                UNION ALL
                SELECT finished_at AS sync_at
                FROM rockask.sync_runs
                WHERE finished_at IS NOT NULL
                UNION ALL
                SELECT started_at AS sync_at
                FROM rockask.sync_runs
                WHERE started_at IS NOT NULL
            ) AS sync_points
            """
        )
    ).scalar_one_or_none()

    indexed_today = _scalar_int(
        session,
        """
        SELECT COUNT(*)
        FROM rockask.ingestion_jobs
        WHERE job_type = 'index'
          AND job_status = 'succeeded'
          AND COALESCE(finished_at, updated_at, created_at) >= :today_start
        """,
        {"today_start": today_start},
    )
    pending_index_jobs = _scalar_int(
        session,
        """
        SELECT COUNT(*)
        FROM rockask.ingestion_jobs
        WHERE job_type = 'index'
          AND job_status IN ('queued', 'running', 'retrying')
        """,
    )
    failed_ingestion_jobs = _scalar_int(
        session,
        """
        SELECT COUNT(*)
        FROM rockask.ingestion_jobs
        WHERE job_status = 'failed'
          AND COALESCE(finished_at, updated_at, created_at) >= :day_ago
        """,
        {"day_ago": day_ago},
    )
    open_error_alerts = _scalar_int(
        session,
        """
        SELECT COUNT(*)
        FROM rockask.system_alerts
        WHERE status = 'open'
          AND severity IN ('error', 'critical')
        """,
    )

    if open_error_alerts > 0:
        status = "error"
    elif failed_ingestion_jobs > 0 or pending_index_jobs > 25:
        status = "warning"
    else:
        status = "healthy"

    return {
        "status": status,
        "lastSyncAt": last_sync_at.isoformat() if last_sync_at else "",
        "lastSyncRelative": _format_relative_datetime(last_sync_at),
        "indexedToday": indexed_today,
        "pendingIndexJobs": pending_index_jobs,
        "failedIngestionJobs": failed_ingestion_jobs,
        "citationPolicy": "always_on",
    }


def _build_summary(session: Session) -> dict[str, int | float]:
    now = datetime.now(SEOUL_TZ)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    searchable_documents = _scalar_int(
        session,
        """
        SELECT COUNT(*)
        FROM rockask.documents
        WHERE status = 'active'
        """,
    )
    queries_today = _scalar_int(
        session,
        """
        SELECT COUNT(*)
        FROM rockask.query_runs
        WHERE created_at >= :today_start
        """,
        {"today_start": today_start},
    )
    avg_response_time_ms = _scalar_int(
        session,
        """
        SELECT COALESCE(ROUND(AVG(latency_ms)), 0)
        FROM rockask.query_runs
        WHERE query_status = 'completed'
          AND latency_ms IS NOT NULL
          AND created_at >= :week_ago
        """,
        {"week_ago": week_ago},
    )
    total_feedback = _scalar_int(
        session,
        """
        SELECT COUNT(*)
        FROM rockask.feedback_items
        WHERE created_at >= :week_ago
        """,
        {"week_ago": week_ago},
    )
    resolved_feedback = _scalar_int(
        session,
        """
        SELECT COUNT(*)
        FROM rockask.feedback_items
        WHERE created_at >= :week_ago
          AND status = 'resolved'
        """,
        {"week_ago": week_ago},
    )

    return {
        "searchableDocuments": searchable_documents,
        "queriesToday": queries_today,
        "avgResponseTimeMs": avg_response_time_ms,
        "feedbackResolutionRate7d": (resolved_feedback / total_feedback) if total_feedback else 0.0,
    }


def _build_scopes(session: Session) -> list[dict[str, str | bool]]:
    rows = session.execute(
        text(
            """
            SELECT
                code AS scope_id,
                name AS scope_name,
                is_active,
                is_default
            FROM rockask.search_scopes
            WHERE is_active = TRUE
            ORDER BY is_default DESC, sort_order ASC, created_at ASC
            LIMIT 6
            """
        )
    ).mappings()

    scopes = [
        {
            "id": str(row["scope_id"]),
            "label": str(row["scope_name"]),
            "enabled": bool(row["is_active"]),
            "isDefault": bool(row["is_default"]),
        }
        for row in rows
    ]
    return scopes or list(build_mock_dashboard_payload().scopes)


def _build_knowledge_spaces(session: Session) -> list[dict[str, str | int]]:
    rows = session.execute(
        text(
            """
            SELECT
                ks.code AS knowledge_space_id,
                ks.name AS knowledge_space_name,
                COALESCE(t.name, '미지정 팀') AS owner_team,
                COALESCE(u.name, '미지정') AS contact_name,
                ks.status::text AS knowledge_space_status,
                ks.visibility::text AS visibility_level,
                COUNT(d.id) FILTER (WHERE d.status = 'active') AS document_count,
                COALESCE(MAX(d.updated_at), ks.updated_at, ks.created_at) AS last_updated_at
            FROM rockask.knowledge_spaces AS ks
            LEFT JOIN rockask.teams AS t ON t.id = ks.owner_team_id
            LEFT JOIN rockask.users AS u ON u.id = ks.contact_user_id
            LEFT JOIN rockask.documents AS d ON d.knowledge_space_id = ks.id
            GROUP BY ks.code, ks.name, t.name, u.name, ks.status, ks.visibility, ks.updated_at, ks.created_at
            ORDER BY
                CASE ks.status
                    WHEN 'active' THEN 0
                    WHEN 'indexing' THEN 1
                    WHEN 'error' THEN 2
                    ELSE 3
                END,
                COALESCE(MAX(d.updated_at), ks.updated_at, ks.created_at) DESC
            LIMIT 4
            """
        )
    ).mappings()

    knowledge_spaces = [
        {
            "id": str(row["knowledge_space_id"]),
            "name": str(row["knowledge_space_name"]),
            "ownerTeam": str(row["owner_team"]),
            "contactName": str(row["contact_name"]),
            "status": str(row["knowledge_space_status"]),
            "visibility": str(row["visibility_level"]),
            "docCount": int(row["document_count"] or 0),
            "lastUpdatedRelative": _format_relative_datetime(row["last_updated_at"]),
        }
        for row in rows
    ]
    return knowledge_spaces or list(build_mock_dashboard_payload().knowledgeSpaces)


def _build_recent_updates(session: Session) -> list[dict[str, str]]:
    rows = session.execute(
        text(
            """
            SELECT
                d.id::text AS document_id,
                d.title AS document_title,
                COALESCE(t.name, '미지정 팀') AS owner_team,
                d.visibility::text AS visibility_level,
                COALESCE(
                    NULLIF(d.metadata ->> 'summary', ''),
                    d.title || ' 문서가 갱신되었습니다.'
                ) AS summary_text,
                COALESCE(dv.updated_at, d.updated_at, d.created_at) AS updated_at
            FROM rockask.documents AS d
            LEFT JOIN rockask.teams AS t ON t.id = d.owner_team_id
            LEFT JOIN rockask.document_versions AS dv ON dv.id = d.current_version_id
            WHERE d.status = 'active'
            ORDER BY COALESCE(dv.updated_at, d.updated_at, d.created_at) DESC
            LIMIT 3
            """
        )
    ).mappings()

    recent_updates = [
        {
            "id": str(row["document_id"]),
            "title": str(row["document_title"]),
            "team": str(row["owner_team"]),
            "updatedRelative": _format_relative_datetime(row["updated_at"]),
            "visibility": _format_visibility(str(row["visibility_level"])),
            "summary": str(row["summary_text"]),
        }
        for row in rows
    ]
    return recent_updates or list(build_mock_dashboard_payload().recentUpdates)


def _build_recommended_prompts(session: Session) -> list[dict[str, str]]:
    rows = session.execute(
        text(
            """
            SELECT
                code AS prompt_id,
                title,
                prompt_text
            FROM rockask.prompt_templates
            WHERE is_active = TRUE
            ORDER BY sort_order ASC, created_at DESC
            LIMIT 3
            """
        )
    ).mappings()

    prompts = [
        {
            "id": str(row["prompt_id"]),
            "title": str(row["title"]),
            "prompt": str(row["prompt_text"]),
        }
        for row in rows
    ]
    return prompts or list(build_mock_dashboard_payload().recommendedPrompts)


def _build_recent_chats(session: Session) -> list[dict[str, str]]:
    rows = session.execute(
        text(
            """
            SELECT
                c.id::text AS chat_id,
                COALESCE(NULLIF(c.title, ''), '새 대화') AS chat_title,
                COALESCE(a.name, '기본 어시스턴트') AS assistant_name,
                COALESCE(c.last_message_at, c.updated_at, c.created_at) AS last_message_at
            FROM rockask.chats AS c
            LEFT JOIN rockask.assistants AS a ON a.id = c.assistant_id
            WHERE c.status = 'active'
            ORDER BY COALESCE(c.last_message_at, c.updated_at, c.created_at) DESC
            LIMIT 3
            """
        )
    ).mappings()

    chats = [
        {
            "id": str(row["chat_id"]),
            "title": str(row["chat_title"]),
            "assistantName": str(row["assistant_name"]),
            "lastMessageRelative": _format_relative_datetime(row["last_message_at"]),
        }
        for row in rows
    ]
    return chats or list(build_mock_dashboard_payload().recentChats)


def _build_alerts(session: Session) -> list[dict[str, str]]:
    rows = session.execute(
        text(
            """
            SELECT
                id::text AS alert_id,
                severity::text AS severity,
                title,
                COALESCE(body, '') AS body
            FROM rockask.system_alerts
            WHERE status = 'open'
            ORDER BY created_at DESC
            LIMIT 3
            """
        )
    ).mappings()

    alerts = [
        {
            "id": str(row["alert_id"]),
            "severity": str(row["severity"]),
            "title": str(row["title"]),
            "body": str(row["body"]),
        }
        for row in rows
    ]
    return alerts or list(build_mock_dashboard_payload().alerts)


def _scalar_int(session: Session, sql: str, params: dict[str, object] | None = None) -> int:
    value = session.execute(text(sql), params or {}).scalar_one_or_none()
    return int(value or 0)


def _format_visibility(value: str) -> str:
    return VISIBILITY_LABELS.get(value, value)


def _format_relative_datetime(value: datetime | None) -> str:
    if value is None:
        return "이력 없음"

    if value.tzinfo is None:
        value = value.replace(tzinfo=SEOUL_TZ)
    else:
        value = value.astimezone(SEOUL_TZ)

    now = datetime.now(SEOUL_TZ)
    delta = now - value

    if delta < timedelta(minutes=1):
        return "방금 전"
    if delta < timedelta(hours=1):
        return f"{max(int(delta.total_seconds() // 60), 1)}분 전"
    if delta < timedelta(days=1):
        return f"{max(int(delta.total_seconds() // 3600), 1)}시간 전"
    if delta < timedelta(days=2):
        return "어제"
    if delta < timedelta(days=7):
        return f"{delta.days}일 전"
    return value.strftime("%Y-%m-%d")
