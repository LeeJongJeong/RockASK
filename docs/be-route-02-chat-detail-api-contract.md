# BE-ROUTE-02 Chat Detail API Contract

## 문서 정보
- 티켓: `BE-ROUTE-02`
- 스프린트: `Sprint 1`
- 상태: `Draft`
- 대상 화면: `apps/web/app/chats/[chatId]/page.tsx`
- 관련 선행 티켓: `BE-ROUTE-01`
- 관련 후속 티켓: `FE-API-01`, `FE-API-02`

## 1. 목적
`/chats/{chatId}` 화면에서 현재 mock 기반으로 표시 중인 대화 요약, 답변 스냅샷, 메시지 흐름, 참조 문서, 후속 질문을 실제 API 응답으로 대체하기 위한 계약이다.

이 API는 다음 요구를 충족해야 한다.
- 현재 로그인 사용자가 접근 가능한 단일 채팅만 반환한다.
- 채팅 제목, 대표 어시스턴트, 마지막 활동 상태를 함께 반환한다.
- 화면 본문에서 바로 렌더링할 수 있는 메시지 목록과 요약 정보를 제공한다.
- 참조 문서/지식 공간은 UI 경로가 아니라 도메인 식별자 기준으로 반환한다.
- `GET /api/v1/chats` 목록 응답과 동일한 `chat_id` 체계를 사용한다.

## 2. 엔드포인트 개요
- Method: `GET`
- Path: `/api/v1/chats/{chat_id}`
- Auth: 필수
- Content-Type: `application/json`
- Cache: `no-store` 권장

## 3. 요청 계약
### Path Parameters
| 이름 | 타입 | 필수 | 제약 | 설명 |
| --- | --- | --- | --- | --- |
| `chat_id` | string | 예 | `1 <= length <= 120` | 조회 대상 채팅 식별자 |

### Query Parameters
없음

### Request Example
```http
GET /api/v1/chats/chat-1 HTTP/1.1
Accept: application/json
Authorization: Bearer <token>
```

## 4. 응답 계약
### 200 OK
```json
{
  "chat": {
    "id": "chat-1",
    "title": "신입 입사자 온보딩 문서와 첫 주 일정을 정리해 줘",
    "assistant_name": "정책 안내 어시스턴트",
    "status": "ready",
    "created_at": "2026-03-14T10:24:00+09:00",
    "last_message_at": "2026-03-14T10:30:00+09:00",
    "last_message_relative": "오늘 10:30"
  },
  "summary": "신입 입사자의 첫 주 일정, 필수 교육, 계정 발급 순서를 한 번에 묶어 달라는 요청입니다.",
  "answer_snapshot": "온보딩 답변은 첫날 준비, 첫 주 체크리스트, 누락 시 확인할 담당 팀 순서로 정리하는 것이 가장 재사용성이 높습니다.",
  "messages": [
    {
      "id": "msg-101",
      "role": "user",
      "content": "신입 입사자 온보딩 문서와 필수 교육 일정을 한 번에 정리해 줘.",
      "created_at": "2026-03-14T10:24:00+09:00",
      "note": null
    },
    {
      "id": "msg-102",
      "role": "assistant",
      "content": "첫날에는 계정 발급, 보안 서약, 필수 협업 툴 접속 확인을 우선 진행하고 첫 주 안에 온보딩 교육 일정을 마치는 흐름으로 정리할 수 있습니다.",
      "created_at": "2026-03-14T10:25:00+09:00",
      "note": "온보딩 체크리스트와 인사 교육 일정 문서를 근거로 요약"
    }
  ],
  "sources": [
    {
      "id": "source-1",
      "source_type": "document",
      "target_id": "update-onboarding",
      "label": "신입 입사자 온보딩 안내",
      "hint": "첫 주 일정과 필수 서류 목록"
    },
    {
      "id": "source-2",
      "source_type": "knowledge_space",
      "target_id": "ks-strategy",
      "label": "사업 계획/공용 안내 공간",
      "hint": "팀 합류 전 공유되는 공통 가이드와 업무 맥락"
    }
  ],
  "follow_ups": [
    {
      "id": "followup-1",
      "text": "첫날 해야 하는 일만 체크리스트 형식으로 다시 정리해 줘"
    },
    {
      "id": "followup-2",
      "text": "개발 직군 기준으로 필요한 시스템 권한만 따로 뽑아 줘"
    },
    {
      "id": "followup-3",
      "text": "교육 일정과 담당 팀을 표로 만들어 줘"
    }
  ]
}
```

### Response Schema
#### Root
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `chat` | `ChatDetailHeader` | 예 | 채팅 헤더 정보 |
| `summary` | string | 예 | 사용자가 무엇을 요청했는지에 대한 요약 |
| `answer_snapshot` | string | 예 | 대표 답변 스냅샷 |
| `messages` | array[`ChatMessageItem`] | 예 | 시간순 정렬된 대화 메시지 목록 |
| `sources` | array[`ChatSourceItem`] | 예 | 이 대화에서 참조한 문서/지식 공간 |
| `follow_ups` | array[`ChatFollowUpItem`] | 예 | 같은 맥락에서 이어서 물어볼 질문 |

#### ChatDetailHeader
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | 채팅 식별자 |
| `title` | string | 예 | 채팅 제목 |
| `assistant_name` | string | 예 | 대표 어시스턴트 이름 |
| `status` | `ready \| processing \| archived \| error` | 예 | 현재 채팅 상태 |
| `created_at` | string(datetime) | 예 | 채팅 생성 시각 |
| `last_message_at` | string(datetime) | 예 | 마지막 메시지 시각 |
| `last_message_relative` | string | 예 | UI 즉시 사용용 상대 시각 문자열 |

#### ChatMessageItem
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | 메시지 식별자 |
| `role` | `user \| assistant` | 예 | 렌더링용 메시지 역할 |
| `content` | string | 예 | 메시지 본문 |
| `created_at` | string(datetime) | 예 | 메시지 생성 시각 |
| `note` | string \| null | 예 | 요약 근거/보조 메모. 없으면 `null` |

#### ChatSourceItem
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | source row 식별자 |
| `source_type` | `document \| knowledge_space` | 예 | 참조 대상 종류 |
| `target_id` | string | 예 | 상세 화면 연결용 도메인 식별자 |
| `label` | string | 예 | 화면 표시용 이름 |
| `hint` | string | 예 | 보조 설명 |

#### ChatFollowUpItem
| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string | 예 | 후속 질문 식별자 |
| `text` | string | 예 | 후속 질문 문장 |

## 5. 정렬 및 표시 규칙
- `messages`는 `created_at asc, id asc` 순으로 반환한다.
- UI에 보여 주지 않는 internal/system 메시지는 포함하지 않는다.
- `summary`와 `answer_snapshot`은 최신 assistant 응답만 그대로 복사한 값이 아니라, 상세 화면 상단 카드에 쓸 수 있도록 정제된 텍스트여야 한다.
- `sources`는 화면 우측 사이드바 노출 순서대로 반환한다.
- `follow_ups`는 추천 우선순위 순서대로 반환한다.

## 6. 권한 규칙
- 현재 로그인 사용자 본인의 채팅만 조회 가능하다.
- 다른 사용자의 채팅 ID를 넣어도 존재 여부를 노출하지 않기 위해 `404 Not Found`로 응답한다.
- 삭제된 채팅, 접근 권한이 제거된 채팅, 내부 테스트 채팅은 조회 대상에서 제외한다.

## 7. 오류 응답
### 401 Unauthorized
```json
{
  "detail": "Authentication required."
}
```

### 404 Not Found
```json
{
  "detail": "Chat not found."
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to load chat detail."
}
```

## 8. 백엔드 구현 가이드
### 예상 스키마 파일
- `apps/api/app/schemas/chats.py`

### 권장 Pydantic 모델
```python
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

ChatStatus = Literal["ready", "processing", "archived", "error"]
ChatMessageRole = Literal["user", "assistant"]
ChatSourceType = Literal["document", "knowledge_space"]

class ChatDetailHeader(BaseModel):
    id: str
    title: str
    assistant_name: str
    status: ChatStatus
    created_at: datetime
    last_message_at: datetime
    last_message_relative: str

class ChatMessageItem(BaseModel):
    id: str
    role: ChatMessageRole
    content: str
    created_at: datetime
    note: str | None

class ChatSourceItem(BaseModel):
    id: str
    source_type: ChatSourceType
    target_id: str
    label: str
    hint: str

class ChatFollowUpItem(BaseModel):
    id: str
    text: str

class ChatDetailResponse(BaseModel):
    chat: ChatDetailHeader
    summary: str
    answer_snapshot: str
    messages: list[ChatMessageItem]
    sources: list[ChatSourceItem]
    follow_ups: list[ChatFollowUpItem]
```

### 권장 라우트 파일
- `apps/api/app/api/routes/chats.py`

### 권장 서비스 책임
- `chat_id`와 사용자 ID 기준 단건 조회
- 메시지 목록과 대표 assistant 정보 조립
- `summary`, `answer_snapshot` 생성 또는 저장값 조회
- 참조 문서/지식 공간 매핑
- `last_message_relative` 계산

## 9. 프론트엔드 타입 가이드
`packages/types/src/index.ts`에 최소 아래 타입 추가를 권장한다.

```ts
export type ChatStatus = "ready" | "processing" | "archived" | "error";
export type ChatMessageRole = "user" | "assistant";
export type ChatSourceType = "document" | "knowledge_space";

export interface ChatDetailHeaderDto {
  id: string;
  title: string;
  assistant_name: string;
  status: ChatStatus;
  created_at: string;
  last_message_at: string;
  last_message_relative: string;
}

export interface ChatMessageItemDto {
  id: string;
  role: ChatMessageRole;
  content: string;
  created_at: string;
  note: string | null;
}

export interface ChatSourceItemDto {
  id: string;
  source_type: ChatSourceType;
  target_id: string;
  label: string;
  hint: string;
}

export interface ChatFollowUpItemDto {
  id: string;
  text: string;
}

export interface ChatDetailResponse {
  chat: ChatDetailHeaderDto;
  summary: string;
  answer_snapshot: string;
  messages: ChatMessageItemDto[];
  sources: ChatSourceItemDto[];
  follow_ups: ChatFollowUpItemDto[];
}
```

## 10. 프론트 매핑 기준
현재 [chats/[chatId]/page.tsx](/D:/myhome/RockASK/apps/web/app/chats/[chatId]/page.tsx)는 아래 매핑으로 바로 전환할 수 있다.
- `title` <- `chat.title`
- 상단 assistant pill <- `chat.assistant_name`
- 상단 요약 <- `summary`
- 상단 답변 스냅샷 <- `answer_snapshot`
- 대화 흐름 <- `messages`
- 참조 링크 <- `sources`
- 후속 질문 <- `follow_ups`

링크 생성 규칙은 프론트에서 처리한다.
- `source_type=document` -> `appRoutes.documentDetail(target_id)`
- `source_type=knowledge_space` -> `appRoutes.knowledgeSpaceDetail(target_id)`

상단 metric 카드는 프론트에서 다음처럼 파생 계산할 수 있다.
- 최근 응답 시각 <- `chat.last_message_relative`
- 참조 문서 수 <- `sources.length`
- 후속 질문 수 <- `follow_ups.length`

## 11. 완료 기준
- `GET /api/v1/chats/{chat_id}` 계약이 문서와 코드 타입에 반영된다.
- FastAPI schema와 route skeleton이 추가된다.
- `packages/types`에 공용 DTO 타입이 추가된다.
- 프론트가 mock transcript/source/follow-up 생성 로직 없이 이 응답 구조를 읽을 수 있는 수준까지 계약이 고정된다.

## 12. 비범위
이번 티켓에는 아래 항목을 포함하지 않는다.
- 채팅 메시지 수정/삭제
- 대화 제목 수정
- 스트리밍 응답 재생성
- citation 원문 span 단위 하이라이트
- system/internal message 노출