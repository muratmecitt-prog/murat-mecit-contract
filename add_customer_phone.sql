-- Add customer_phone column to contracts table
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS customer_phone text;
