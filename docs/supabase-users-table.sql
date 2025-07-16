-- Supabase users table setup
create table if not exists users (
  id text primary key,
  data jsonb
);

-- Enable Row Level Security (RLS)
alter table users enable row level security;

-- Example RLS policy for authenticated users
create policy "Allow authenticated read/write" on users
  for select, insert, update
  using (auth.uid() is not null);
