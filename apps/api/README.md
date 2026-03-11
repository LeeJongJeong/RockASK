# RockASK API

FastAPI backend skeleton for RockASK.

## Prerequisites

- Docker
- Python 3.13
- `uv`

## Recommended Setup

From the repository root, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup\preflight.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup\setup-api.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup\check-api-health.ps1
```

## Local Database

For the manual path:

```powershell
Copy-Item .env.docker.example .env.docker
docker compose --env-file .env.docker up -d postgres
```

The default connection values match `apps/api/.env.example`.
Follow `docs/setup/docker-db.md` for the reproducible baseline.
To fully reset the DB, run `docker compose --env-file .env.docker down -v` from the repository root.

## Run

```powershell
uv sync
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The initial Alembic bootstrap executes the root `db/schema.sql` file directly.
If the schema stabilizes, replace that bootstrap with a fixed migration body.