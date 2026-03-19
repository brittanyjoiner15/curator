-- Run this in your Supabase SQL editor

create table if not exists content_items (
  id              uuid primary key default gen_random_uuid(),
  url             text unique not null,
  type            text not null check (type in ('article', 'youtube')),
  title           text not null,
  description     text,
  duration_minutes integer not null default 1,
  topics          text[] not null default '{}',
  thumbnail_url   text,
  created_at      timestamptz not null default now()
);

-- Index for fast topic filtering
create index if not exists content_items_topics_idx on content_items using gin (topics);

-- Enable RLS (rows only accessible via service role key in API routes)
alter table content_items enable row level security;
