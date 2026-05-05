-- Run this in your Supabase SQL editor

alter table book_items
  add column if not exists hardcover_slug text;
