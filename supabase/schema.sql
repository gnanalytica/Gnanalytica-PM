-- ============================================
-- Internal PM - Phase 1 MVP Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

-- Profiles (linked to auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  role text default 'member',
  created_at timestamptz default now()
);

-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Tickets
create table tickets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo',
  status_category text default 'unstarted' check (status_category in ('backlog', 'unstarted', 'started', 'completed', 'canceled')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  due_date date,
  position integer default 0
);

-- Project Workflows (per-project custom statuses and transitions)
create table project_workflows (
  project_id uuid primary key references projects(id) on delete cascade,
  statuses jsonb not null default '[]'::jsonb,
  transitions jsonb default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Labels
create table labels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  color text not null default '#6b7280'
);

-- Ticket Labels (junction table)
create table ticket_labels (
  ticket_id uuid references tickets(id) on delete cascade,
  label_id uuid references labels(id) on delete cascade,
  primary key (ticket_id, label_id)
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  body text not null,
  parent_id uuid references comments(id) on delete cascade,
  created_at timestamptz default now()
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  ticket_id uuid references tickets(id) on delete cascade,
  type text not null,
  read boolean default false,
  actor_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_tickets_project_id on tickets(project_id);
create index idx_tickets_assignee_id on tickets(assignee_id);
create index idx_tickets_status on tickets(status);
create index idx_tickets_status_category on tickets(status_category);
create index idx_tickets_project_status_category on tickets(project_id, status_category);
create index idx_tickets_created_by on tickets(created_by);
create index idx_tickets_position on tickets(project_id, status, position);
create index idx_labels_project_id on labels(project_id);
create index idx_ticket_labels_ticket_id on ticket_labels(ticket_id);
create index idx_ticket_labels_label_id on ticket_labels(label_id);
create index idx_comments_ticket_id on comments(ticket_id);
create index idx_comments_parent_id on comments(parent_id);
create index idx_notifications_user_id on notifications(user_id);
create index idx_notifications_read on notifications(user_id, read);
create index idx_notifications_actor_id on notifications(actor_id);

-- ============================================
-- UPDATED_AT TRIGGER FOR TICKETS
-- ============================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at();

-- ============================================
-- AUTO-SYNC STATUS_CATEGORY FROM STATUS
-- ============================================

create or replace function sync_status_category()
returns trigger as $$
declare
  _cat text;
begin
  -- First try the 5 built-in statuses
  _cat := case new.status
    when 'backlog'     then 'backlog'
    when 'todo'        then 'unstarted'
    when 'in_progress' then 'started'
    when 'done'        then 'completed'
    when 'canceled'    then 'canceled'
    else null
  end;

  -- If not a built-in status, look up the project's workflow
  if _cat is null then
    select s->>'category' into _cat
    from project_workflows pw,
         jsonb_array_elements(pw.statuses) as s
    where pw.project_id = new.project_id
      and s->>'key' = new.status
    limit 1;
  end if;

  new.status_category = coalesce(_cat, coalesce(new.status_category, 'unstarted'));
  return new;
end;
$$ language plpgsql;

create trigger tickets_sync_status_category
  before insert or update of status on tickets
  for each row
  execute function sync_status_category();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table profiles enable row level security;
alter table projects enable row level security;
alter table tickets enable row level security;
alter table labels enable row level security;
alter table ticket_labels enable row level security;
alter table comments enable row level security;
alter table notifications enable row level security;

-- Profiles: authenticated users can read all, update own
create policy "Profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Projects: authenticated users can CRUD
create policy "Projects are viewable by authenticated users"
  on projects for select
  to authenticated
  using (true);

create policy "Authenticated users can create projects"
  on projects for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update projects"
  on projects for update
  to authenticated
  using (true);

create policy "Authenticated users can delete projects"
  on projects for delete
  to authenticated
  using (true);

-- Project Workflows: authenticated users can CRUD
alter table project_workflows enable row level security;

create policy "Workflows viewable by authenticated"
  on project_workflows for select to authenticated using (true);
create policy "Authenticated can insert workflows"
  on project_workflows for insert to authenticated with check (true);
create policy "Authenticated can update workflows"
  on project_workflows for update to authenticated using (true);
create policy "Authenticated can delete workflows"
  on project_workflows for delete to authenticated using (true);

create trigger project_workflows_updated_at
  before update on project_workflows
  for each row
  execute function update_updated_at();

-- Tickets: authenticated users can CRUD
create policy "Tickets are viewable by authenticated users"
  on tickets for select
  to authenticated
  using (true);

create policy "Authenticated users can create tickets"
  on tickets for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update tickets"
  on tickets for update
  to authenticated
  using (true);

create policy "Authenticated users can delete tickets"
  on tickets for delete
  to authenticated
  using (true);

-- Labels: authenticated users can CRUD
create policy "Labels are viewable by authenticated users"
  on labels for select
  to authenticated
  using (true);

create policy "Authenticated users can create labels"
  on labels for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update labels"
  on labels for update
  to authenticated
  using (true);

create policy "Authenticated users can delete labels"
  on labels for delete
  to authenticated
  using (true);

-- Ticket Labels: authenticated users can CRUD
create policy "Ticket labels are viewable by authenticated users"
  on ticket_labels for select
  to authenticated
  using (true);

create policy "Authenticated users can create ticket labels"
  on ticket_labels for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete ticket labels"
  on ticket_labels for delete
  to authenticated
  using (true);

-- Comments: authenticated users can read all, create own, update/delete own
create policy "Comments are viewable by authenticated users"
  on comments for select
  to authenticated
  using (true);

create policy "Authenticated users can create comments"
  on comments for insert
  to authenticated
  with check (true);

create policy "Users can update own comments"
  on comments for update
  to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own comments"
  on comments for delete
  to authenticated
  using (user_id = auth.uid());

-- Notifications: users can only see/update their own
create policy "Users can view own notifications"
  on notifications for select
  to authenticated
  using (user_id = auth.uid());

create policy "Authenticated users can create notifications"
  on notifications for insert
  to authenticated
  with check (true);

create policy "Users can update own notifications"
  on notifications for update
  to authenticated
  using (user_id = auth.uid());

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'User'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

-- Ticket Watchers
create table ticket_watchers (
  ticket_id uuid references tickets(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (ticket_id, user_id)
);

create index idx_ticket_watchers_ticket_id on ticket_watchers(ticket_id);
create index idx_ticket_watchers_user_id on ticket_watchers(user_id);

alter table ticket_watchers enable row level security;

create policy "Watchers viewable by authenticated"
  on ticket_watchers for select to authenticated using (true);
create policy "Authenticated can insert watchers"
  on ticket_watchers for insert to authenticated with check (true);
create policy "Authenticated can delete watchers"
  on ticket_watchers for delete to authenticated using (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================

alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table ticket_watchers;

-- ============================================
-- ACTIVITY LOG
-- ============================================

create table activity_log (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  action text not null,          -- 'ticket_created' | 'status_changed' | 'assignee_changed' | 'comment_added'
  field text,                    -- e.g. 'status', 'assignee_id'
  old_value text,
  new_value text,
  created_at timestamptz default now()
);
create index idx_activity_log_ticket_id on activity_log(ticket_id);
create index idx_activity_log_user_created on activity_log(user_id, created_at desc);

-- RLS: authenticated can read all, insert own
alter table activity_log enable row level security;
create policy "Activity logs viewable by authenticated" on activity_log for select to authenticated using (true);
create policy "Authenticated can insert activity logs" on activity_log for insert to authenticated with check (true);

alter publication supabase_realtime add table activity_log;

-- ============================================
-- SAVED VIEWS
-- ============================================

create table saved_views (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  created_by uuid references profiles(id) not null,
  name text not null,
  filters jsonb default '{}',
  sort_key text default 'updated_at',
  sort_dir text default 'desc',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_saved_views_project_id on saved_views(project_id);
create index idx_saved_views_created_by on saved_views(created_by);

alter table saved_views enable row level security;

create policy "Saved views viewable by owner"
  on saved_views for select to authenticated
  using (created_by = auth.uid());

create policy "Users can insert own saved views"
  on saved_views for insert to authenticated
  with check (created_by = auth.uid());

create policy "Users can update own saved views"
  on saved_views for update to authenticated
  using (created_by = auth.uid());

create policy "Users can delete own saved views"
  on saved_views for delete to authenticated
  using (created_by = auth.uid());

create trigger saved_views_updated_at
  before update on saved_views
  for each row
  execute function update_updated_at();

-- ============================================
-- CYCLE PLANNING
-- ============================================

-- Cycles scoped to a project (e.g. Sprint 1, Sprint 2)
create table cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  project_id uuid references projects(id) on delete cascade not null,
  created_at timestamptz default now(),
  constraint cycles_dates_valid check (end_date >= start_date)
);

-- Junction: tickets <-> cycles (many-to-many)
create table ticket_cycles (
  ticket_id uuid references tickets(id) on delete cascade,
  cycle_id uuid references cycles(id) on delete cascade,
  primary key (ticket_id, cycle_id)
);

create index idx_cycles_project_id on cycles(project_id);
create index idx_cycles_dates on cycles(project_id, start_date, end_date);
create index idx_ticket_cycles_ticket_id on ticket_cycles(ticket_id);
create index idx_ticket_cycles_cycle_id on ticket_cycles(cycle_id);

alter table cycles enable row level security;
alter table ticket_cycles enable row level security;

create policy "Cycles viewable by authenticated"
  on cycles for select to authenticated using (true);
create policy "Authenticated can create cycles"
  on cycles for insert to authenticated with check (true);
create policy "Authenticated can update cycles"
  on cycles for update to authenticated using (true);
create policy "Authenticated can delete cycles"
  on cycles for delete to authenticated using (true);

create policy "Ticket cycles viewable by authenticated"
  on ticket_cycles for select to authenticated using (true);
create policy "Authenticated can create ticket cycles"
  on ticket_cycles for insert to authenticated with check (true);
create policy "Authenticated can delete ticket cycles"
  on ticket_cycles for delete to authenticated using (true);
