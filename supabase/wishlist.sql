-- Run this in your Supabase SQL editor to add the wishlist feature

create table if not exists wishlist_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  url           text not null,
  title         text not null,
  description   text,
  price         text,
  category      text not null default 'other',
  thumbnail_url text,
  purchased     boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (user_id, url)
);

create index if not exists wishlist_items_user_id_idx on wishlist_items (user_id);
create index if not exists wishlist_items_category_idx on wishlist_items (user_id, category);

alter table wishlist_items enable row level security;
