# BE-ROUTE-03 Knowledge Space List API Contract

## 문서 정보
- 티켓: `BE-ROUTE-03`
- 스프린트: `Sprint 1`
- 상태: `Draft`
- 대상 화면: `apps/web/app/knowledge-spaces/page.tsx`
- 관련 후속 티켓: `BE-ROUTE-04`, `FE-API-01`, `FE-API-02`

## 1. 목적
`/knowledge-spaces` 화면에서 현재 mock 기반으로 표시 중인 지식 공간 목록과 운영 현황을 실제 API 응답으로 대체하기 위한 계약이다.

이 API는 다음 요구를 충족해야 한다.
- 현재 로그인 사용자가 접근 가능한 지식 공간만 반환한다.
- 팀별 지식 공간 목록을 최근 갱신 순서 또는 운영 우선순위 기준으로 반환한다.
- 목록 카드 렌더링에 필요한 이름, 운영 팀, 문의 담당, 상태, 공개 범위, 문서 수, 최근 갱신 시각을 제공한다.
- 후속 상세 API(`GET /api/v1/knowledge-spaces/{id}`)와 동일한 `knowledge_space_id` 체계를 사용한다.
- 목록 화면 우측 요약 카드에서 파생 계산할 수 있도록 item 레벨 숫자 필드를 제공한다.

## 2. 엔드포인트 개요
- Method: `GET`
- Path: `/api/v1/knowledge-spaces`
- Auth: 필수
- Content-Type: `application/json`
- Cache: `no-store` 권장

## 3. 요청 계약
### Query Parameters
| 이름 | 타입 | 필수 | 기본값 | 제약 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `limit` | integer | 아니오 | `20` | `1 <= limit <= 50` | 한 번에 가져올 지식 공간 수 |
| `cursor` | string | 아니오 | `null` | opaque string | 다음 페이지 조회용 커서 |
| `status` | string | 아니오 | `null` | `active`, `indexing`, `error`, `archived` 중 하나 | 특정 상태만 필터링 |
| `visibility` | string | 아니오 | `null` | 구현체 정의 | 공개 범위별 필터링 |

### Request Example
```http
GET /api/v1/knowledge-spaces?limit=20 HTTP/1.1
Accept: application/json
Authorization: Bearer <token>
```

## 4. 응답 계약
### 200 OK
```json
{
  "items": [
    {
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
    {
      "id": "ks-engineering",
      "name": "기술 개발 본부 가이드라인",
      "owner_team": "플랫폼개발팀",
      "contact_name": "김OO",
      "status": "indexing",
      "visibility": "팀 공개",
      "doc_count": 12,
      "last_updated_at": "2026-03-14T14:55:00+09:00",
      "last_updated_relative": "방금 전"
    }
  ],
  "next_cursor": null
}
```

### Response Schema
#### Root
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `items` | array[`KnowledgeSpaceListItem`] | 예 | 지식 공간 목록 |
| `next_cursor` | string \| null | 예 | 다음 페이지가 없으면 `null` |

#### KnowledgeSpaceListItem
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

## 5. 정렬/페이징 규칙
- 기본 정렬은 `last_updated_at desc, id desc` 이다.
- `cursor` 기반 페이지네이션을 사용한다.
- `cursor`는 최소한 다음 정보를 인코딩해야 한다.
  - `last_updated_at`
  - `id`
- 같은 시각의 데이터가 있어도 `id`를 보조 정렬 키로 사용해 중복/누락 없이 이어져야 한다.

## 6. 상태 값 정의
| 값 | 의미 | 목록 기본 노출 여부 |
| --- | --- | --- |
| `active` | 정상 운영 중인 공간 | 노출 |
| `indexing` | 문서 색인 또는 동기화 진행 중 | 노출 |
| `error` | 색인/동기화 오류 상태 | 노출 |
| `archived` | 보관 상태 | 기본 비노출 |

## 7. 권한 규칙
- 현재 로그인 사용자가 접근 가능한 지식 공간만 반환한다.
- 권한이 없는 공간, 삭제된 공간은 목록에서 제외한다.
- `status=archived`를 명시하지 않으면 보관 공간은 기본 반환 대상에서 제외한다.
- 공개 범위 문자열은 내부 권한 코드가 아니라 UI 표시용 라벨이어야 한다.

## 8. 오류 응답
### 401 Unauthorized
```json
{
  "detail": "Authentication required."
}
```

### 403 Forbidden
```json
{
  "detail": "Access denied."
}
```

### 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "loc": ["query", "limit"],
      "msg": "Input should be less than or equal to 50",
      "type": "less_than_equal"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to load knowledge space list."
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

class KnowledgeSpaceListItem(BaseModel):
    id: str
    name: str
    owner_team: str
    contact_name: str
    status: KnowledgeSpaceStatus
    visibility: str
    doc_count: int
    last_updated_at: datetime
    last_updated_relative: str

class KnowledgeSpaceListResponse(BaseModel):
    items: list[KnowledgeSpaceListItem]
    next_cursor: str | None
```

### 권장 라우트 파일
- `apps/api/app/api/routes/knowledge_spaces.py`

### 권장 서비스 책임
- 현재 사용자 기준 접근 가능한 지식 공간 목록 조회
- `last_updated_at desc, id desc` 정렬
- cursor encode/decode
- `doc_count` 집계
- `last_updated_relative` 계산
- 공개 범위 코드를 UI 라벨로 변환

## 10. 프론트엔드 타입 가이드
`packages/types/src/index.ts`에 최소 아래 타입 추가를 권장한다.

```ts
export type KnowledgeSpaceStatus = "active" | "indexing" | "error" | "archived";

export interface KnowledgeSpaceListItemDto {
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

export interface KnowledgeSpaceListResponse {
  items: KnowledgeSpaceListItemDto[];
  next_cursor: string | null;
}
```

## 11. 프론트 매핑 기준
현재 [knowledge-spaces/page.tsx](/D:/myhome/RockASK/apps/web/app/knowledge-spaces/page.tsx)는 아래 필드가 있으면 즉시 대체 가능하다.
- `id`
- `name`
- `owner_team`
- `contact_name`
- `status`
- `visibility`
- `doc_count`
- `last_updated_relative`

우측 요약 카드는 프론트에서 아래처럼 파생 계산할 수 있다.
- 운영 중 공간 수 <- `status === "active"`
- 색인 중 공간 수 <- `status === "indexing"`
- 노출 문서 수 <- `sum(doc_count)`

추가로 `last_updated_at`이 있으면 정렬/새로고침 판단에 활용할 수 있다.

## 12. 완료 기준
- `GET /api/v1/knowledge-spaces` 계약이 문서와 코드 타입에 반영된다.
- FastAPI schema와 route skeleton이 추가된다.
- `packages/types`에 공용 DTO 타입이 추가된다.
- 프론트가 mock `knowledgeSpaces` 대신 이 응답 구조를 읽을 수 있는 수준까지 계약이 고정된다.

## 13. 비범위
이번 티켓에는 아래 항목을 포함하지 않는다.
- 지식 공간 상세 개요/운영 원칙
- 지식 공간 생성/수정/삭제
- 문서 목록 내장 응답
- 정렬 옵션 UI 확장
- 관리자 전용 운영 메타데이터