-- Add color_labels column to settings table
alter table settings add column if not exists color_labels jsonb default '{
  "11": "Mavi",
  "5": "Sarı",
  "7": "Mavi",
  "10": "Yeşil"
}'::jsonb;

-- Note: In Google Calendar:
-- 11: Tomato (Red)
-- 5: Banana (Yellow)
-- 7: Peacock (Blue) 
-- 10: Basil (Green)
