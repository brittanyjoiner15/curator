-- Run this in your Supabase SQL editor to enable wishlist sharing

alter table user_settings
  add column if not exists wishlist_share_token text unique
    default encode(gen_random_bytes(32), 'hex');

-- Backfill any rows that are NULL (shouldn't happen, but just in case)
update user_settings
  set wishlist_share_token = encode(gen_random_bytes(32), 'hex')
  where wishlist_share_token is null;
