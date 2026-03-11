# RockASK Workspace Handoff

작성일: 2026-03-11
현재 기준 실제 작업 경로: D:\myhome\JJ-RAG-Platform
호환 경로(정션): D:\myhome\RockASK

## 현재 상태 요약

이 워크스페이스는 사내 RAG 플랫폼 "RockASK"의 초기 기획/설계/골격 생성 상태다.

완료된 주요 산출물:
- 첫 화면 시안 작업본: D:\myhome\JJ-RAG-Platform\rag_landing_refined.html
- 개발용 PRD: D:\myhome\JJ-RAG-Platform\RockASK_Dashboard_PRD.md
- DB 스키마: D:\myhome\JJ-RAG-Platform\db\schema.sql
- ERD 문서: D:\myhome\JJ-RAG-Platform\db\ERD.md
- ADR 인덱스: D:\myhome\JJ-RAG-Platform\docs\adr\README.md
- ADR-001 기술 스택: D:\myhome\JJ-RAG-Platform\docs\adr\ADR-001-tech-stack.md
- ADR-002 검색 아키텍처: D:\myhome\JJ-RAG-Platform\docs\adr\ADR-002-search-architecture.md
- ADR-003 인증/권한 모델: D:\myhome\JJ-RAG-Platform\docs\adr\ADR-003-authz-model.md
- ADR-004 문서 수집 파이프라인: D:\myhome\JJ-RAG-Platform\docs\adr\ADR-004-ingestion-pipeline.md

## UI 관련 메모

- 브랜드명은 "RockASK"로 반영됨.
- 좌측 상단 아이콘은 첨부 이미지를 참고한 inline SVG 로고로 교체됨.
- 현재 HTML 작업본은 원본 ai_studio_code.html을 직접 덮지 않고 별도 파일 rag_landing_refined.html로 저장됨.

## 아키텍처 결정 요약

확정 스택:
- Frontend: Next.js 16, React 19.2, TypeScript 5.9, Tailwind CSS 4.x, TanStack Query, Biome, pnpm
- Backend: Python 3.13.x, FastAPI, Pydantic 2, SQLAlchemy 2, Alembic, Uvicorn, uv
- Data: PostgreSQL 18, pgvector, pg_trgm, Redis 8
- Async: Celery 5.6
- Storage: S3 호환 스토리지 또는 MinIO
- Auth: OIDC/OAuth2 기반 사내 SSO

검색 결정:
- PostgreSQL FTS + pgvector + pg_trgm 하이브리드
- 검색 단위는 document_chunks
- ACL은 query-time 적용
- citation은 항상 저장/표시

권한 결정:
- RBAC + 팀 소속 + ACL 혼합 모델
- 웹 세션은 HTTP-only secure cookie 기준
- 브라우저 로컬 스토리지에 access token 저장하지 않음

문서 파이프라인 결정:
- 비동기 워커 기반 수집/색인
- documents / document_versions 분리
- 새 버전 색인 성공 전까지 current_version 유지
- ingestion_jobs, sync_runs로 상태 추적

## 생성된 프로젝트 골격

모노레포 구조 생성 완료:
- D:\myhome\JJ-RAG-Platform\apps\web
- D:\myhome\JJ-RAG-Platform\apps\api
- D:\myhome\JJ-RAG-Platform\packages\types
- D:\myhome\JJ-RAG-Platform\packages\ui

웹 골격 주요 파일:
- D:\myhome\JJ-RAG-Platform\apps\web\app\page.tsx
- D:\myhome\JJ-RAG-Platform\apps\web\components\dashboard-shell.tsx
- D:\myhome\JJ-RAG-Platform\apps\web\lib\get-dashboard.ts
- D:\myhome\JJ-RAG-Platform\apps\web\lib\mock-dashboard.ts

API 골격 주요 파일:
- D:\myhome\JJ-RAG-Platform\apps\api\app\main.py
- D:\myhome\JJ-RAG-Platform\apps\api\app\api\routes\health.py
- D:\myhome\JJ-RAG-Platform\apps\api\app\api\routes\dashboard.py
- D:\myhome\JJ-RAG-Platform\apps\api\app\schemas\dashboard.py
- D:\myhome\JJ-RAG-Platform\apps\api\app\services\dashboard.py

공용 패키지:
- D:\myhome\JJ-RAG-Platform\packages\types\src\index.ts
- D:\myhome\JJ-RAG-Platform\packages\ui\src\index.tsx

루트 설정:
- D:\myhome\JJ-RAG-Platform\package.json
- D:\myhome\JJ-RAG-Platform\pnpm-workspace.yaml
- D:\myhome\JJ-RAG-Platform\biome.json
- D:\myhome\JJ-RAG-Platform\README.md

## 검증 상태

완료:
- Python 문법 검증: python -m compileall apps/api/app 통과

미완료:
- pnpm 미설치 상태라 Next.js 의존성 설치/빌드 검증은 아직 안 함
- git 저장소가 아니라 git status 기반 검증은 불가
- FastAPI/Next.js 실제 서버 실행 검증은 아직 안 함

## 경로 관련 주의사항

- 현재 세션 중에는 실제 폴더명 변경이 불가능해서, D:\myhome\RockASK 는 D:\myhome\JJ-RAG-Platform 을 가리키는 정션으로 생성함.
- 현재 세션 종료 후 워크스페이스를 D:\myhome\RockASK 로 다시 열어도 동일한 내용을 볼 수 있음.
- 나중에 실제 폴더명 자체를 RockASK 로 바꾸려면 세션이 해당 디렉터리를 사용하지 않는 상태에서 처리해야 함.

## 다음 우선 작업 추천

1. 새 워크스페이스를 D:\myhome\RockASK 로 다시 열기
2. pnpm / uv 설치 여부 확인
3. web 의존성 설치 및 실행
4. api 의존성 설치 및 실행
5. schema.sql 기준 SQLAlchemy 모델 또는 Alembic 초기 마이그레이션 생성
6. dashboard mock 데이터를 실제 DB/API 연동 구조로 치환

## 새 세션에서 바로 참고할 질문 예시

- "D:\myhome\RockASK 기준으로 이전 작업 이어서 해줘"
- "docs/adr/README.md 와 RockASK_Dashboard_PRD.md 기준으로 다음 작업 진행해줘"
- "apps/web 와 apps/api 골격 위에서 실제 개발 이어서 해줘"
