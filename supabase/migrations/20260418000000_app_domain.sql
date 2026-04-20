-- App domain tables: items, tasks, activity feed, notifications
-- Also extends profiles with plan_type for server-side subscription state.

-- ── Extend profiles ──────────────────────────────────────────────────────────

alter table public.profiles add column if not exists plan_type text not null default 'free';

-- Replace placeholder column types/constraints with your actual business logic.
-- All tables include: soft deletes (deleted_at), RLS, updated_at trigger.

-- ── Enums ────────────────────────────────────────────────────────────────────

create type item_status as enum ('active', 'pending', 'archived');
create type task_state as enum ('todo', 'in-progress', 'review', 'done');
create type task_priority as enum ('low', 'medium', 'high');
create type activity_kind as enum ('milestone', 'comment', 'alert', 'review');
create type notification_category as enum ('billing', 'system', 'product', 'team');

-- ── Items ────────────────────────────────────────────────────────────────────

create table items (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid references auth.users(id) on delete cascade not null,
    name        text not null,
    owner       text not null default '',
    status      item_status not null default 'active',
    completion  integer not null default 0 check (completion >= 0 and completion <= 100),
    health      integer not null default 100 check (health >= 0 and health <= 100),
    active_users integer not null default 0,
    summary     text,
    deleted_at  timestamptz,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

alter table items enable row level security;

create policy "Users can read own items"
    on items for select using (auth.uid() = user_id and deleted_at is null);

create policy "Users can insert own items"
    on items for insert with check (auth.uid() = user_id);

create policy "Users can update own items"
    on items for update using (auth.uid() = user_id);

create trigger set_items_updated_at
    before update on items
    for each row execute function set_updated_at();

-- ── Tasks ────────────────────────────────────────────────────────────────────

create table tasks (
    id          uuid primary key default gen_random_uuid(),
    item_id     uuid references items(id) on delete cascade not null,
    user_id     uuid references auth.users(id) on delete cascade not null,
    title       text not null,
    state       task_state not null default 'todo',
    priority    task_priority not null default 'medium',
    due_date    date,
    deleted_at  timestamptz,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "Users can read own tasks"
    on tasks for select using (auth.uid() = user_id and deleted_at is null);

create policy "Users can insert own tasks"
    on tasks for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks"
    on tasks for update using (auth.uid() = user_id);

create trigger set_tasks_updated_at
    before update on tasks
    for each row execute function set_updated_at();

-- ── Activity feed ────────────────────────────────────────────────────────────

create table activity_feed (
    id          uuid primary key default gen_random_uuid(),
    item_id     uuid references items(id) on delete cascade not null,
    user_id     uuid references auth.users(id) on delete cascade not null,
    kind        activity_kind not null,
    title       text not null,
    detail      text,
    created_at  timestamptz not null default now()
);

alter table activity_feed enable row level security;

create policy "Users can read own activity"
    on activity_feed for select using (auth.uid() = user_id);

create policy "Users can insert own activity"
    on activity_feed for insert with check (auth.uid() = user_id);

-- ── Notifications ────────────────────────────────────────────────────────────

create table notifications (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid references auth.users(id) on delete cascade not null,
    title       text not null,
    body        text,
    category    notification_category not null default 'system',
    read        boolean not null default false,
    created_at  timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "Users can read own notifications"
    on notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
    on notifications for update using (auth.uid() = user_id);
