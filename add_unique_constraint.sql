-- Add unique constraint to user_id if it's not already the primary key or unique
-- This is REQUIRED for the upsert (ON CONFLICT) operation to work
ALTER TABLE public.settings ADD CONSTRAINT settings_user_id_unique UNIQUE (user_id);
