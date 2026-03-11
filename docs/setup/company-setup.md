# RockASK Company Setup

Use this guide when you set up the same RockASK local environment on a company PC.

## Prerequisites

- Docker Desktop
- Python 3.13
- `uv`
- Node.js 22 or newer
- `corepack` or `pnpm`

## Recommended Order

### 1. Run the preflight check

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup\preflight.ps1
```

The preflight script verifies:

- Docker engine access
- Python 3.13 detection
- `uv`, `node`, and `corepack` availability
- `docker-compose.yml` and `.env.docker.example` consistency
- local port usage for `5432` and `8000`

### 2. Prepare the database and API

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup\setup-api.ps1
```

This script will:

- create `.env.docker` from `.env.docker.example` if it does not exist
- start the Docker Postgres container
- wait for the DB healthcheck
- run `uv sync`
- apply the Alembic migration
- verify `alembic_version`

### 3. Verify API health

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup\check-api-health.ps1
```

- the script tries port `8000` first
- if `8000` is blocked, it retries on `18000`
- use the returned `Url` value for `API_BASE_URL` on the web app if needed

### 4. Prepare the web app

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup\setup-web.ps1
```

- if `pnpm` is missing, the script falls back to `corepack pnpm`
- it creates `apps/web/.env.local` when missing
- if `apps/web/.env.local` already exists, it updates only `API_BASE_URL`
- use `-ApiBaseUrl` to point the web app to a non-default API port

Example:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup\setup-web.ps1 -ApiBaseUrl http://127.0.0.1:18000
```

## One Command Setup

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup\setup-all.ps1
```

- this runs `preflight -> setup-api -> check-api-health -> setup-web`
- use `-SkipWeb` if you only want the API side first

## Encoding Guardrail

Setup-related config files should stay in `UTF-8 without BOM`.
Windows PowerShell 5.1 can reintroduce BOM when `Set-Content -Encoding utf8` is used.
Prefer one of these options when you touch config files:

- save as `UTF-8` in VS Code
- use the scripts in `scripts/setup`
- use `.NET WriteAllText(..., new UTF8Encoding($false))`

The most sensitive files are:

- `package.json`
- `apps/api/pyproject.toml`
- `apps/api/alembic.ini`
- `db/schema.sql`
- `.python-version`