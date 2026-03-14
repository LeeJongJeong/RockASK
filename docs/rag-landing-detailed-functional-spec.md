# RockASK RAG Landing 상세 기능 설계서 초안

버전: `v0.1-draft`  
작성일: `2026-03-13`  
대상 화면: `rag_landing_refined.html`  
기준 문서: `RockASK_Dashboard_PRD.md`, `db/ERD.md`, `docs/adr/*`

## 1. 문서 목적

이 문서는 `rag_landing_refined.html` 첫 화면을 실제 서비스 기능으로 구현하기 위한 상세 기능 설계 초안이다.

- 화면 영역별 목적, 데이터, 상호작용, 상태, 권한 규칙을 정의한다.
- 기존 PRD의 API/데이터 모델을 구현 가능한 수준으로 세분화한다.
- 현재 HTML 시안과 `DashboardResponse` 타입 사이의 차이를 정리한다.

## 2. 범위

### 2.1 포함 범위

- 좌측 사이드바
- 상단 헤더
- 메인 히어로 검색 영역
- Data Health 카드
- 즉시 실행 카드
- KPI 카드
- 주요 지식 공간
- 최근 업데이트
- 추천 프롬프트
- 최근 채팅
- 다크모드, 알림, 모바일 사이드 메뉴

### 2.2 제외 범위

- 실제 채팅 상세 화면의 메시지 렌더링
- 문서 업로드 마법사 상세 UI
- 관리자 전용 운영 대시보드
- 전문 봇 상세 설정 화면

## 3. 용어 정의

| 용어 | 의미 |
|---|---|
| Landing | 로그인 직후 진입하는 첫 화면 대시보드 |
| Scope | 사용자가 질의를 수행할 수 있는 검색 범위 |
| Knowledge Space | 문서 집합과 접근 정책을 함께 가지는 지식 공간 |
| Data Health | 동기화, 색인, 수집 실패 등 검색 신뢰도 상태 |
| Prompt Template | 부서/역할별 추천 질문 템플릿 |
| Alert | 운영 또는 사용자 공지 성격의 알림 |

## 4. 사용자 유형 및 권한 가정

| 사용자 유형 | 설명 | 주요 권한 |
|---|---|---|
| 일반 사용자 | 문서 검색과 최근 채팅 재개가 주 목적 | `view`, `ask` |
| 기여 사용자 | 업로드 가능 사용자 | `view`, `ask`, `upload` |
| 운영 관리자 | 수집 상태와 권한 설정을 관리 | `view`, `ask`, `upload`, `manage`, `admin` |

기본 원칙은 다음과 같다.

- 모든 목록 데이터는 사용자 ACL 기준으로 사전 필터링한다.
- UI 숨김만으로 권한을 통제하지 않는다. API에서 최종 차단한다.
- 운영 상세 정보는 일반 사용자용 Landing에 과도하게 노출하지 않는다.

## 5. 화면 구성 식별자

| 기능 ID | 화면 영역 | 목적 | 주 데이터 소스 |
|---|---|---|---|
| `LND-01` | 좌측 사이드바 | 주요 제품 모듈 진입 | 정적 메뉴 + `alerts` |
| `LND-02` | 헤더 검색창 | 어느 위치에서든 빠른 질의 시작 | `POST /api/v1/queries` |
| `LND-03` | 테마 토글 | 라이트/다크 모드 전환 | `PATCH /api/v1/preferences`, `localStorage` |
| `LND-04` | 알림 버튼 | 운영/공지 알림 확인 | `alerts` |
| `LND-05` | 사용자 프로필 | 현재 사용자 식별 | `profile` |
| `LND-06` | 히어로 검색 패널 | 첫 질문 시작의 핵심 진입점 | `scopes`, `POST /api/v1/queries` |
| `LND-07` | 히어로 보조 카드 | 추천/주의/템플릿 정보 제공 | 정적 또는 CMS 구성값 |
| `LND-08` | Data Health | 검색 신뢰도 요약 | `health`, `GET /api/v1/dashboard/health` |
| `LND-09` | 즉시 실행 | 자주 쓰는 기능 바로가기 | 정적 정의 + 권한 체크 |
| `LND-10` | KPI 카드 | 핵심 사용량/성과 지표 요약 | `summary` |
| `LND-11` | 주요 지식 공간 | 자주 접근하는 컬렉션 안내 | `knowledgeSpaces` |
| `LND-12` | 최근 업데이트 | 최근 반영된 중요 문서 노출 | `recentUpdates` |
| `LND-13` | 추천 프롬프트 | 한 번 클릭으로 질의 시작 | `recommendedPrompts` |
| `LND-14` | 최근 채팅 | 기존 질문 흐름 재개 | `recentChats` |

## 6. 초기 진입 및 데이터 로딩 시퀀스

### 6.1 초기 로드 원칙

- Landing 진입 시 서버 컴포넌트에서 `GET /api/v1/dashboard`를 1회 호출한다.
- 응답이 성공하면 화면 기본 데이터를 SSR로 렌더링한다.
- 클라이언트는 인터랙티브 기능에 필요한 최소 상태만 가진다.
- `Data Health`는 최초 SSR 이후 60초 주기로 `GET /api/v1/dashboard/health`를 재검증할 수 있다.

### 6.2 부분 실패 원칙

- `profile`, `health`, `summary` 중 2개 이상이 정상 반환되면 전체 페이지는 `200`으로 렌더링한다.
- 세부 섹션 실패 시 해당 배열은 빈 값으로 내려주고, 사용자에게는 섹션 단위 empty state를 노출한다.
- 집계 일부 실패 사실은 `alerts`에 warning 레벨 메시지로 포함한다.
- 전체 집계 API가 실패하면 전역 오류 화면과 재시도 버튼을 표시한다.

### 6.3 기본 선택 상태

- 선택 Scope는 우선순위에 따라 결정한다.
1. 사용자 저장값 `last_scope_id`
2. `scopes[].isDefault === true`
3. 첫 번째 `enabled === true` Scope

## 7. 상세 기능 정의

### 7.1 `LND-01` 좌측 사이드바

#### 목적

- 주요 제품 기능으로 이동하는 전역 내비게이션을 제공한다.
- 현재 위치가 Landing임을 명확히 표시한다.

#### 표시 항목

| 메뉴 | 기본 경로 | 표시 조건 |
|---|---|---|
| 대시보드 | `/` | 항상 |
| 질문하기 | `/chat/new` | `ask` 권한 |
| 지식 베이스 | `/knowledge-spaces` | `view` 권한 |
| 전문 봇 | `/assistants` | `view` 권한 |
| 수집 파이프라인 | `/ingestion` | `manage` 이상 |

#### 동작 규칙

- 현재 페이지 메뉴는 active 스타일을 적용한다.
- 모바일에서는 햄버거 버튼 클릭 시 좌측에서 drawer 형태로 열린다.
- drawer는 overlay 클릭, `Esc`, 메뉴 선택 시 닫힌다.

#### 상태 규칙

- 메뉴 로딩 상태는 없다. 정적 구성으로 렌더링한다.
- 권한 미보유 메뉴는 숨김 처리한다.

### 7.2 `LND-02` 상단 검색창

#### 목적

- 스크롤 위치와 무관하게 빠르게 새 질의를 시작한다.

#### 입력 규칙

- placeholder: `정책, 기술문서, 회의록, 표준 운영절차를 검색하세요`
- 입력 길이: 공백 제외 `1~500자`
- 연속 공백은 단일 공백으로 정규화한다.
- 앞뒤 공백은 trim 처리한다.

#### 제출 규칙

- `Enter` 입력 시 질의를 제출한다.
- 모바일 키보드의 검색/전송 액션도 동일하게 처리한다.
- 선택 Scope는 현재 Landing에서 활성화된 Scope를 사용한다.
- 요청 본문은 아래와 같다.

```json
{
  "query": "신규 입사자 온보딩 절차와 필요한 문서 목록을 정리해줘",
  "scope_id": "global",
  "source": "dashboard_header"
}
```

#### 성공 시 동작

- `POST /api/v1/queries` 성공 시 `redirect_url`로 이동한다.
- `chat_id`가 반환되면 이후 최근 채팅 목록에 반영될 수 있다.

#### 예외 처리

- 빈 문자열 제출 시 요청하지 않고 입력창 하단에 `질문을 입력해 주세요.`를 노출한다.
- `scope_id`가 비활성 범위면 선택 Scope를 기본값으로 재설정하고 다시 시도한다.
- API 오류 시 토스트 `질문 시작에 실패했습니다. 잠시 후 다시 시도해 주세요.`를 표시한다.

#### 추적 이벤트

- `dashboard_query_submitted`
- 속성: `source=header`, `scope_id`, `query_length`

### 7.3 `LND-03` 테마 토글

#### 목적

- 사용자 환경 설정에 따라 라이트/다크 모드를 전환한다.

#### 초기화 규칙

1. `localStorage.enterprise-rag-theme`
2. 사용자 저장 설정 `theme`
3. 브라우저 시스템 설정

#### 동작 규칙

- 토글 즉시 UI를 낙관적으로 전환한다.
- 백그라운드에서 `PATCH /api/v1/preferences`로 저장한다.
- API 저장 실패 시 현재 세션의 시각적 상태는 유지하되 토스트로 저장 실패를 알린다.

#### 저장 요청 예시

```json
{
  "theme": "dark"
}
```

#### 추적 이벤트

- `dashboard_theme_toggled`
- 속성: `theme`

### 7.4 `LND-04` 알림 버튼

#### 목적

- 현재 사용자에게 보여줄 운영/공지 알림을 확인하게 한다.

#### 표시 규칙

- 미확인 알림이 1건 이상이면 빨간 dot 배지를 표시한다.
- MVP에서는 `alerts.length > 0`이면 dot를 노출한다.
- 알림 수치 배지가 필요하면 후속으로 `meta.unreadAlertCount`를 추가한다.

#### 동작 규칙

- 버튼 클릭 시 드롭다운 패널을 연다.
- 패널에는 최대 5건을 최신순으로 표시한다.
- 항목은 `severity`, `title`, `body`를 노출한다.
- 알림이 없으면 `현재 확인할 알림이 없습니다.`를 표시한다.

#### 데이터 원칙

- MVP에서는 `GET /api/v1/dashboard`의 `alerts`를 재사용한다.
- 알림 센터가 별도 구축되면 `GET /api/v1/alerts`로 분리한다.

#### 추적 이벤트

- `dashboard_alerts_opened`
- `dashboard_alert_clicked`

### 7.5 `LND-05` 사용자 프로필

#### 목적

- 현재 사용자와 팀 컨텍스트를 노출한다.

#### 표시 항목

- `profile.initials`
- `profile.name`
- `profile.team`

#### 동작 규칙

- MVP에서는 비클릭 영역으로 둔다.
- 후속 단계에서 프로필 메뉴를 붙일 경우 `내 설정`, `로그아웃`으로 확장한다.

### 7.6 `LND-06` 히어로 검색 패널

#### 목적

- 로그인 직후 가장 빠르게 첫 질문을 시작시키는 핵심 영역이다.

#### 구성 요소

- 권한 안내 배지
- 메인 질의 입력창
- `질문 시작` 버튼
- Scope 칩 목록

#### 권한 안내 배지

- 기본 문구: `내 권한 범위 내 문서만 검색`
- 문구는 정적이지만, 사용자가 제한 범위만 가진 경우 툴팁으로 보조 설명을 제공한다.

#### Scope 칩 규칙

- `scopes` 배열 순서대로 렌더링한다.
- `enabled === false` 항목은 비활성 상태로 보이지만 클릭할 수 없다.
- 선택 Scope는 active 스타일을 적용한다.
- Scope 변경 시 즉시 로컬 상태를 업데이트하고 `PATCH /api/v1/preferences`로 `last_scope_id` 저장을 시도한다.

#### 질문 제출 규칙

- 버튼 클릭 또는 `Enter`로 제출한다.
- 요청 본문:

```json
{
  "query": "신규 입사자 온보딩 절차와 필요한 문서 목록을 정리해줘",
  "scope_id": "global",
  "source": "dashboard_hero"
}
```

- `질문 시작` 버튼은 입력이 유효하지 않으면 disabled 상태다.
- 제출 중에는 버튼을 spinner 상태로 바꾸고 중복 제출을 막는다.

#### 성공 시 동작

- `redirect_url`로 이동한다.
- 이동 전 현재 입력값은 메모리에서 제거한다.

#### 실패 시 동작

- 네트워크 오류: 인라인 에러 메시지 출력
- `403`: 선택한 Scope 접근 불가 메시지 출력 후 기본 Scope로 복구
- `429`: 잠시 후 다시 시도 문구와 재시도 허용 시간 표기

#### 추적 이벤트

- `dashboard_query_submitted`
- 속성: `source=hero`, `scope_id`, `query_length`
- `dashboard_scope_changed`
- 속성: `scope_id`

### 7.7 `LND-07` 히어로 보조 카드

#### 목적

- 추천 질문, 업무 템플릿, 주의 안내를 간단히 전달한다.

#### MVP 규칙

- 이 영역은 서버 데이터가 아니라 정적 구성값으로 시작한다.
- 3개 카드 모두 클릭 기능 없이 정보 노출만 제공한다.

#### 후속 확장

- `추천 질문`: 클릭 시 히어로 입력창 채우기
- `업무 템플릿`: 템플릿 시작 플로우 연결
- `주의 안내`: 업로드 정책 문서 링크 연결

#### 데이터 모델 보완

- 동적 운영이 필요하면 `heroHighlights[]` 응답 필드 추가를 검토한다.

### 7.8 `LND-08` Data Health 카드

#### 목적

- 검색 품질과 최신성에 대한 신뢰도를 사용자가 즉시 판단할 수 있게 한다.

#### 표시 항목

| 항목 | 응답 필드 | 표시 형식 |
|---|---|---|
| 상태 배지 | `health.status` | `healthy`, `warning`, `error` |
| 마지막 동기화 | `health.lastSyncRelative` | 예: `15분 전` |
| 오늘 반영 문서 수 | `health.indexedToday` | 정수 + `건` |
| 색인 대기 | `health.pendingIndexJobs` | 정수 + `건` |
| 수집 실패 | `health.failedIngestionJobs` | 정수 + `건` |
| 출처 정책 | `health.citationPolicy` | 사용자 친화 라벨 |

#### 상태 표현 규칙

| status | 배지 색상 | 의미 |
|---|---|---|
| `healthy` | 초록 | 정상 운영 |
| `warning` | 노랑 | 지연 또는 일부 실패 |
| `error` | 빨강 | 검색 신뢰도 저하 가능성 높음 |

#### 세부 규칙

- `citationPolicy=always_on`은 화면에서 `항상 표시`로 번역한다.
- `failedIngestionJobs > 0`이면 보조 경고 문구를 노출할 수 있다.
- 일반 사용자는 실패 건수 숫자까지는 볼 수 있으나, 실패 원인 상세는 볼 수 없다.

#### 자동 갱신

- 탭 활성 상태에서 60초마다 재조회한다.
- 수동 새로고침 버튼은 MVP 범위에서 제외한다.

#### 추가 데이터 필요 사항

현재 시안에 있는 `오늘 동기화 성공률 98.6%`를 정확히 구현하려면 아래 필드가 필요하다.

```json
{
  "syncSuccessRateToday": 0.986
}
```

권장 위치는 `health.syncSuccessRateToday`다.

#### 추적 이벤트

- `dashboard_health_refreshed`

### 7.9 `LND-09` 즉시 실행

#### 목적

- 자주 쓰는 주요 동선을 첫 화면에서 1클릭으로 시작하게 한다.

#### 카드 정의

| 액션 | 기본 경로 | 권한 조건 | 노출 규칙 |
|---|---|---|---|
| 새 질문 시작 | `/chat/new?scope={selectedScope}` | `ask` | 항상 |
| 문서 업로드 | `/documents/upload` | `upload` | 권한 보유 시 노출 |
| 컬렉션 관리 | `/knowledge-spaces` | `manage` 이상 | 권한 보유 시 노출 |
| 오답 신고 | `/feedback` | `ask` | 항상 |

#### 동작 규칙

- 각 카드 전체를 클릭 타겟으로 사용한다.
- 권한이 없는 카드의 경우 MVP에서는 숨김 처리한다.
- 추후 교육 목적이 필요하면 disabled + 툴팁 방식으로 전환할 수 있다.

#### 추적 이벤트

- `dashboard_quick_action_clicked`
- 속성: `action_id`

### 7.10 `LND-10` KPI 카드

#### 목적

- 사용량과 처리 성능의 핵심 지표를 요약해 보여준다.

#### 표시 규칙

| 카드 | 응답 필드 | 표시 형식 |
|---|---|---|
| 검색 가능 문서 | `summary.searchableDocuments` | 천 단위 콤마 |
| 오늘 질의 수 | `summary.queriesToday` | 천 단위 콤마 |
| 평균 응답 시간 | `summary.avgResponseTimeMs` | 초 단위 1자리 소수 |
| 피드백 처리율 | `summary.feedbackResolutionRate7d` | 퍼센트 |

#### 보조 문구 규칙

- `전일 대비 +352`, `가장 많은 범위: 개발 문서`와 같은 보조 문구는 현재 응답에 없다.
- MVP에서는 정적 문구로 시작하거나 숨긴다.
- 운영 데이터를 기반으로 노출하려면 `summary.deltaSearchableDocuments`, `summary.topScopeLabel` 같은 필드 추가가 필요하다.

#### 상태 규칙

- 지표 데이터 누락 시 `-`로 표시한다.
- 전체 섹션 실패 시 skeleton 대신 empty 상태 `지표를 불러오지 못했습니다.`를 표시한다.

### 7.11 `LND-11` 주요 지식 공간

#### 목적

- 사용자가 자주 접근하는 핵심 컬렉션과 상태를 한눈에 보여준다.

#### 정렬 및 개수

- 기본 정렬: 최근 7일 접근량 desc, 최근 업데이트 desc
- 기본 노출 개수: 2건
- `전체 보기` 클릭 시 `/knowledge-spaces`로 이동한다.

#### 카드 표시 필드

| 항목 | 응답 필드 |
|---|---|
| 제목 | `knowledgeSpaces[].name` |
| 문서 수 | `knowledgeSpaces[].docCount` |
| 소유 팀 | `knowledgeSpaces[].ownerTeam` |
| 마지막 업데이트 | `knowledgeSpaces[].lastUpdatedRelative` |
| 상태 | `knowledgeSpaces[].status` |
| 가시성/권한 범위 | `knowledgeSpaces[].visibility` |
| 문의 담당 | `knowledgeSpaces[].contactName` |

#### 상태 라벨 규칙

| status | 화면 라벨 |
|---|---|
| `active` | 검색 가능 |
| `indexing` | 색인 중 |
| `error` | 점검 필요 |
| `archived` | 보관됨 |

#### 동작 규칙

- 카드 본문 클릭 시 `/knowledge-spaces/{id}`로 이동한다.
- 상태가 `indexing`이어도 상세 페이지 접근은 허용한다.
- `error` 상태 카드에는 보조 문구 `일부 문서는 검색 결과에서 제외될 수 있습니다.`를 추가할 수 있다.

#### Empty 상태

- 문구: `접근 가능한 지식 공간이 없습니다.`
- 권한 안내 또는 업로드 유도 버튼은 `upload` 권한이 있을 때만 노출한다.

### 7.12 `LND-12` 최근 업데이트

#### 목적

- 최신 반영 문서를 보여줘 사용자가 신선한 정보를 우선 확인하도록 돕는다.

#### 정렬 및 개수

- `updated_at desc`
- 기본 3건 노출

#### 표시 필드

- `title`
- `team`
- `updatedRelative`
- `visibility`
- `summary`

#### 동작 규칙

- 항목 클릭 시 `/documents/{id}` 또는 해당 문서 상세 경로로 이동한다.
- 사용자가 접근 권한을 잃은 경우 목록에서 제거한다.

#### Empty 상태

- 문구: `최근 반영된 문서가 없습니다.`

### 7.13 `LND-13` 추천 프롬프트

#### 목적

- 사용자의 반복 질의를 클릭 한 번으로 바로 시작하게 한다.

#### 정렬 및 개수

- 역할 적합도 desc, 최근 사용량 desc
- 기본 3건 노출

#### 동작 규칙

- 버튼 클릭 시 별도 확인 없이 즉시 `POST /api/v1/queries`를 호출한다.
- 요청 본문:

```json
{
  "query": "신규 입사자 온보딩 문서와 교육 일정을 한 번에 정리해줘",
  "scope_id": "global",
  "source": "dashboard_prompt",
  "prompt_template_id": "prompt-onboarding"
}
```

- `scope_id`는 현재 선택 Scope를 우선 사용한다.
- 템플릿이 특정 Scope에만 유효하면 API가 허용 범위를 재검증한다.

#### 실패 처리

- API 실패 시 토스트를 노출하고 버튼 재클릭을 허용한다.

#### Empty 상태

- 문구: `현재 추천할 프롬프트가 없습니다.`

#### 추적 이벤트

- `dashboard_prompt_clicked`
- 속성: `prompt_template_id`, `scope_id`

### 7.14 `LND-14` 최근 채팅

#### 목적

- 사용자가 이전 질문 흐름을 빠르게 이어서 볼 수 있게 한다.

#### 정렬 및 개수

- `last_message_at desc`
- 기본 3건 노출
- `전체 보기` 클릭 시 `/chats` 이동

#### 표시 필드

- `title`
- `assistantName`
- `lastMessageRelative`

#### 동작 규칙

- 항목 클릭 시 `/chats/{id}`로 이동한다.
- 삭제되었거나 접근 권한이 제거된 채팅은 목록에서 제외한다.

#### Empty 상태

- 문구: `최근 대화가 없습니다. 첫 질문을 시작해 보세요.`

#### 추적 이벤트

- `dashboard_recent_chat_clicked`
- 속성: `chat_id`

## 8. 입력 검증 및 공통 예외 처리

### 8.1 공통 검증

- 모든 질의 입력은 UTF-8 기준 500자 제한
- 제어 문자 제거
- 금지된 빈 입력, 공백만 입력 차단

### 8.2 공통 네트워크 오류

| 상태 | 처리 방식 |
|---|---|
| `401` | 로그인 만료 안내 후 재인증 이동 |
| `403` | 접근 권한 없음 토스트 |
| `404` | 리소스 없음 안내 |
| `409` | 최신 상태 갱신 후 다시 시도 |
| `429` | 재시도 가능 시간 포함 안내 |
| `5xx` | 일반 오류 토스트 + 재시도 허용 |

### 8.3 섹션별 상태 우선순위

1. `loading`
2. `error`
3. `empty`
4. `success`

## 9. API 설계 세분화

### 9.1 `GET /api/v1/dashboard`

#### 목적

- Landing 전체 렌더링용 집계 응답 제공

#### 필수 응답 필드

```json
{
  "profile": {
    "name": "김개발",
    "team": "플랫폼개발팀",
    "initials": "김"
  },
  "health": {
    "status": "healthy",
    "lastSyncAt": "2026-03-11T10:15:00+09:00",
    "lastSyncRelative": "15분 전",
    "indexedToday": 148,
    "pendingIndexJobs": 12,
    "failedIngestionJobs": 1,
    "citationPolicy": "always_on"
  },
  "summary": {
    "searchableDocuments": 24860,
    "queriesToday": 1284,
    "avgResponseTimeMs": 6200,
    "feedbackResolutionRate7d": 0.94
  },
  "scopes": [],
  "knowledgeSpaces": [],
  "recentUpdates": [],
  "recommendedPrompts": [],
  "recentChats": [],
  "alerts": [],
  "meta": {
    "source": "api"
  }
}
```

#### 권장 확장 필드

```json
{
  "health": {
    "syncSuccessRateToday": 0.986
  },
  "summary": {
    "deltaSearchableDocuments": 352,
    "topScopeLabel": "개발 문서"
  },
  "meta": {
    "generatedAt": "2026-03-13T22:30:00+09:00",
    "unreadAlertCount": 1
  }
}
```

### 9.2 `GET /api/v1/dashboard/health`

- Data Health 카드 단독 갱신용
- 응답은 `health` 객체만 반환한다.

### 9.3 `POST /api/v1/queries`

#### 요청

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `query` | `string` | 예 | 사용자 질문 |
| `scope_id` | `string` | 예 | 선택 Scope |
| `source` | `string` | 예 | `dashboard_header`, `dashboard_hero`, `dashboard_prompt` |
| `prompt_template_id` | `string` | 아니오 | 추천 프롬프트 클릭 시 |

#### 응답

| 필드 | 설명 |
|---|---|
| `query_id` | 추적용 질의 ID |
| `chat_id` | 연결된 채팅 ID |
| `redirect_url` | 이동할 채팅 화면 경로 |

### 9.4 `PATCH /api/v1/preferences`

#### 요청 가능 필드

- `theme`
- `last_scope_id`

## 10. 데이터 계약과 현재 구현 간 차이

| 항목 | 현재 타입 상태 | 구현 필요 조치 |
|---|---|---|
| 동기화 성공률 | 없음 | `health.syncSuccessRateToday` 추가 |
| KPI 보조 문구용 변화량 | 없음 | `summary.deltaSearchableDocuments`, `summary.topScopeLabel` 추가 검토 |
| 미확인 알림 수 | 없음 | `meta.unreadAlertCount` 추가 검토 |
| 히어로 보조 카드 | 없음 | 정적 구성으로 시작, 필요 시 `heroHighlights[]` 추가 |
| 알림 드롭다운 상세 링크 | 없음 | 필요 시 `alerts[].linkUrl` 추가 |

## 11. 접근성 및 반응형 요구사항

### 11.1 접근성

- 모든 버튼과 링크는 키보드 포커스 가능해야 한다.
- 알림 버튼, 테마 버튼, 햄버거 버튼은 `aria-label`을 가진다.
- 상태 배지는 색상만으로 의미를 전달하지 않고 텍스트를 함께 노출한다.
- 입력 오류 문구는 스크린리더가 인식 가능해야 한다.

### 11.2 반응형

- `xl` 미만에서는 좌측 사이드바를 drawer로 대체한다.
- 히어로 패널과 Data Health는 세로 스택으로 재배치한다.
- KPI 카드는 2열 또는 1열로 줄어든다.
- 최근 업데이트, 추천 프롬프트, 최근 채팅은 세로 순서로 쌓는다.

## 12. 로깅 및 관측성

| 이벤트명 | 트리거 | 주요 속성 |
|---|---|---|
| `dashboard_loaded` | Landing 렌더 완료 | `source`, `user_id`, `scope_id` |
| `dashboard_query_submitted` | 검색 제출 | `source`, `scope_id`, `query_length` |
| `dashboard_scope_changed` | Scope 선택 변경 | `scope_id` |
| `dashboard_theme_toggled` | 테마 변경 | `theme` |
| `dashboard_alerts_opened` | 알림 패널 오픈 | `alert_count` |
| `dashboard_quick_action_clicked` | 즉시 실행 클릭 | `action_id` |
| `dashboard_prompt_clicked` | 추천 프롬프트 클릭 | `prompt_template_id`, `scope_id` |
| `dashboard_recent_chat_clicked` | 최근 채팅 클릭 | `chat_id` |

추가 운영 로그 원칙은 다음과 같다.

- 모든 요청 로그에 `request_id`, `user_id`, `scope_id`를 포함한다.
- 질의 생성 실패는 `query_runs` 또는 API 애플리케이션 로그에 원인을 남긴다.

## 13. MVP 결정 사항

- 헤더 검색과 히어로 검색은 동일 API를 사용한다.
- 히어로 보조 카드는 정적 콘텐츠로 시작한다.
- 알림은 `dashboard` 집계 응답의 `alerts`를 재사용한다.
- 지식 공간, 최근 업데이트, 최근 채팅은 ACL 필터링 후 최대 3건 이내로 노출한다.
- 운영 상세 분석 화면은 Landing에서 분리한다.

## 14. 미결정 항목

- 알림 드롭다운에서 항목 클릭 시 개별 상세 페이지가 필요한지
- `오답 신고` 즉시 실행이 독립 페이지로 갈지, 최근 답변 컨텍스트 선택 화면으로 갈지
- `질문하기`, `지식 베이스`, `전문 봇`, `수집 파이프라인`의 최종 라우팅 경로 확정
- 최근 업데이트 항목의 실제 상세 경로가 문서 단위인지 버전 단위인지
- KPI 보조 문구를 API 기반으로 제공할지 정적 카피로 시작할지

## 15. 구현 우선순위 제안

### P0

- `GET /api/v1/dashboard` 기준 SSR 렌더
- 헤더/히어로 검색 제출
- Scope 선택 및 저장
- Data Health 카드
- 최근 채팅, 추천 프롬프트, 주요 지식 공간

### P1

- 알림 드롭다운
- 즉시 실행 라우팅
- KPI 보조 문구 동적화
- 모바일 drawer

### P2

- 히어로 보조 카드 동적화
- 알림 센터 분리
- 세분화된 운영 알림 링크

## 16. 승인 전 확인 필요 항목

- 제품/운영 관점에서 일반 사용자에게 노출할 Data Health 범위
- 각 즉시 실행 카드의 최종 라우트
- 알림, 히어로 보조 카드, KPI 보조 문구의 정적/동적 운영 기준
- `DashboardResponse` 확장 필드 반영 여부
