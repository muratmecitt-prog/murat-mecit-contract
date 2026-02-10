-- FIX: Drop existing policies to avoid conflicts
drop policy if exists "Users can view their own settings" on settings;
drop policy if exists "Users can update their own settings" on settings;
drop policy if exists "Users can insert their own settings" on settings;
drop policy if exists "Users can upsert their own settings" on settings;

-- Enable RLS
alter table settings enable row level security;

-- Create comprehensive policies
-- 1. SELECT
create policy "Users can view their own settings"
on settings for select
using ( auth.uid() = user_id );

-- 2. INSERT
create policy "Users can insert their own settings"
on settings for insert
with check ( auth.uid() = user_id );

-- 3. UPDATE
create policy "Users can update their own settings"
on settings for update
using ( auth.uid() = user_id );

-- 4. Grant access to authenticated users
grant all on table settings to authenticated;
grant all on table settings to service_role;

-- 5. Metadata for verification (Optional, just to ensure column exists)
comment on table settings is 'User settings table with RLS enabled';
