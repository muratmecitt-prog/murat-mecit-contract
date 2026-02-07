-- Create a table for user settings
create table if not exists settings (
  user_id uuid references auth.users not null primary key,
  company_name text,
  representative_name text,
  address text,
  phone text,
  email text,
  default_clauses jsonb default '[]'::jsonb,
  default_payment_note text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table settings enable row level security;

-- Create policies
create policy "Users can view their own settings"
  on settings for select
  using ( auth.uid() = user_id );

create policy "Users can update their own settings"
  on settings for update
  using ( auth.uid() = user_id );

create policy "Users can insert their own settings"
  on settings for insert
  with check ( auth.uid() = user_id );
