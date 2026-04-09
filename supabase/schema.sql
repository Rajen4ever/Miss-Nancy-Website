begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.project_status as enum (
  'active',
  'on_hold',
  'completed',
  'archived'
);

create type public.task_status as enum (
  'todo',
  'in_progress',
  'blocked',
  'done'
);

create type public.task_priority as enum (
  'low',
  'medium',
  'high',
  'urgent'
);

create type public.memory_kind as enum (
  'general',
  'preference',
  'fact',
  'constraint',
  'summary',
  'decision'
);

create type public.request_status as enum (
  'new',
  'in_review',
  'scheduled',
  'closed',
  'spam'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.requesting_clerk_user_id()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'sub', '');
$$;

create or replace function public.owns_row(row_clerk_user_id text)
returns boolean
language sql
stable
as $$
  select row_clerk_user_id = public.requesting_clerk_user_id();
$$;

create or replace function public.bump_session_last_message_at()
returns trigger
language plpgsql
as $$
begin
  update public.sessions
  set
    last_message_at = new.created_at,
    updated_at = timezone('utc', now())
  where id = new.session_id
    and clerk_user_id = new.clerk_user_id;

  return new;
end;
$$;

create table public.profiles (
  clerk_user_id text primary key,
  email citext not null unique,
  first_name text,
  last_name text,
  image_url text,
  stripe_customer_id text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles (clerk_user_id) on delete cascade,
  title text not null default 'New chat',
  summary text,
  archived boolean not null default false,
  last_message_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (id, clerk_user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  clerk_user_id text not null,
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content jsonb not null default '[]'::jsonb,
  model text,
  tool_name text,
  tool_call_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint fk_messages_session_owner
    foreign key (session_id, clerk_user_id)
    references public.sessions (id, clerk_user_id)
    on delete cascade
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles (clerk_user_id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  status public.project_status not null default 'active',
  color text,
  metadata jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (clerk_user_id, slug)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles (clerk_user_id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  created_from_session_id uuid references public.sessions (id) on delete set null,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  priority public.task_priority not null default 'medium',
  due_at timestamptz,
  completed_at timestamptz,
  sort_order integer not null default 0,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.memory_items (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles (clerk_user_id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  session_id uuid references public.sessions (id) on delete set null,
  content text not null,
  kind public.memory_kind not null default 'general',
  importance smallint not null default 3 check (importance between 1 and 5),
  source text not null default 'assistant',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles (clerk_user_id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text,
  plan_slug text not null default 'free',
  status text not null,
  cancel_at_period_end boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text references public.profiles (clerk_user_id) on delete set null,
  full_name text not null,
  email citext not null,
  company text,
  message text not null,
  source text not null default 'website',
  status public.request_status not null default 'new',
  hubspot_contact_id text,
  hubspot_object_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text references public.profiles (clerk_user_id) on delete set null,
  full_name text not null,
  email citext not null,
  company text,
  role text,
  team_size text,
  use_case text not null,
  calendly_event_uri text,
  status public.request_status not null default 'new',
  hubspot_contact_id text,
  hubspot_object_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index idx_sessions_owner_updated_at
  on public.sessions (clerk_user_id, updated_at desc);

create index idx_sessions_owner_last_message_at
  on public.sessions (clerk_user_id, last_message_at desc);

create index idx_messages_session_created_at
  on public.messages (session_id, created_at asc);

create index idx_messages_owner_created_at
  on public.messages (clerk_user_id, created_at desc);

create index idx_projects_owner_status
  on public.projects (clerk_user_id, status, updated_at desc);

create index idx_tasks_owner_status
  on public.tasks (clerk_user_id, status, updated_at desc);

create index idx_tasks_owner_project
  on public.tasks (clerk_user_id, project_id);

create index idx_tasks_due_at
  on public.tasks (clerk_user_id, due_at);

create index idx_memory_items_owner_kind
  on public.memory_items (clerk_user_id, kind, created_at desc);

create index idx_memory_items_project
  on public.memory_items (clerk_user_id, project_id);

create index idx_subscriptions_owner_status
  on public.subscriptions (clerk_user_id, status);

create index idx_contact_submissions_email
  on public.contact_submissions (email, created_at desc);

create index idx_demo_requests_email
  on public.demo_requests (email, created_at desc);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_sessions_updated_at
before update on public.sessions
for each row
execute function public.set_updated_at();

create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

create trigger set_memory_items_updated_at
before update on public.memory_items
for each row
execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();

create trigger set_contact_submissions_updated_at
before update on public.contact_submissions
for each row
execute function public.set_updated_at();

create trigger set_demo_requests_updated_at
before update on public.demo_requests
for each row
execute function public.set_updated_at();

create trigger bump_session_last_message_at
after insert on public.messages
for each row
execute function public.bump_session_last_message_at();

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.memory_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.demo_requests enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (public.owns_row(clerk_user_id));

create policy "profiles_insert_own"
on public.profiles
for insert
with check (public.owns_row(clerk_user_id));

create policy "profiles_update_own"
on public.profiles
for update
using (public.owns_row(clerk_user_id))
with check (public.owns_row(clerk_user_id));

create policy "sessions_select_own"
on public.sessions
for select
using (public.owns_row(clerk_user_id));

create policy "sessions_insert_own"
on public.sessions
for insert
with check (public.owns_row(clerk_user_id));

create policy "sessions_update_own"
on public.sessions
for update
using (public.owns_row(clerk_user_id))
with check (public.owns_row(clerk_user_id));

create policy "sessions_delete_own"
on public.sessions
for delete
using (public.owns_row(clerk_user_id));

create policy "messages_select_own"
on public.messages
for select
using (public.owns_row(clerk_user_id));

create policy "messages_insert_own"
on public.messages
for insert
with check (public.owns_row(clerk_user_id));

create policy "messages_update_own"
on public.messages
for update
using (public.owns_row(clerk_user_id))
with check (public.owns_row(clerk_user_id));

create policy "messages_delete_own"
on public.messages
for delete
using (public.owns_row(clerk_user_id));

create policy "projects_select_own"
on public.projects
for select
using (public.owns_row(clerk_user_id));

create policy "projects_insert_own"
on public.projects
for insert
with check (public.owns_row(clerk_user_id));

create policy "projects_update_own"
on public.projects
for update
using (public.owns_row(clerk_user_id))
with check (public.owns_row(clerk_user_id));

create policy "projects_delete_own"
on public.projects
for delete
using (public.owns_row(clerk_user_id));

create policy "tasks_select_own"
on public.tasks
for select
using (public.owns_row(clerk_user_id));

create policy "tasks_insert_own"
on public.tasks
for insert
with check (public.owns_row(clerk_user_id));

create policy "tasks_update_own"
on public.tasks
for update
using (public.owns_row(clerk_user_id))
with check (public.owns_row(clerk_user_id));

create policy "tasks_delete_own"
on public.tasks
for delete
using (public.owns_row(clerk_user_id));

create policy "memory_items_select_own"
on public.memory_items
for select
using (public.owns_row(clerk_user_id));

create policy "memory_items_insert_own"
on public.memory_items
for insert
with check (public.owns_row(clerk_user_id));

create policy "memory_items_update_own"
on public.memory_items
for update
using (public.owns_row(clerk_user_id))
with check (public.owns_row(clerk_user_id));

create policy "memory_items_delete_own"
on public.memory_items
for delete
using (public.owns_row(clerk_user_id));

create policy "subscriptions_select_own"
on public.subscriptions
for select
using (public.owns_row(clerk_user_id));

create policy "contact_submissions_select_own"
on public.contact_submissions
for select
using (
  clerk_user_id is not null
  and public.owns_row(clerk_user_id)
);

create policy "demo_requests_select_own"
on public.demo_requests
for select
using (
  clerk_user_id is not null
  and public.owns_row(clerk_user_id)
);

commit;
