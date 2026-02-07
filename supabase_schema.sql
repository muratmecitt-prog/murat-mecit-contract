-- Create tables for Murat Mecit Contract System

-- 1. PACKAGES TABLE
create table packages (
  id serial primary key,
  user_id uuid references auth.users(id),
  name text not null,
  price decimal(10, 2) not null,
  content text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. CONTRACTS TABLE
create table contracts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  customer_name text not null,
  shooting_date timestamp with time zone not null,
  location text,
  email text,
  package_id integer references packages(id),
  package_content text, -- Store a snapshot of package content at time of contract
  total_price decimal(10, 2),
  deposit decimal(10, 2),
  remaining decimal(10, 2) generated always as (total_price - deposit) stored,
  payment_note text,
  clauses jsonb, -- Array of strings for contract clauses
  pdf_url text, -- Link to stored PDF
  calendar_event_id text, -- Google Calendar Event ID
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. SETTINGS TABLE
create table settings (
  id serial primary key,
  user_id uuid references auth.users(id),
  company_name text default 'Murat Mecit Fotoğrafçılık',
  company_address text,
  company_phone text,
  company_email text,
  signature_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table packages enable row level security;
alter table contracts enable row level security;
alter table settings enable row level security;

-- Create Policies
-- Users can only see/edit their own data (even though current scope is single user, good practice)
create policy "Users can view own packages" on packages for select using (auth.uid() = user_id);
create policy "Users can insert own packages" on packages for insert with check (auth.uid() = user_id);
create policy "Users can update own packages" on packages for update using (auth.uid() = user_id);
create policy "Users can delete own packages" on packages for delete using (auth.uid() = user_id);

create policy "Users can view own contracts" on contracts for select using (auth.uid() = user_id);
create policy "Users can insert own contracts" on contracts for insert with check (auth.uid() = user_id);
create policy "Users can update own contracts" on contracts for update using (auth.uid() = user_id);

create policy "Users can view own settings" on settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings" on settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings" on settings for update using (auth.uid() = user_id);

-- Storage bucket for signatures (run this in dashboard primarily)
-- insert into storage.buckets (id, name) values ('signatures', 'signatures');
-- create policy "Authenticated users can upload signatures" on storage.objects for insert with check (bucket_id = 'signatures' and auth.role() = 'authenticated');
-- create policy "Authenticated users can view signatures" on storage.objects for select using (bucket_id = 'signatures' and auth.role() = 'authenticated');
