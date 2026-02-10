-- Add design customization columns to settings table
alter table settings
add column if not exists contract_primary_color text default '#2dd4bf', -- Default teal-400
add column if not exists contract_template text default 'modern'; -- Default modern template
