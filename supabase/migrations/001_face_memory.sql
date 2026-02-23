-- Visual memory: face identity and conversation persistence
-- Run this in Supabase SQL editor or via supabase db push

create extension if not exists vector;

-- One row per recognized face identity
create table if not exists face_users (
  id           uuid primary key default gen_random_uuid(),
  display_name text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- One or more face vectors per user (CompreFace 512-d)
create table if not exists face_embeddings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references face_users(id) on delete cascade,
  embedding  vector(512),
  created_at timestamptz default now()
);

create index if not exists face_embeddings_embedding_idx on face_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- One conversation per user (latest)
create table if not exists conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references face_users(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  created_at      timestamptz default now()
);

create index if not exists messages_conversation_created_idx on messages (conversation_id, created_at);

-- RPC: find best matching face by cosine distance (returns one row or none)
create or replace function match_face_embedding(
  query_embedding vector(512),
  match_threshold float default 0.25
)
returns table (user_id uuid, display_name text, distance float)
language sql
stable
as $$
  select
    fu.id as user_id,
    fu.display_name,
    (fe.embedding <=> query_embedding) as distance
  from face_embeddings fe
  join face_users fu on fu.id = fe.user_id
  where (fe.embedding <=> query_embedding) < match_threshold
  order by fe.embedding <=> query_embedding asc
  limit 1;
$$;
