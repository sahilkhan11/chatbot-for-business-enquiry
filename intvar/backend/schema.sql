-- Run this in Supabase SQL Editor

-- Leads table
create table leads (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  service text,
  message text not null,
  status text default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table leads enable row level security;

-- Anyone can insert (contact form submissions)
create policy "Public can insert leads"
  on leads for insert
  to anon
  with check (true);

-- Only authenticated users (admin) can read/update/delete
create policy "Admin can do everything"
  on leads for all
  to authenticated
  using (true)
  with check (true);
