-- Run this in your Supabase SQL editor (after schema.sql)

-- 1. Add user_id to content_items
alter table content_items
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. Per-user settings (Anthropic key + personal API token)
create table if not exists user_settings (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  anthropic_api_key text,
  api_token       text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_at      timestamptz not null default now()
);

alter table user_settings enable row level security;

create policy "Users can manage own settings" on user_settings
  for all using (auth.uid() = user_id);

-- 3. Auto-create settings row when a user signs up
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 4. Update RLS on content_items to scope by user
drop policy if exists "Users can see own content" on content_items;
drop policy if exists "Users can insert own content" on content_items;
drop policy if exists "Users can delete own content" on content_items;

create policy "Users can see own content" on content_items
  for select using (auth.uid() = user_id);
create policy "Users can insert own content" on content_items
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own content" on content_items
  for delete using (auth.uid() = user_id);
