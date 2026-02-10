-- Consolidated Migration Script
-- Run this in Supabase > SQL Editor

-- 1. Add color_labels column (if missing)
alter table settings 
add column if not exists color_labels jsonb default '{"11": "Kırmızı", "5": "Sarı", "7": "Mavi", "10": "Yeşil"}';

-- 2. Add design customization columns (if missing)
alter table settings
add column if not exists contract_primary_color text default '#1e293b',
add column if not exists contract_template text default 'modern';

-- 3. Add Google Calendar columns (if missing)
alter table settings
add column if not exists google_refresh_token text,
add column if not exists google_email text;
