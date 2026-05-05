-- Run this in your Supabase SQL editor to add Hardcover API key support

alter table user_settings
  add column if not exists hardcover_api_key text;
