-- Comprehensive Column Fix for Settings Table
-- Run this in Supabase > SQL Editor

-- 1. Standard Info (Eksikse Ekle)
alter table settings 
add column if not exists company_name text,
add column if not exists representative_name text,
add column if not exists address text,
add column if not exists phone text,
add column if not exists email text;

-- 2. Defaults (Eksikse Ekle)
alter table settings
add column if not exists default_clauses jsonb default '[]'::jsonb,
add column if not exists default_payment_note text;

-- 3. New Features (Eksikse Ekle - Tekrar Kontrol)
alter table settings 
add column if not exists color_labels jsonb default '{"11": "Kırmızı", "5": "Sarı", "7": "Mavi", "10": "Yeşil"}',
add column if not exists contract_primary_color text default '#1e293b',
add column if not exists contract_template text default 'modern',
add column if not exists google_refresh_token text,
add column if not exists google_email text;
