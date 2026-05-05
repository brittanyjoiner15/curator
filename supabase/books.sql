-- Run this in your Supabase SQL editor to create the book items table

create table if not exists book_items (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  google_books_id  text not null,
  title            text not null,
  authors          text[] not null default '{}',
  description      text,
  cover_url        text,
  published_year   integer,
  isbn_13          text,
  isbn_10          text,
  page_count       integer,
  read             boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (user_id, google_books_id)
);

alter table book_items enable row level security;

create policy "Users can manage their own book items"
  on book_items for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
