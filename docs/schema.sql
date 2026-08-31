-- ==============================================================================
-- CuraLab AI — PostgreSQL & pgvector Database Schema
-- Run this script inside the Supabase SQL Editor
-- ==============================================================================

-- 1. Enable the pgvector extension for high-speed semantic embeddings search
create extension if not exists vector;

-- 2. Chat Sessions Table (Stores uploaded report text & structured biomarker JSON)
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  report_title text default 'Clinical Laboratory Report',
  report_text text not null,
  patient_context jsonb default '{}'::jsonb,
  analysis_result jsonb,
  status text default 'completed' check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz default now()
);

-- 3. Chat Messages Table (Stores multi-turn conversational history)
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 4. Report Embeddings Table (Stores 384-dimensional text chunks for RAG search)
create table if not exists report_embeddings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade not null,
  chunk_text text not null,
  chunk_index int not null,
  embedding vector(384), -- 384 dimensions for nomic-embed-text / all-MiniLM-L6-v2
  created_at timestamptz default now()
);

-- 5. IVFFlat Cosine Similarity Index for rapid vector matching
create index if not exists report_embeddings_cosine_idx 
on report_embeddings using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 6. Enable Row-Level Security (RLS) on all tables
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table report_embeddings enable row level security;

-- 7. RLS Policies: Ensure users can strictly only access their own clinical records
create policy "Users can view and manage own sessions"
on chat_sessions for all using (auth.uid() = user_id);

create policy "Users can view and manage messages in their sessions"
on chat_messages for all using (
  exists (
    select 1 from chat_sessions
    where chat_sessions.id = chat_messages.session_id
    and chat_sessions.user_id = auth.uid()
  )
);

create policy "Users can view and manage embeddings in their sessions"
on report_embeddings for all using (
  exists (
    select 1 from chat_sessions
    where chat_sessions.id = report_embeddings.session_id
    and chat_sessions.user_id = auth.uid()
  )
);

-- 8. Cosine Search Stored Procedure (RPC) for RAG Semantic Retrieval
create or replace function match_report_chunks(
  query_embedding vector(384),
  match_session_id uuid,
  match_count int default 4
)
returns table (
  id uuid,
  chunk_text text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    report_embeddings.id,
    report_embeddings.chunk_text,
    1 - (report_embeddings.embedding <=> query_embedding) as similarity
  from report_embeddings
  where report_embeddings.session_id = match_session_id
  order by report_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
