# BE-ROUTE-04 Knowledge Space Detail API Contract

## 문서 정보
- 티켓: `BE-ROUTE-04`
- 스프린트: `Sprint 1`
- 상태: `Draft`
- 대상 화면: `apps/web/app/knowledge-spaces/[knowledgeSpaceId]/page.tsx`
- 관련 선행 티켓: `BE-ROUTE-03`
- 관련 후속 티켓: `FE-API-01`, `FE-API-02`

## 1. 목적
`/knowledge-spaces/{knowledgeSpaceId}` 화면에서 현재 mock 기반으로 표시 중인 공간 개요, 운영 정보, 주제 범위, 운영 원칙, 연결 문서를 실제 API 응답으로 대체하기 위한 계약이다.

이 API는 다음 요구를 충족해야 한다.
- 현재 로그인 사용자가 접근 가능한 단일 지식 공간만 반환한다.
- 공간 이름, 운영 팀, 문의 담당, 공개 범위, 상태, 최근 갱신 시각을 함께 반환한다.
- 상세 화면 본문에 바로 렌더링할 수 있는 `overview`, `stewardship`, `coverage_topics`, `operating_rules`를 제공한다.
- 연결 문서는 UI 경로가 아니라 도메인 식별자 기준으로 반환한다.
- 목록 API(`GET /api/v1/knowledge-spaces`)와 동일한 `knowledge_space_id` 체계를 사용한다.

## 2. 엔드포인트 개요
- Method: `GET`
- Path: `/api/v1/knowledge-spaces/{knowledge_space_id}`
- Auth: 필수
- Content-Type: `application/json`
- Cache: `no-store` 권장

## 3. 요청 계약
### Path Parameters
| 이름 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| `knowledge_space_id` | string | 예 | `1 <= length <= 120` | 조회 대상 지식 공간 식별자 |

### Query Parameters
없음

### Request Example
```http
GET /api/v1/knowledge-spaces/ks-strategy HTTP/1.1
Accept: application/json
Authorization: Bearer <token>
```

## 4. 응답 계약
### 200 OK
```json
{
  "space": {
    "id": "ks-strategy",
    "name": "2026 상반기 사업 계획",
    "owner_team": "전략기획팀",
    "contact_name": "박OO",
    "status": "active",
    "visibility": "제한 공개",
    "doc_count": 3,
    "last_updated_at": "2026-03-14T13:05:00+09:00",
    "last_updated_relative": "2시간 전"
  },
  "overview": "전사 전략, 예산, 우선순위 문서를 모아두는 공간입니다. 리더 브리핑이나 회의 전 사전 질의에 자주 사용됩니다.",
  "stewardship": "전략기획팀이 문서 구조와 공개 범위를 관리하고, 월 1회 최신성 점검을 진행합니다.",
  "coverage_topics": [
    {
      "id": "topic-1",
      "text": "사업 목표와 분기 우선순위"
    },
    {
      "id": "topic-2",
      "text": "예산 승인 흐름"
    },
    {
      "id": "topic-3",
      "text": "경영 회의용 브리핑 자료"
    }
  ],
  "operating_rules": [
    {
      "id": "rule-1",
      "text": "리더십 리뷰가 끝난 문서만 전사 공용으로 공개합니다."
    },
    {
      "id": "rule-2",
      "text": "예산 수치가 바뀌면 24시간 안에 변경 이력을 추가합니다."
    },
    {
      "id": "rule-3",
      "text": "회의용 요약본과 원문 링크를 항상 함께 유지합니다."
    }
  ],
  "linked_documents": [
    {
      "id": "link-1",
      "target_type": "document",
      "target_id": "update-security",
      "label": "보안 점검 체크리스트 v3",
      "hint": "전사 공통 준수 항목 문서"
    },
    {
      "id": "link-2",
      "target_type": "document",
      "target_id": "update-onboarding",
      "label": "신입 입사자 온보딩 안내",
      "hint": "공통 운영 문서 예시"
    }
  ]
}
```

### Response Schema
#### Root
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `space` | `KnowledgeSpaceDetailHeader` | 예 | 공간 헤더 및 운영 메타데이터 |
| `overview` | string | 예 | 공간 개요 |
| `stewardship` | string | 예 | 운영/관리 책임 설명 |
| `coverage_topics` | array[`KnowledgeSpaceTopicItem`] | 예 | 이 공간이 다루는 주요 주제 |
| `operating_rules` | array[`KnowledgeSpaceRuleItem`] | 예 | 문서 운영/공개 원칙 |
| `linked_documents` | array[`KnowledgeSpaceLinkedDocumentItem`] | 예 | 관련 문서 링크 |

#### KnowledgeSpaceDetailHeader
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | 지식 공간 식별자 |
| `name` | string | 예 | 지식 공간 이름 |
| `owner_team` | string | 예 | 운영 팀 |
| `contact_name` | string | 예 | 문의 담당자명 |
| `status` | `active \| indexing \| error \| archived` | 예 | 공간 상태 |
| `visibility` | string | 예 | 공개 범위 라벨 |
| `doc_count` | integer | 예 | 현재 노출 문서 수 |
| `last_updated_at` | string(datetime) | 예 | 최근 갱신 시각 |
| `last_updated_relative` | string | 예 | UI 즉시 사용용 상대 시각 문자열 |

#### KnowledgeSpaceTopicItem
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | topic 식별자 |
| `text` | string | 예 | 주제 문장 |

#### KnowledgeSpaceRuleItem
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | rule 식별자 |
| `text` | string | 예 | 운영 원칙 문장 |

#### KnowledgeSpaceLinkedDocumentItem
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | linked row 식별자 |
| `target_type` | `document` | 예 | 연결 대상 종류. 현재 상세 화면 기준 문서만 허용 |
| `target_id` | string | 예 | 문서 상세 화면 연결용 식별자 |
| `label` | string | 예 | 화면 표시용 문서명 |
| `hint` | string | 예 | 보조 설명 |

## 5. 표시 규칙
- `overview`는 상단 본문 카드에서 바로 읽히는 길이의 정제된 텍스트여야 한다.
- `stewardship`는 운영 주체와 최신성 유지 책임이 드러나야 한다.
- `coverage_topics`는 상세 화면의 카드/칩으로 바로 렌더링할 수 있는 짧은 텍스트여야 한다.
- `operating_rules`는 중요도 또는 관리 우선순위 순으로 반환한다.
- `linked_documents`는 우측 사이드바 노출 순서대로 반환한다.

## 6. 상태 값 정의
| 값 | 의미 | 상세 기본 노출 여부 |
| --- | --- | --- |
| `active` | 정상 운영 중인 공간 | 노출 |
| `indexing` | 색인 또는 동기화 진행 중 | 노출 |
| `error` | 색인/동기화 오류 상태 | 노출 |
| `archived` | 보관 상태 | 조건부 노출 |

## 7. 권한 규칙
- 현재 로그인 사용자가 접근 가능한 지식 공간만 조회 가능하다.
- 권한이 없는 공간, 삭제된 공간, 식별자가 잘못된 경우는 `404 Not Found`로 응답한다.
- `archived` 공간은 사용자 정책에 따라 반환 여부가 달라질 수 있다.
- 응답에는 권한 범위를 벗어나는 연결 문서가 포함되면 안 된다.

## 8. 오류 응답
### 401 Unauthorized
```json
{
  "detail": "Authentication required."
}
```

### 404 Not Found
```json
{
  "detail": "Knowledge space not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to load knowledge space detail."
}
```

## 9. 백엔드 구현 가이드
### 예상 스키마 파일
- `apps/api/app/schemas/knowledge_spaces.py`

### 권장 Pydantic 모델
```python
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

KnowledgeSpaceStatus = Literal["active", "indexing", "error", "archived"]

class KnowledgeSpaceDetailHeader(BaseModel):
    id: str
    name: str
    owner_team: str
    contact_name: str
    status: KnowledgeSpaceStatus
    visibility: str
    doc_count: int
    last_updated_at: datetime
    last_updated_relative: str

class KnowledgeSpaceTopicItem(BaseModel):
    id: str
    text: str

class KnowledgeSpaceRuleItem(BaseModel):
    id: str
    text: str

class KnowledgeSpaceLinkedDocumentItem(BaseModel):
    id: str
    target_type: Literal["document"]
    target_id: str
    label: str
    hint: str

class KnowledgeSpaceDetailResponse(BaseModel):
    space: KnowledgeSpaceDetailHeader
    overview: str
    stewardship: str
    coverage_topics: list[KnowledgeSpaceTopicItem]
    operating_rules: list[KnowledgeSpaceRuleItem]
    linked_documents: list[KnowledgeSpaceLinkedDocumentItem]
```

### 권장 라우트 파일
- `apps/api/app/api/routes/knowledge_spaces.py`

### 권장 서비스 책임
- `knowledge_space_id`와 사용자 권한 기준 단건 조회
- 공간 메타데이터 및 `doc_count` 집계
- `overview`, `stewardship`, `coverage_topics`, `operating_rules` 생성 또는 저장값 조회
- 연결 문서 매핑
- `last_updated_relative` 계산

## 10. 프론트엔드 타입 가이드
`packages/types/src/index.ts`에 최소 아래 타입 추가를 권장한다.

```ts
export type KnowledgeSpaceStatus = "active" | "indexing" | "error" | "archived";

export interface KnowledgeSpaceDetailHeaderDto {
  id: string;
  name: string;
  owner_team: string;
  contact_name: string;
  status: KnowledgeSpaceStatus;
  visibility: string;
  doc_count: number;
  last_updated_at: string;
  last_updated_relative: string;
}

export interface KnowledgeSpaceTopicItemDto {
  id: string;
  text: string;
}

export interface KnowledgeSpaceRuleItemDto {
  id: string;
  text: string;
}

export interface KnowledgeSpaceLinkedDocumentItemDto {
  id: string;
  target_type: "document";
  target_id: string;
  label: string;
  hint: string;
}

export interface KnowledgeSpaceDetailResponse {
  space: KnowledgeSpaceDetailHeaderDto;
  overview: string;
  stewardship: string;
  coverage_topics: KnowledgeSpaceTopicItemDto[];
  operating_rules: KnowledgeSpaceRuleItemDto[];
  linked_documents: KnowledgeSpaceLinkedDocumentItemDto[];
}
```

## 11. 프론트 매핑 기준
현재 [knowledge-spaces/[knowledgeSpaceId]/page.tsx](/D:/myhome/RockASK/apps/web/app/knowledge-spaces/[knowledgeSpaceId]/page.tsx)는 아래 매핑으로 바로 전환할 수 있다.
- 제목 <- `space.name`
- 공간 개요 <- `overview`
- 운영 설명 <- `stewardship`
- 다루는 주제 <- `coverage_topics`
- 운영 원칙 <- `operating_rules`
- 연결 문서 <- `linked_documents`

우측 공간 정보 카드는 프론트에서 아래 값을 조합해 파생할 수 있다.
- 운영 팀 <- `space.owner_team`
- 문의 담당 <- `space.contact_name`
- 공개 범위 <- `space.visibility`
- 최근 갱신 <- `space.last_updated_relative`
- 상태 pill <- `space.status`

링크 생성 규칙은 프론트에서 처리한다.
- `target_type=document` -> `appRoutes.documentDetail(target_id)`

상단 metric 카드는 프론트에서 다음처럼 파생 계산할 수 있다.
- 문서 수 <- `space.doc_count`
- 운영 팀 <- `space.owner_team`
- 최근 갱신 <- `space.last_updated_relative`

## 12. 완료 기준
- `GET /api/v1/knowledge-spaces/{knowledge_space_id}` 계약이 문서와 코드 타입에 반영된다.
- FastAPI schema와 route skeleton이 추가된다.
- `packages/types`에 공용 DTO 타입이 추가된다.
- 프론트가 mock 상세 생성 로직 없이 이 응답 구조를 읽을 수 있는 수준까지 계약이 고정된다.

## 13. 비범위
이번 티켓에는 아래 항목을 포함하지 않는다.
- 지식 공간 내 문서 목록 전체 응답
- 지식 공간 생성/수정/삭제
- 운영자 전용 감사 로그
- 권한 정책 편집 기능
- linked document 외의 연관 entity 타입 확장