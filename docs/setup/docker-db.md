# RockASK Docker DB Baseline

This document defines the Docker-based PostgreSQL and pgvector baseline used by RockASK in local development.

## Source Files

- `docker-compose.yml`: local DB container definition
- `.env.docker.example`: baseline image, DB name, account, password, and port values
- `apps/api/.env.example`: default API connection string
- `apps/api/alembic/versions/20260311_0001_initial_schema.py`: initial schema application path
- `db/schema.sql`: source SQL schema

## Standard Procedure

### 1. Create the environment file

PowerShell:

```powershell
Copy-Item .env.docker.example .env.docker
```

sh:

```bash
cp .env.docker.example .env.docker
```

### 2. Start the DB container

```bash
docker compose --env-file .env.docker up -d postgres
docker compose --env-file .env.docker ps
```

### 3. Apply the API schema

```bash
cd apps/api
uv sync
.\.venv\Scripts\python.exe -m alembic upgrade head
```

The initial Alembic revision executes `db/schema.sql`.
Do not mount the schema into the container entrypoint at startup or initialization will run twice.

## Default Values

| Item | Value |
|---|---|
| Image | `pgvector/pgvector:pg17` |
| Database | `rockask` |
| User | `postgres` |
| Password | `postgres` |
| Host port | `5432` |

Default API connection string:

```text
postgresql+psycopg://postgres:postgres@127.0.0.1:5432/rockask
```

## Verification Commands

```bash
docker compose --env-file .env.docker exec postgres psql -U postgres -d rockask -c "SELECT version();"
docker compose --env-file .env.docker exec postgres psql -U postgres -d rockask -c "\dx"
```

If `vector`, `pg_trgm`, `citext`, and `pgcrypto` are present after migration, the local DB baseline is healthy.

## Reset Procedure

```bash
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d postgres
cd apps/api
.\.venv\Scripts\python.exe -m alembic upgrade head
```

## Change Rule

If any of these files change, update them in the same commit:

- `docker-compose.yml`
- `.env.docker.example`
- `apps/api/.env.example`
- this document

If the DB image tag changes, verify pgvector support and the Alembic bootstrap path together.