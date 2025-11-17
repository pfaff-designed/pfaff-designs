-- Enable pgvector extension
create extension if not exists vector;

-- Create project_chunks table
create table if not exists project_chunks (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  source text not null,
  chunk_index int not null,
  content text not null,
  embedding vector(1536)
);

-- Create index on project_id for faster filtering
create index if not exists project_chunks_project_id_idx
  on project_chunks (project_id);

-- Create vector index for similarity search
-- Using ivfflat with cosine distance for better performance
create index if not exists project_chunks_embedding_idx
  on project_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create RPC function for similarity search
create or replace function match_project_chunks(
  query_embedding vector(1536),
  match_count int,
  filter_project_id text default null
)
returns table (
  id uuid,
  project_id text,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id,
    c.project_id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from project_chunks c
  where filter_project_id is null
     or c.project_id = filter_project_id
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

