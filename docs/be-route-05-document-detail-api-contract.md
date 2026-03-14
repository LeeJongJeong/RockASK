# BE-ROUTE-05 Document Detail API Contract

## 문서 정보
- 티켓: `BE-ROUTE-05`
- 스프린트: `Sprint 1`
- 상태: `Draft`
- 대상 화면: `apps/web/app/documents/[documentId]/page.tsx`
- 관련 선행 티켓: 없음
- 관련 후속 티켓: `FE-API-01`, `FE-API-02`

## 1. 목적
`/documents/{documentId}` 화면에서 현재 mock 기반으로 표시 중인 문서 개요, 핵심 변경점, 추천 질문, 관련 화면 링크를 실제 API 응답으로 대체하기 위한 계약이다.

이 API는 다음 요구를 충족해야 한다.
- 현재 로그인 사용자가 접근 가능한 문서만 반환한다.
- 문서 제목, 소유 팀, 공개 범위, 최신 상태, 최근 갱신 시각을 함께 반환한다.
- 상세 화면 본문에 바로 렌더링할 수 있는 개요/변경점/추천 질문을 제공한다.
- 관련 링크는 UI 경로가 아니라 도메인 식별자 기준으로 반환한다.
- 문서 본문 전체를 내려주지 않더라도, 상세 화면과 후속 질의 시작에 필요한 핵심 정보는 포함해야 한다.

## 2. 엔드포인트 개요
- Method: `GET`
- Path: `/api/v1/documents/{document_id}`
- Auth: 필수
- Content-Type: `application/json`
- Cache: `no-store` 권장

## 3. 요청 계약
### Path Parameters
| 이름 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| `document_id` | string | 예 | `1 <= length <= 120` | 조회 대상 문서 식별자 |

### Query Parameters
없음

### Request Example
```http
GET /api/v1/documents/update-security HTTP/1.1
Accept: application/json
Authorization: Bearer <token>
```

## 4. 응답 계약
### 200 OK
```json
{
  "document": {
    "id": "update-security",
    "title": "보안 점검 체크리스트 v3",
    "owner_team": "보안팀",
    "visibility": "전사 공개",
    "status": "approved",
    "updated_at": "2026-03-14T14:12:00+09:00",
    "updated_relative": "18분 전",
    "summary": "보안 점검 체크리스트 v3는 배포 전후 필수 확인 항목과 테스트 예외 규칙을 함께 정리한 문서입니다."
  },
  "overview": "보안 점검 체크리스트 v3는 배포 전후 필수 확인 항목과 테스트 예외 규칙을 함께 정리한 문서입니다.",
  "highlights": [
    {
      "id": "highlight-1",
      "text": "민감 권한 점검 항목이 추가되었습니다."
    },
    {
      "id": "highlight-2",
      "text": "테스트 환경 예외 규칙이 별도 섹션으로 분리되었습니다."
    },
    {
      "id": "highlight-3",
      "text": "검수 완료 후 운영 반영 시 확인해야 할 승인 흐름이 명확해졌습니다."
    }
  ],
  "recommended_questions": [
    {
      "id": "rq-1",
      "text": "이번 버전에서 꼭 달라진 항목만 요약해 줘"
    },
    {
      "id": "rq-2",
      "text": "배포 전에 확인해야 하는 체크포인트만 뽑아 줘"
    },
    {
      "id": "rq-3",
      "text": "예외 허용 조건을 정책 문장 기준으로 설명해 줘"
    }
  ],
  "related_links": [
    {
      "id": "rel-1",
      "target_type": "knowledge_space",
      "target_id": "ks-strategy",
      "label": "2026 상반기 사업 계획",
      "hint": "전사 공통 정책이 모여 있는 공간"
    },
    {
      "id": "rel-2",
      "target_type": "knowledge_space",
      "target_id": "ks-engineering",
      "label": "기술 개발 본부 가이드라인",
      "hint": "운영/배포와 함께 보는 문서 공간"
    }
  ]
}
```

### Response Schema
#### Root
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `document` | `DocumentDetailHeader` | 예 | 문서 헤더 및 메타데이터 |
| `overview` | string | 예 | 문서 개요 |
| `highlights` | array[`DocumentHighlightItem`] | 예 | 문서 핵심 변경점 |
| `recommended_questions` | array[`DocumentRecommendedQuestionItem`] | 예 | 이 문서 기준으로 바로 던질 추천 질문 |
| `related_links` | array[`DocumentRelatedLinkItem`] | 예 | 관련 지식 공간/채팅/문서 링크 |

#### DocumentDetailHeader
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | 문서 식별자 |
| `title` | string | 예 | 문서 제목 |
| `owner_team` | string | 예 | 문서 소유 팀 |
| `visibility` | string | 예 | 문서 공개 범위 라벨 |
| `status` | `draft \| indexing \| approved \| archived \| error` | 예 | 문서 상태 |
| `updated_at` | string(datetime) | 예 | 최근 갱신 시각 |
| `updated_relative` | string | 예 | UI 즉시 사용용 상대 시각 문자열 |
| `summary` | string | 예 | 문서 한 줄 요약 |

#### DocumentHighlightItem
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | 변경점 식별자 |
| `text` | string | 예 | 핵심 변경점 문장 |

#### DocumentRecommendedQuestionItem
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | 추천 질문 식별자 |
| `text` | string | 예 | 검색창에 바로 넣을 추천 질문 |

#### DocumentRelatedLinkItem
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | related row 식별자 |
| `target_type` | `knowledge_space \| chat \| document` | 예 | 연결 대상 종류 |
| `target_id` | string | 예 | 상세 화면 연결용 도메인 식별자 |
| `label` | string | 예 | 화면 표시용 이름 |
| `hint` | string | 예 | 보조 설명 |

## 5. 표시 규칙
- `overview`는 본문 상단 카드에서 바로 보여 줄 수 있는 길이의 정제된 텍스트여야 한다.
- `highlights`는 중요도 순으로 반환한다.
- `recommended_questions`는 사용자가 복붙해 바로 질문할 수 있는 문장 형태여야 한다.
- `related_links`는 문서 상세 우측 사이드바에 표시할 순서대로 반환한다.
- `summary`와 `overview`가 완전히 같아도 허용하지만, 목적은 다르다.
  - `summary`: 목록/메타데이터용 짧은 요약
  - `overview`: 상세 본문용 설명

## 6. 상태 값 정의
| 값 | 의미 | 상세 기본 노출 여부 |
| --- | --- | --- |
| `draft` | 초안 상태, 아직 확정되지 않음 | 조건부 노출 |
| `indexing` | 색인 중 | 노출 |
| `approved` | 승인 완료, 일반 조회 가능 | 노출 |
| `archived` | 보관 상태 | 조건부 노출 |
| `error` | 색인/동기화 오류 상태 | 노출 |

## 7. 권한 규칙
- 현재 로그인 사용자가 접근 가능한 문서만 조회 가능하다.
- 권한이 없는 문서, 삭제된 문서, 식별자가 잘못된 문서는 `404 Not Found`로 응답한다.
- `draft` 또는 `archived` 문서는 사용자 권한 정책에 따라 반환 여부가 달라질 수 있다.
- 응답에는 문서 본문 전체 대신 상세 화면에 필요한 정제 정보만 포함한다. 권한 범위를 벗어나는 원문 일부도 포함되면 안 된다.

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
  "detail": "Document not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to load document detail."
}
```

## 9. 백엔드 구현 가이드
### 예상 스키마 파일
- `apps/api/app/schemas/documents.py`

### 권장 Pydantic 모델
```python
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

DocumentStatus = Literal["draft", "indexing", "approved", "archived", "error"]
DocumentRelatedTargetType = Literal["knowledge_space", "chat", "document"]

class DocumentDetailHeader(BaseModel):
    id: str
    title: str
    owner_team: str
    visibility: str
    status: DocumentStatus
    updated_at: datetime
    updated_relative: str
    summary: str

class DocumentHighlightItem(BaseModel):
    id: str
    text: str

class DocumentRecommendedQuestionItem(BaseModel):
    id: str
    text: str

class DocumentRelatedLinkItem(BaseModel):
    id: str
    target_type: DocumentRelatedTargetType
    target_id: str
    label: str
    hint: str

class DocumentDetailResponse(BaseModel):
    document: DocumentDetailHeader
    overview: str
    highlights: list[DocumentHighlightItem]
    recommended_questions: list[DocumentRecommendedQuestionItem]
    related_links: list[DocumentRelatedLinkItem]
```

### 권장 라우트 파일
- `apps/api/app/api/routes/documents.py`

### 권장 서비스 책임
- `document_id`와 사용자 권한 기준 단건 조회
- 문서 상태/소유 팀/공개 범위 조립
- `overview`, `highlights`, `recommended_questions` 생성 또는 저장값 조회
- 관련 링크 대상 문서/지식 공간/채팅 매핑
- `updated_relative` 계산

## 10. 프론트엔드 타입 가이드
`packages/types/src/index.ts`에 최소 아래 타입 추가를 권장한다.

```ts
export type DocumentStatus = "draft" | "indexing" | "approved" | "archived" | "error";
export type DocumentRelatedTargetType = "knowledge_space" | "chat" | "document";

export interface DocumentDetailHeaderDto {
  id: string;
  title: string;
  owner_team: string;
  visibility: string;
  status: DocumentStatus;
  updated_at: string;
  updated_relative: string;
  summary: string;
}

export interface DocumentHighlightItemDto {
  id: string;
  text: string;
}

export interface DocumentRecommendedQuestionItemDto {
  id: string;
  text: string;
}

export interface DocumentRelatedLinkItemDto {
  id: string;
  target_type: DocumentRelatedTargetType;
  target_id: string;
  label: string;
  hint: string;
}

export interface DocumentDetailResponse {
  document: DocumentDetailHeaderDto;
  overview: string;
  highlights: DocumentHighlightItemDto[];
  recommended_questions: DocumentRecommendedQuestionItemDto[];
  related_links: DocumentRelatedLinkItemDto[];
}
```

## 11. 프론트 매핑 기준
현재 [documents/[documentId]/page.tsx](/D:/myhome/RockASK/apps/web/app/documents/[documentId]/page.tsx)는 아래 매핑으로 바로 전환할 수 있다.
- 제목 <- `document.title`
- 문서 개요 <- `overview`
- 핵심 변경점 <- `highlights`
- 추천 질문 <- `recommended_questions`
- 관련 화면 <- `related_links`

우측 메타데이터 카드는 프론트에서 아래 값을 조합해 파생할 수 있다.
- 소유 팀 <- `document.owner_team`
- 공개 범위 <- `document.visibility`
- 최근 갱신 <- `document.updated_relative`
- 문서 상태 <- `document.status`

링크 생성 규칙은 프론트에서 처리한다.
- `target_type=knowledge_space` -> `appRoutes.knowledgeSpaceDetail(target_id)`
- `target_type=chat` -> `appRoutes.chatDetail(target_id)`
- `target_type=document` -> `appRoutes.documentDetail(target_id)`

## 12. 완료 기준
- `GET /api/v1/documents/{document_id}` 계약이 문서와 코드 타입에 반영된다.
- FastAPI schema와 route skeleton이 추가된다.
- `packages/types`에 공용 DTO 타입이 추가된다.
- 프론트가 mock 문서 상세 생성 로직 없이 이 응답 구조를 읽을 수 있는 수준까지 계약이 고정된다.

## 13. 비범위
이번 티켓에는 아래 항목을 포함하지 않는다.
- 문서 본문 전체 다운로드
- 파일 attachment 다운로드 링크
- 문서 수정/승인 워크플로우
- 버전 diff 상세 화면
- chunk 단위 원문 하이라이트