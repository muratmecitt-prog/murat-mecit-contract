-- Add color column to contracts table
-- Stores color ID or hex code for Google Calendar sync

alter table contracts 
add column if not exists color text default 'blue'; 
-- 'blue', 'red', 'yellow', 'green' mapped to Google Cal IDs in frontend
