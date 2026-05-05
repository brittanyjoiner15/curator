-- Run this in your Supabase SQL editor to create the watch items table

create table if not exists watch_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  tmdb_id         integer not null,
  media_type      text not null check (media_type in ('movie', 'tv')),
  title           text not null,
  overview        text,
  poster_url      text,
  release_year    integer,
  streaming_services text[] not null default '{}',
  watched         boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type)
);

alter table watch_items enable row level security;

create policy "Users can manage their own watch items"
  on watch_items for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
