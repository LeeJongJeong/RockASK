# RockASK ADR Index

이 디렉터리는 RockASK 아키텍처 결정 기록(ADR, Architecture Decision Record)을 관리한다.

## ADR 목록

| ID | 상태 | 제목 | 파일 | 핵심 주제 |
|---|---|---|---|---|
| ADR-001 | Accepted | RockASK 기술 스택 확정 | [ADR-001-tech-stack.md](/D:/myhome/JJ-RAG-Platform/docs/adr/ADR-001-tech-stack.md) | 프론트엔드, 백엔드, DB, 비동기 처리, 관측성 기본 스택 |
| ADR-002 | Accepted | RockASK 검색 아키텍처 확정 | [ADR-002-search-architecture.md](/D:/myhome/JJ-RAG-Platform/docs/adr/ADR-002-search-architecture.md) | 하이브리드 검색, query-time ACL, citation 정책 |
| ADR-003 | Accepted | RockASK 인증 및 권한 모델 확정 | [ADR-003-authz-model.md](/D:/myhome/JJ-RAG-Platform/docs/adr/ADR-003-authz-model.md) | OIDC SSO, 서버 세션, RBAC + 팀 + ACL |
| ADR-004 | Accepted | RockASK 문서 수집 및 색인 파이프라인 확정 | [ADR-004-ingestion-pipeline.md](/D:/myhome/JJ-RAG-Platform/docs/adr/ADR-004-ingestion-pipeline.md) | 업로드, 동기화, 버전 관리, 비동기 색인 |

## 권장 읽기 순서

1. [ADR-001-tech-stack.md](/D:/myhome/JJ-RAG-Platform/docs/adr/ADR-001-tech-stack.md)
2. [ADR-002-search-architecture.md](/D:/myhome/JJ-RAG-Platform/docs/adr/ADR-002-search-architecture.md)
3. [ADR-003-authz-model.md](/D:/myhome/JJ-RAG-Platform/docs/adr/ADR-003-authz-model.md)
4. [ADR-004-ingestion-pipeline.md](/D:/myhome/JJ-RAG-Platform/docs/adr/ADR-004-ingestion-pipeline.md)

## ADR 간 관계

- `ADR-001`은 전체 기술 스택의 기준 문서다.
- `ADR-002`는 `ADR-001`의 데이터 저장소와 검색 스택 결정을 구체화한다.
- `ADR-003`은 `ADR-001`의 인증/권한 방향을 애플리케이션 모델로 구체화한다.
- `ADR-004`는 `ADR-001`과 `ADR-002`를 기반으로 문서 수집 및 색인 실행 구조를 정의한다.

## 현재 기준 아키텍처 요약

- Web: `Next.js 16`, `React 19.2`, `TypeScript 5.9`, `Tailwind CSS 4.x`
- API: `Python 3.13.x`, `FastAPI`, `Pydantic 2`, `SQLAlchemy 2`
- Data: `PostgreSQL 18`, `pgvector`, `pg_trgm`, `Redis 8`
- Async: `Celery 5.6`
- Auth: 사내 `OIDC/OAuth2` SSO
- Storage: `S3 호환 스토리지` 또는 `MinIO`

## 관련 문서

- PRD: [RockASK_Dashboard_PRD.md](/D:/myhome/JJ-RAG-Platform/RockASK_Dashboard_PRD.md)
- DB Schema: [schema.sql](/D:/myhome/JJ-RAG-Platform/db/schema.sql)
- ERD: [ERD.md](/D:/myhome/JJ-RAG-Platform/db/ERD.md)

## 새 ADR 작성 규칙

- 새 결정은 기존 ADR을 직접 덮어쓰지 말고 새 번호의 ADR로 추가한다.
- 상태 값은 최소 `Accepted`, `Superseded`, `Deprecated`, `Proposed` 중 하나를 사용한다.
- 각 ADR은 최소한 아래 섹션을 포함한다.
  - 배경
  - 의사결정 기준
  - 확정 결정
  - 대안 비교
  - 영향
  - 재검토 조건
- 기존 결정을 대체할 경우, 기존 ADR 상단 또는 인덱스에 대체 관계를 명시한다.

## 다음 후보 ADR

- `ADR-005`: API 계약 및 버전 관리 전략
- `ADR-006`: 관측성 및 운영 모니터링 기준
- `ADR-007`: 배포 아키텍처 및 환경 분리 전략
