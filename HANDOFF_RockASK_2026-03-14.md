# RockASK Workspace Handoff

작성일: 2026-03-14  
기준 경로: `D:\myhome\RockASK`

## 현재 상태 요약

현재 저장소는 랜딩 화면 P0, P1 범위와 주요 조회 화면 골격까지 구현된 상태다.
웹은 랜딩, 채팅, 지식 공간, 문서, 업로드, 피드백, 운영 화면 라우트가 모두 존재한다.
백엔드는 조회 API 중심으로 채팅, 문서, 지식 공간 API가 구현돼 있고, 실DB seed 기준 조회 QA까지 통과했다.

안정적으로 푸시된 최신 기준 커밋:

- `1fa8df5` `Fix chat list query for real DB QA`

## 이번 세션까지 완료된 항목

### 웹

- 랜딩 P0 구현 완료
  - 헤더 검색
  - 히어로 검색
  - scope 선택 저장
  - 추천 프롬프트/최근 채팅/지식 공간/문서 이동
- 랜딩 P1 구현 완료
  - 테마 토글
  - 알림 드롭다운
  - 모바일 drawer
  - 접근성 및 반응형 QA
- placeholder 라우트를 실제 내용 화면으로 교체 완료
- 랜딩 주요 카피 한글화 완료
- route page loader를 DTO 기반 API-first 구조로 전환 완료

### 백엔드

- `POST /api/v1/queries`
- `PATCH /api/v1/preferences`
- `GET /api/v1/chats`
- `GET /api/v1/chats/{chat_id}`
- `GET /api/v1/documents/{document_id}`
- `GET /api/v1/knowledge-spaces`
- `GET /api/v1/knowledge-spaces/{knowledge_space_id}`

### QA

- 웹 `typecheck`, `check`, `build` 통과
- 랜딩 P1 수동 QA 체크리스트 문서화 완료
- 실DB seed 기준 조회 API QA 통과

## 다음 Codex 세션에서 먼저 볼 파일

우선순위 순서:

1. `HANDOFF_RockASK_2026-03-14.md`
2. `docs/setup/local-web-preview.md`
3. `docs/landing-p1-qa-checklist.md`
4. `apps/web/lib/route-page-data.ts`
5. `apps/api/app/services/chats.py`
6. `apps/api/app/services/documents.py`
7. `apps/api/app/services/knowledge_spaces.py`

## 다음 작업 우선순위

### 1. 웹에서 실API 렌더링 기준 통합 확인

이미 프론트는 API-first 구조로 바뀌어 있다.
다음 세션에서는 웹을 띄워 아래 화면이 fallback이 아니라 실제 API 응답으로 렌더링되는지 먼저 확인하면 된다.

- `/`
- `/chats`
- `/chats/{chat_id}`
- `/knowledge-spaces`
- `/knowledge-spaces/{knowledge_space_id}`
- `/documents/{document_id}`

확인 포인트:

- 실API 연결 시 카드/상세 텍스트가 어색하지 않은지
- 404 대상에서 `null` 화면 유지 대신 `notFound()`로 올릴지
- empty 응답이 들어와도 레이아웃이 깨지지 않는지

### 2. 스프린트 2 API 계약 및 구현

다음 조회/쓰기 API가 아직 남아 있다.

- `GET /api/v1/ingestion/jobs` 또는 `GET /api/v1/ingestion/overview`
- `POST /api/v1/feedback`
- `POST /api/v1/documents` 또는 업로드 전용 엔드포인트

우선순위는 아래 순서가 적절하다.

1. ingestion overview
2. feedback submit
3. document upload metadata

### 3. 정적 화면을 실제 submit 화면으로 전환

다음 화면은 현재 구조는 있지만 실제 업무 액션까지는 아직 연결되지 않았다.

- `apps/web/app/feedback/page.tsx`
- `apps/web/app/documents/upload/page.tsx`
- `apps/web/app/ingestion/page.tsx`

필요 작업:

- form validation
- submit API 연결
- success/error state
- empty/loading state 정리

### 4. 자동화 테스트 추가

수동 QA는 많이 끝났다. 다음 단계는 회귀 방지용 자동화다.

우선 대상:

- 랜딩 헤더 검색
- 히어로 검색
- scope 저장/복원
- alerts open/close
- mobile drawer focus trap
- route loader API fetch 경로
- `/chats`, `/knowledge-spaces`, `/documents` 상세 렌더링

## 로컬 실행 가이드

서비스를 바로 띄우는 절차는 아래 문서를 참고하면 된다.

- `docs/setup/local-web-preview.md`

현재 기준 포트:

- API: `127.0.0.1:8000`
- Web: `127.0.0.1:3202`

## 주요 문서

- 랜딩 QA: `docs/landing-p1-qa-checklist.md`
- 로컬 미리보기 실행: `docs/setup/local-web-preview.md`
- 조회 API 계약서
  - `docs/be-route-01-chat-list-api-contract.md`
  - `docs/be-route-02-chat-detail-api-contract.md`
  - `docs/be-route-03-knowledge-space-list-api-contract.md`
  - `docs/be-route-04-knowledge-space-detail-api-contract.md`
  - `docs/be-route-05-document-detail-api-contract.md`

## 현재 주의사항

- `apps/web/lib/route-page-data.ts` 는 API 주소가 없으면 fallback으로 동작한다.
- 웹을 실API 기준으로 보려면 `NEXT_PUBLIC_API_BASE_URL` 또는 `API_BASE_URL` 이 필요하다.
- Next 개발 서버를 띄우면 `apps/web/next-env.d.ts` 가 갱신될 수 있다.
- 미리보기 실행 시 루트에 `.tmp-api.log`, `.tmp-api.err.log`, `.tmp-web-preview.log`, `.tmp-web-preview.err.log` 가 생길 수 있다.

## 다음 세션에서 바로 쓸 수 있는 요청 예시

- `HANDOFF_RockASK_2026-03-14.md 기준으로 다음 작업 이어서 진행해줘`
- `docs/setup/local-web-preview.md 기준으로 웹과 API 다시 올려줘`
- `실API 기준으로 /chats 와 /documents 화면부터 QA 진행해줘`
- `스프린트 2 API 티켓부터 구현해줘`
