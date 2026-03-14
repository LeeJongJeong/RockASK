# RockASK 로컬 웹 미리보기 실행 가이드

이 문서는 현재 RockASK 웹 화면을 로컬에서 확인하기 위해 API와 웹 앱을 함께 올리는 절차를 정리한다.

## 목적

- 실DB 또는 로컬 API 기준으로 현재 웹 화면을 확인한다.
- 랜딩 페이지, 채팅, 지식 공간, 문서 화면을 브라우저에서 바로 점검한다.
- API 주소를 명시해 웹이 mock fallback 대신 실제 API를 우선 사용하게 만든다.

## 전제 조건

- 저장소 루트는 `D:\myhome\RockASK`
- Docker Postgres가 올라와 있어야 한다.
- API 마이그레이션이 적용돼 있어야 한다.
- 웹 의존성 설치가 끝나 있어야 한다.

권장 선행 절차:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup\preflight.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup\setup-api.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup\check-api-health.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup\setup-web.ps1
```

## 현재 기준 포트

- API: `127.0.0.1:8000`
- Web: `127.0.0.1:3202`

`3202`는 기존 Node 프로세스와 충돌을 피하기 위해 사용했다.

## 1. API 서버 실행

저장소 루트가 아니라 `apps/api`에서 실행한다.

```powershell
cd D:\myhome\RockASK\apps\api
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

응답 확인:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/api/v1/knowledge-spaces
```

정상 기준:

- `StatusCode` 가 `200`

## 2. 웹 서버 실행

웹은 `NEXT_PUBLIC_API_BASE_URL` 을 지정해서 실행한다.
이 값을 주지 않으면 일부 화면은 mock fallback 으로 동작할 수 있다.

저장소 루트에서 실행:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:8000/api/v1"
corepack pnpm --filter @rockask/web exec next dev --hostname 127.0.0.1 --port 3202
```

응답 확인:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3202/
```

정상 기준:

- `StatusCode` 가 `200`

## 3. 브라우저 확인 URL

- 메인 화면: `http://127.0.0.1:3202/`
- 채팅 목록: `http://127.0.0.1:3202/chats`
- 채팅 상세 예시: `http://127.0.0.1:3202/chats/chat-1`
- 지식 공간 목록: `http://127.0.0.1:3202/knowledge-spaces`
- 지식 공간 상세 예시: `http://127.0.0.1:3202/knowledge-spaces/ks-strategy`
- 문서 상세 예시: `http://127.0.0.1:3202/documents/update-security`

메인 화면에서는 아래 문구가 보이면 최신 랜딩 카피가 반영된 상태다.

- `필요한 문서, 검색 말고 그냥 물어보세요`

## 4. 백그라운드 실행 방식

Codex에서 미리보기용으로 올릴 때는 `Start-Process` 로 로그를 파일에 남기며 백그라운드 실행했다.

### API 백그라운드 실행 예시

```powershell
Start-Process -FilePath "D:\myhome\RockASK\apps\api\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" `
  -WorkingDirectory "D:\myhome\RockASK\apps\api" `
  -RedirectStandardOutput "D:\myhome\RockASK\.tmp-api.log" `
  -RedirectStandardError "D:\myhome\RockASK\.tmp-api.err.log"
```

### Web 백그라운드 실행 예시

```powershell
Start-Process -FilePath "C:\WINDOWS\System32\cmd.exe" `
  -ArgumentList "/c", "set NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1&& corepack pnpm --filter @rockask/web exec next dev --hostname 127.0.0.1 --port 3202" `
  -WorkingDirectory "D:\myhome\RockASK" `
  -RedirectStandardOutput "D:\myhome\RockASK\.tmp-web-preview.log" `
  -RedirectStandardError "D:\myhome\RockASK\.tmp-web-preview.err.log"
```

## 5. 로그 위치

- API stdout: `D:\myhome\RockASK\.tmp-api.log`
- API stderr: `D:\myhome\RockASK\.tmp-api.err.log`
- Web stdout: `D:\myhome\RockASK\.tmp-web-preview.log`
- Web stderr: `D:\myhome\RockASK\.tmp-web-preview.err.log`

## 6. 종료 방법

포트를 점유한 프로세스를 찾은 뒤 종료한다.

예시:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8000,3202 | Select-Object LocalPort,OwningProcess
Get-Process -Id <PID> | Stop-Process -Force
```

또는 실행 중인 `python`, `node` 프로세스를 직접 확인해 종료할 수 있다.

```powershell
Get-Process -Name python,node -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,Path
```

## 7. 문제 해결

### 웹이 뜨지 않고 `Invalid project directory` 가 나오는 경우

`pnpm dev -- --hostname ...` 형태 대신 아래 명령을 사용한다.

```powershell
corepack pnpm --filter @rockask/web exec next dev --hostname 127.0.0.1 --port 3202
```

### PowerShell 에서 API 주소를 명령으로 오인하는 경우

환경 변수 할당 시 URL을 반드시 문자열로 감싼다.

```powershell
$env:NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:8000/api/v1"
```

### API 주소가 빠졌을 때

- 랜딩이나 상세 화면이 mock fallback 으로 보일 수 있다.
- `apps/web/lib/api-url.ts` 는 `NEXT_PUBLIC_API_BASE_URL` 또는 `API_BASE_URL` 을 읽는다.

## 8. 관련 파일

- `apps/web/lib/api-url.ts`
- `apps/web/lib/get-dashboard.ts`
- `apps/web/lib/route-page-data.ts`
- `apps/api/README.md`
- `docs/setup/company-setup.md`
- `docs/setup/docker-db.md`
