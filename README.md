# RockASK Monorepo Skeleton

This repository contains the RockASK MVP monorepo based on Next.js and FastAPI.

## Layout

- `apps/web`: Next.js App Router dashboard UI
- `apps/api`: FastAPI backend
- `packages/types`: shared frontend types
- `packages/ui`: shared UI package entrypoint
- `docs/adr`: architecture decision records
- `docs/setup/docker-db.md`: Docker database baseline
- `docs/setup/company-setup.md`: company PC setup guide
- `scripts/setup`: PowerShell setup and verification scripts
- `db`: schema and ERD documents

## Recommended Setup Flow

Run these commands from PowerShell on a fresh machine:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup\preflight.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup\setup-api.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup\check-api-health.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\setup\setup-web.ps1
```

To run the full flow in one command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup\setup-all.ps1
```

## Manual Quick Start

### 1. Database

```powershell
Copy-Item .env.docker.example .env.docker
docker compose --env-file .env.docker up -d postgres
docker compose --env-file .env.docker ps
```

### 2. API

```powershell
cd apps/api
uv sync
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

### 3. Web

```powershell
corepack pnpm install
corepack pnpm dev:web
```

## Default Endpoints

- Web: `http://localhost:3000`
- API docs: `http://127.0.0.1:8000/docs`
- API health: `http://127.0.0.1:8000/api/v1/health`