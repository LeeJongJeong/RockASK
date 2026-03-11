-- RockASK PostgreSQL schema
-- Generated on 2026-03-11
-- Target: PostgreSQL 18 + pgvector 0.8.x
-- Note: this schema assumes a default embedding dimension of 1536.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS rockask;
SET search_path TO rockask, public;

CREATE OR REPLACE FUNCTION rockask.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION rockask.sync_chunk_search_vector()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$;

CREATE TYPE rockask.user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE rockask.team_status AS ENUM ('active', 'inactive');
CREATE TYPE rockask.knowledge_space_status AS ENUM ('active', 'indexing', 'error', 'archived');
CREATE TYPE rockask.scope_type AS ENUM ('global', 'team', 'personal', 'knowledge_space', 'assistant');
CREATE TYPE rockask.visibility_level AS ENUM ('private', 'team', 'organization', 'restricted');
CREATE TYPE rockask.source_kind AS ENUM ('upload', 'sharepoint', 'confluence', 'notion', 'google_drive', 'wiki', 'api', 'filesystem');
CREATE TYPE rockask.connector_status AS ENUM ('active', 'paused', 'error');
CREATE TYPE rockask.document_status AS ENUM ('draft', 'active', 'archived', 'deleted');
CREATE TYPE rockask.version_status AS ENUM ('pending', 'processing', 'active', 'failed', 'superseded');
CREATE TYPE rockask.job_type AS ENUM ('parse', 'ocr', 'chunk', 'embed', 'index', 'sync', 'thumbnail');
CREATE TYPE rockask.job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'retrying');
CREATE TYPE rockask.message_role AS ENUM ('system', 'user', 'assistant', 'tool');
CREATE TYPE rockask.chat_status AS ENUM ('active', 'archived', 'deleted');
CREATE TYPE rockask.query_status AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE rockask.feedback_type AS ENUM ('inaccurate_answer', 'wrong_citation', 'access_issue', 'outdated_content', 'hallucination', 'other');
CREATE TYPE rockask.feedback_status AS ENUM ('open', 'in_review', 'resolved', 'rejected');
CREATE TYPE rockask.subject_type AS ENUM ('user', 'team', 'role');
CREATE TYPE rockask.permission_level AS ENUM ('view', 'ask', 'upload', 'manage', 'admin');
CREATE TYPE rockask.alert_severity AS ENUM ('info', 'warning', 'error', 'critical');
CREATE TYPE rockask.alert_status AS ENUM ('open', 'acknowledged', 'resolved');
CREATE TYPE rockask.theme_preference AS ENUM ('system', 'light', 'dark');

CREATE TABLE rockask.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    parent_team_id UUID REFERENCES rockask.teams(id) ON DELETE SET NULL,
    status rockask.team_status NOT NULL DEFAULT 'active',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_no TEXT NOT NULL UNIQUE,
    email CITEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    team_id UUID REFERENCES rockask.teams(id) ON DELETE SET NULL,
    title TEXT,
    locale TEXT NOT NULL DEFAULT 'ko-KR',
    timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
    status rockask.user_status NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.user_roles (
    user_id UUID NOT NULL REFERENCES rockask.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES rockask.roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE rockask.knowledge_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    owner_team_id UUID REFERENCES rockask.teams(id) ON DELETE SET NULL,
    contact_user_id UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    status rockask.knowledge_space_status NOT NULL DEFAULT 'active',
    visibility rockask.visibility_level NOT NULL DEFAULT 'organization',
    last_indexed_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.content_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_space_id UUID NOT NULL REFERENCES rockask.knowledge_spaces(id) ON DELETE CASCADE,
    source_kind rockask.source_kind NOT NULL,
    name TEXT NOT NULL,
    source_uri TEXT,
    status rockask.connector_status NOT NULL DEFAULT 'active',
    schedule_text TEXT,
    credentials_ref TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ,
    created_by UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (knowledge_space_id, name)
);

CREATE TABLE rockask.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_space_id UUID NOT NULL REFERENCES rockask.knowledge_spaces(id) ON DELETE CASCADE,
    source_id UUID REFERENCES rockask.content_sources(id) ON DELETE SET NULL,
    owner_team_id UUID REFERENCES rockask.teams(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    source_kind rockask.source_kind NOT NULL DEFAULT 'upload',
    source_uri TEXT,
    visibility rockask.visibility_level NOT NULL DEFAULT 'organization',
    status rockask.document_status NOT NULL DEFAULT 'active',
    current_version_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES rockask.documents(id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL,
    version_label TEXT,
    status rockask.version_status NOT NULL DEFAULT 'pending',
    mime_type TEXT,
    file_size_bytes BIGINT,
    storage_bucket TEXT,
    storage_key TEXT,
    checksum_sha256 TEXT,
    parser_name TEXT,
    parser_error TEXT,
    extracted_text_sha256 TEXT,
    source_updated_at TIMESTAMPTZ,
    created_by UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, version_no),
    UNIQUE (storage_bucket, storage_key)
);

ALTER TABLE rockask.documents
    ADD CONSTRAINT documents_current_version_fk
    FOREIGN KEY (current_version_id)
    REFERENCES rockask.document_versions(id)
    ON DELETE SET NULL;

CREATE TABLE rockask.search_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type rockask.scope_type NOT NULL,
    team_id UUID REFERENCES rockask.teams(id) ON DELETE CASCADE,
    knowledge_space_id UUID REFERENCES rockask.knowledge_spaces(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order SMALLINT NOT NULL DEFAULT 100,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (type = 'team' AND team_id IS NOT NULL)
        OR (type = 'knowledge_space' AND knowledge_space_id IS NOT NULL)
        OR (type IN ('global', 'personal', 'assistant'))
    )
);

CREATE TABLE rockask.assistants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    owner_team_id UUID REFERENCES rockask.teams(id) ON DELETE SET NULL,
    default_scope_id UUID REFERENCES rockask.search_scopes(id) ON DELETE SET NULL,
    system_prompt TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES rockask.users(id) ON DELETE CASCADE,
    theme rockask.theme_preference NOT NULL DEFAULT 'system',
    last_scope_id UUID REFERENCES rockask.search_scopes(id) ON DELETE SET NULL,
    default_assistant_id UUID REFERENCES rockask.assistants(id) ON DELETE SET NULL,
    dashboard_prefs JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    prompt_text TEXT NOT NULL,
    team_id UUID REFERENCES rockask.teams(id) ON DELETE SET NULL,
    role_id UUID REFERENCES rockask.roles(id) ON DELETE SET NULL,
    assistant_id UUID REFERENCES rockask.assistants(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order SMALLINT NOT NULL DEFAULT 100,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_version_id UUID NOT NULL REFERENCES rockask.document_versions(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    section_path TEXT[],
    page_from INTEGER,
    page_to INTEGER,
    token_count INTEGER,
    char_count INTEGER,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    search_vector TSVECTOR NOT NULL DEFAULT ''::tsvector,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_version_id, chunk_index)
);

CREATE TABLE rockask.document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id UUID NOT NULL REFERENCES rockask.document_chunks(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL DEFAULT 'text-embedding-3-small',
    embedding_dims INTEGER NOT NULL DEFAULT 1536,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (chunk_id, model_name),
    CHECK (embedding_dims = 1536)
);

CREATE TABLE rockask.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES rockask.users(id) ON DELETE CASCADE,
    assistant_id UUID REFERENCES rockask.assistants(id) ON DELETE SET NULL,
    scope_id UUID REFERENCES rockask.search_scopes(id) ON DELETE SET NULL,
    title TEXT,
    status rockask.chat_status NOT NULL DEFAULT 'active',
    last_message_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES rockask.chats(id) ON DELETE CASCADE,
    parent_message_id UUID REFERENCES rockask.messages(id) ON DELETE SET NULL,
    role rockask.message_role NOT NULL,
    content TEXT NOT NULL,
    model_name TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    latency_ms INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.query_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES rockask.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES rockask.users(id) ON DELETE CASCADE,
    assistant_id UUID REFERENCES rockask.assistants(id) ON DELETE SET NULL,
    scope_id UUID REFERENCES rockask.search_scopes(id) ON DELETE SET NULL,
    prompt_template_id UUID REFERENCES rockask.prompt_templates(id) ON DELETE SET NULL,
    user_message_id UUID UNIQUE REFERENCES rockask.messages(id) ON DELETE SET NULL,
    assistant_message_id UUID UNIQUE REFERENCES rockask.messages(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    query_embedding VECTOR(1536),
    query_status rockask.query_status NOT NULL DEFAULT 'queued',
    retrieval_count INTEGER,
    rerank_count INTEGER,
    top_score DOUBLE PRECISION,
    latency_ms INTEGER,
    error_code TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE rockask.citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES rockask.messages(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES rockask.documents(id) ON DELETE CASCADE,
    document_version_id UUID NOT NULL REFERENCES rockask.document_versions(id) ON DELETE CASCADE,
    chunk_id UUID NOT NULL REFERENCES rockask.document_chunks(id) ON DELETE CASCADE,
    ordinal SMALLINT NOT NULL,
    score DOUBLE PRECISION,
    quote_text TEXT,
    page_from INTEGER,
    page_to INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (message_id, ordinal)
);

CREATE TABLE rockask.ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_space_id UUID REFERENCES rockask.knowledge_spaces(id) ON DELETE CASCADE,
    source_id UUID REFERENCES rockask.content_sources(id) ON DELETE SET NULL,
    document_id UUID REFERENCES rockask.documents(id) ON DELETE CASCADE,
    document_version_id UUID REFERENCES rockask.document_versions(id) ON DELETE CASCADE,
    job_type rockask.job_type NOT NULL,
    job_status rockask.job_status NOT NULL DEFAULT 'queued',
    queue_name TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_code TEXT,
    error_message TEXT,
    error_detail JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.sync_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES rockask.content_sources(id) ON DELETE CASCADE,
    job_status rockask.job_status NOT NULL DEFAULT 'queued',
    scanned_count INTEGER NOT NULL DEFAULT 0,
    imported_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.feedback_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES rockask.chats(id) ON DELETE CASCADE,
    query_run_id UUID REFERENCES rockask.query_runs(id) ON DELETE SET NULL,
    message_id UUID REFERENCES rockask.messages(id) ON DELETE SET NULL,
    feedback_type rockask.feedback_type NOT NULL,
    status rockask.feedback_status NOT NULL DEFAULT 'open',
    detail TEXT,
    created_by UUID NOT NULL REFERENCES rockask.users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.acl_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    subject_type rockask.subject_type NOT NULL,
    subject_id UUID NOT NULL,
    permission rockask.permission_level NOT NULL,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (resource_type, resource_id, subject_type, subject_id, permission)
);

CREATE TABLE rockask.system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    severity rockask.alert_severity NOT NULL DEFAULT 'info',
    status rockask.alert_status NOT NULL DEFAULT 'open',
    title TEXT NOT NULL,
    body TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ
);

CREATE TABLE rockask.dashboard_metric_snapshots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    metric_key TEXT NOT NULL,
    metric_value NUMERIC(18,4) NOT NULL,
    dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rockask.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id UUID REFERENCES rockask.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_teams_parent_team_id ON rockask.teams(parent_team_id);
CREATE INDEX idx_users_team_id ON rockask.users(team_id);
CREATE INDEX idx_user_roles_role_id ON rockask.user_roles(role_id);
CREATE INDEX idx_knowledge_spaces_owner_team_id ON rockask.knowledge_spaces(owner_team_id);
CREATE INDEX idx_knowledge_spaces_status ON rockask.knowledge_spaces(status);
CREATE INDEX idx_content_sources_space_id ON rockask.content_sources(knowledge_space_id);
CREATE INDEX idx_content_sources_status ON rockask.content_sources(status);
CREATE INDEX idx_documents_space_id ON rockask.documents(knowledge_space_id);
CREATE INDEX idx_documents_source_id ON rockask.documents(source_id);
CREATE INDEX idx_documents_status ON rockask.documents(status);
CREATE INDEX idx_documents_visibility ON rockask.documents(visibility);
CREATE INDEX idx_documents_title_trgm ON rockask.documents USING gin (title gin_trgm_ops);
CREATE INDEX idx_document_versions_document_id ON rockask.document_versions(document_id);
CREATE INDEX idx_document_versions_status ON rockask.document_versions(status);
CREATE INDEX idx_search_scopes_active_sort ON rockask.search_scopes(is_active, sort_order);
CREATE INDEX idx_prompt_templates_active_sort ON rockask.prompt_templates(is_active, sort_order);
CREATE INDEX idx_prompt_templates_title_trgm ON rockask.prompt_templates USING gin (title gin_trgm_ops);
CREATE INDEX idx_document_chunks_version_id ON rockask.document_chunks(document_version_id);
CREATE INDEX idx_document_chunks_search_vector ON rockask.document_chunks USING gin (search_vector);
CREATE INDEX idx_document_chunks_content_trgm ON rockask.document_chunks USING gin (content gin_trgm_ops);
CREATE INDEX idx_document_embeddings_chunk_id ON rockask.document_embeddings(chunk_id);
CREATE INDEX idx_document_embeddings_hnsw_cosine ON rockask.document_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_chats_user_last_message_at ON rockask.chats(user_id, last_message_at DESC NULLS LAST);
CREATE INDEX idx_messages_chat_created_at ON rockask.messages(chat_id, created_at);
CREATE INDEX idx_query_runs_user_created_at ON rockask.query_runs(user_id, created_at DESC);
CREATE INDEX idx_query_runs_chat_created_at ON rockask.query_runs(chat_id, created_at DESC);
CREATE INDEX idx_query_runs_status ON rockask.query_runs(query_status);
CREATE INDEX idx_citations_message_ordinal ON rockask.citations(message_id, ordinal);
CREATE INDEX idx_ingestion_jobs_status_scheduled_at ON rockask.ingestion_jobs(job_status, scheduled_at);
CREATE INDEX idx_ingestion_jobs_version_id ON rockask.ingestion_jobs(document_version_id);
CREATE INDEX idx_sync_runs_source_started_at ON rockask.sync_runs(source_id, started_at DESC NULLS LAST);
CREATE INDEX idx_feedback_items_status_created_at ON rockask.feedback_items(status, created_at DESC);
CREATE INDEX idx_feedback_items_created_by ON rockask.feedback_items(created_by);
CREATE INDEX idx_acl_entries_resource ON rockask.acl_entries(resource_type, resource_id);
CREATE INDEX idx_acl_entries_subject ON rockask.acl_entries(subject_type, subject_id);
CREATE INDEX idx_system_alerts_status_created_at ON rockask.system_alerts(status, created_at DESC);
CREATE INDEX idx_dashboard_metric_snapshots_key_captured ON rockask.dashboard_metric_snapshots(metric_key, captured_at DESC);
CREATE INDEX idx_audit_logs_actor_created_at ON rockask.audit_logs(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON rockask.audit_logs(resource_type, resource_id);

CREATE TRIGGER trg_teams_updated_at
BEFORE UPDATE ON rockask.teams
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON rockask.users
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON rockask.roles
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_knowledge_spaces_updated_at
BEFORE UPDATE ON rockask.knowledge_spaces
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_content_sources_updated_at
BEFORE UPDATE ON rockask.content_sources
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON rockask.documents
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_document_versions_updated_at
BEFORE UPDATE ON rockask.document_versions
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_search_scopes_updated_at
BEFORE UPDATE ON rockask.search_scopes
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_assistants_updated_at
BEFORE UPDATE ON rockask.assistants
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_user_preferences_updated_at
BEFORE UPDATE ON rockask.user_preferences
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_prompt_templates_updated_at
BEFORE UPDATE ON rockask.prompt_templates
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_document_chunks_search_vector
BEFORE INSERT OR UPDATE OF content ON rockask.document_chunks
FOR EACH ROW EXECUTE FUNCTION rockask.sync_chunk_search_vector();

CREATE TRIGGER trg_chats_updated_at
BEFORE UPDATE ON rockask.chats
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_ingestion_jobs_updated_at
BEFORE UPDATE ON rockask.ingestion_jobs
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_sync_runs_updated_at
BEFORE UPDATE ON rockask.sync_runs
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

CREATE TRIGGER trg_feedback_items_updated_at
BEFORE UPDATE ON rockask.feedback_items
FOR EACH ROW EXECUTE FUNCTION rockask.set_updated_at();

COMMENT ON SCHEMA rockask IS 'RockASK operational schema for dashboard, retrieval, ingestion, ACL, chat, and feedback.';
COMMENT ON TABLE rockask.document_embeddings IS 'Default embedding table for semantic retrieval; adjust VECTOR dimension if the embedding model changes.';
COMMENT ON TABLE rockask.acl_entries IS 'Generic ACL table applied at query time to avoid post-filter leakage in RAG search.';
COMMENT ON COLUMN rockask.document_chunks.search_vector IS 'PostgreSQL full-text search vector; pair with trigram search for Korean-heavy corpora.';
