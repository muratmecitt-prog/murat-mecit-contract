-- Add google_email column to settings table
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS google_email text;
