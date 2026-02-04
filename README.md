# dual-ai

## Supabase setup (Email OTP + chat storage)

### 1) Create a Supabase project
- Go to https://supabase.com and create a new project.
- Copy **Project URL** and **anon public key** (Settings → API).

### 2) Enable Email OTP auth
- Authentication → Providers → Email → enable **Email OTP** (passwordless).
- Configure **URL Configuration**:
  - `http://localhost:3000`
  - `https://<your-vercel-domain>.vercel.app`

### 3) Create the `chat` table
Use the schema below:

```sql
create table if not exists chat (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  anon_id uuid null,
  messages jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone default now()
);
```

### 4) Enable RLS and policies
```sql
alter table chat enable row level security;

create policy "users can access their chats"
on chat
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "anon can access anon chats"
on chat
for all
using (auth.uid() is null and anon_id is not null)
with check (auth.uid() is null and anon_id is not null);
```

### 5) Configure Vercel Environment Variables
Add these environment variables in Vercel (Project Settings → Environment Variables):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

The app reads them through `/api/config`, which serves the public Supabase config
from the serverless environment.

### 6) Sign in via the app
- Open the app, go to **Меню → Авторизация**.
- Click **Войти**, enter your email, and confirm the code from the email.

## How it works
- Guest users get a local `anon_id`.
- Chats are saved with `anon_id`.
- After login, chats are migrated to `user_id`.
