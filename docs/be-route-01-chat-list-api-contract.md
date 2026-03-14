# BE-ROUTE-01 Chat List API Contract

## 문서 정보
- 티켓: `BE-ROUTE-01`
- 스프린트: `Sprint 1`
- 상태: `Draft`
- 대상 화면: `apps/web/app/chats/page.tsx`
- 관련 후속 티켓: `BE-ROUTE-02`, `FE-API-01`, `FE-API-02`

## 1. 목적
`/chats` 화면에서 최근 대화 목록을 mock 데이터가 아닌 실제 API 응답으로 렌더링하기 위한 계약이다.

이 API는 다음 요구를 충족해야 한다.
- 현재 로그인 사용자가 접근 가능한 채팅만 반환한다.
- 최근 활동 순서로 정렬된 채팅 목록을 반환한다.
- 목록 카드 렌더링에 필요한 제목, 연결 어시스턴트, 마지막 메시지 시각, 상태를 제공한다.
- 후속 상세 API(`GET /api/v1/chats/{chat_id}`)와 동일한 `chat_id` 체계를 사용한다.

## 2. 엔드포인트 개요
- Method: `GET`
- Path: `/api/v1/chats`
- Auth: 필수
- Content-Type: `application/json`
- Cache: `no-store` 권장

## 3. 요청 계약
### Query Parameters
| 이름 | 타입 | 필수 | 기본값 | 제약 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `limit` | integer | 아니오 | `20` | `1 <= limit <= 50` | 한 번에 가져올 채팅 수 |
| `cursor` | string | 아니오 | `null` | opaque string | 다음 페이지 조회용 커서 |
| `status` | string | 아니오 | `null` | `ready`, `processing`, `archived`, `error` 중 하나 | 특정 상태만 필터링 |

### Request Example
```http
GET /api/v1/chats?limit=20 HTTP/1.1
Accept: application/json
Authorization: Bearer <token>
```

## 4. 응답 계약
### 200 OK
```json
{
  "items": [
    {
      "id": "chat-1",
      "title": "신입 입사자 온보딩 문서와 첫 주 일정을 정리해 줘",
      "assistant_name": "정책 안내 어시스턴트",
      "last_message_preview": "첫 주에는 계정 발급, 보안 서약, 필수 협업 툴 접속 확인을 먼저 진행하면 됩니다.",
      "last_message_at": "2026-03-14T10:30:00+09:00",
      "last_message_relative": "오늘 10:30",
      "status": "ready"
    },
    {
      "id": "chat-2",
      "title": "최근 운영 변경 사항을 백업 절차 관점으로 요약해 줘",
      "assistant_name": "기술 문서 어시스턴트",
      "last_message_preview": "정기 백업 주기와 복구 테스트 기준으로 우선 확인하면 됩니다.",
      "last_message_at": "2026-03-13T16:20:00+09:00",
      "last_message_relative": "어제",
      "status": "ready"
    }
  ],
  "next_cursor": "eyJsYXN0X21lc3NhZ2VfYXQiOiIyMDI2LTAzLTEzVDE2OjIwOjAwKzA5OjAwIiwiaWQiOiJjaGF0LTIifQ=="
}
```

### Response Schema
#### Root
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `items` | array[`ChatListItem`] | 예 | 최근 활동 순으로 정렬된 채팅 목록 |
| `next_cursor` | string \| null | 예 | 다음 페이지가 없으면 `null` |

#### ChatListItem
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | 채팅 식별자. 상세 API의 `chat_id`와 동일 |
| `title` | string | 예 | 채팅 목록 카드 제목 |
| `assistant_name` | string | 예 | 마지막 응답 기준 대표 어시스턴트 이름 |
| `last_message_preview` | string \| null | 예 | 마지막 메시지 미리보기. 없는 경우 `null` |
| `last_message_at` | string(datetime) | 예 | ISO 8601 형식의 마지막 메시지 시각 |
| `last_message_relative` | string | 예 | UI 즉시 사용용 상대 시각 문자열 |
| `status` | `ready \| processing \| archived \| error` | 예 | 현재 채팅 상태 |

## 5. 정렬/페이징 규칙
- 기본 정렬은 `last_message_at desc, id desc` 이다.
- `cursor` 기반 페이지네이션을 사용한다.
- `cursor`는 최소한 다음 정보를 인코딩해야 한다.
  - `last_message_at`
  - `id`
- 같은 시각의 데이터가 있어도 `id`를 보조 정렬 키로 사용해 중복/누락 없이 이어져야 한다.

## 6. 상태 값 정의
| 값 | 의미 | 목록 기본 노출 여부 |
| --- | --- | --- |
| `ready` | 대화를 정상적으로 다시 열 수 있는 상태 | 노출 |
| `processing` | 마지막 질의에 대한 답변 생성 중 | 노출 |
| `archived` | 보관 처리된 대화 | 기본 비노출 |
| `error` | 마지막 처리 실패 또는 복구 필요 | 노출 |

## 7. 권한 규칙
- 현재 로그인 사용자 본인의 채팅만 반환한다.
- 다른 사용자의 채팅은 `cursor` 조합으로도 노출되면 안 된다.
- 삭제되었거나 권한이 제거된 채팅은 목록에서 제외한다.
- `status=archived`를 명시하지 않으면 보관 채팅은 기본 반환 대상에서 제외한다.

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
  "detail": "Failed to load chat list."
}
```

## 9. 백엔드 구현 가이드
### 예상 스키마 파일
- `apps/api/app/schemas/chats.py`

### 권장 Pydantic 모델
```python
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ChatStatus = Literal["ready", "processing", "archived", "error"]

class ChatListItem(BaseModel):
    id: str
    title: str
    assistant_name: str
    last_message_preview: str | None
    last_message_at: datetime
    last_message_relative: str
    status: ChatStatus

class ChatListResponse(BaseModel):
    items: list[ChatListItem]
    next_cursor: str | None
```

### 권장 라우트 파일
- `apps/api/app/api/routes/chats.py`

### 권장 서비스 책임
- 현재 사용자 기준 목록 조회
- `last_message_at desc, id desc` 정렬
- cursor encode/decode
- `last_message_relative` 계산

## 10. 프론트엔드 타입 가이드
`packages/types/src/index.ts`에 최소 아래 타입 추가를 권장한다.

```ts
export type ChatStatus = "ready" | "processing" | "archived" | "error";

export interface ChatListItemDto {
  id: string;
  title: string;
  assistant_name: string;
  last_message_preview: string | null;
  last_message_at: string;
  last_message_relative: string;
  status: ChatStatus;
}

export interface ChatListResponse {
  items: ChatListItemDto[];
  next_cursor: string | null;
}
```

## 11. 프론트 매핑 기준
현재 [chats/page.tsx](/D:/myhome/RockASK/apps/web/app/chats/page.tsx)는 다음 필드가 있으면 즉시 대체 가능하다.
- `id`
- `title`
- `assistant_name`
- `last_message_relative`
- `status`

추가로 `last_message_preview`가 있으면 현재 목록 카드 설명 영역을 더 실제 데이터답게 바꿀 수 있다.

## 12. 완료 기준
- `GET /api/v1/chats` 계약이 문서와 코드 타입에 반영된다.
- FastAPI schema와 route skeleton이 추가된다.
- `packages/types`에 공용 DTO 타입이 추가된다.
- 프론트가 mock `recentChats` 대신 이 응답 구조를 읽을 수 있는 수준까지 계약이 고정된다.

## 13. 비범위
이번 티켓에는 아래 항목을 포함하지 않는다.
- 채팅 상세 transcript 구조
- 메시지 본문 전체 조회
- 채팅 제목 수정/삭제
- 무한 스크롤 UI 구현
- 즐겨찾기, pin, unread 개념 추가