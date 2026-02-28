-- ============================================
-- Fresh install – Gnanalytica PM
-- Copy this file into Supabase SQL Editor and run once on an empty project.
-- Same content as migrations/20260101000000_initial.sql.
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

-- Add index on activity_log for My Issues activity feed
create index if not exists idx_activity_log_user_created
  on activity_log (user_id, created_at desc);

--
-- ============================================
-- Per-project workflow configuration
-- ============================================

-- Project Workflows table: stores custom statuses and transitions per project (idempotent for fresh install)
create table if not exists project_workflows (
  project_id uuid primary key references projects(id) on delete cascade,
  statuses jsonb not null default '[]'::jsonb,
  transitions jsonb default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

drop trigger if exists project_workflows_updated_at on project_workflows;
create trigger project_workflows_updated_at
  before update on project_workflows
  for each row
  execute function update_updated_at();

-- RLS (idempotent: drop if exists so safe after schema.sql)
alter table project_workflows enable row level security;

drop policy if exists "Workflows viewable by authenticated" on project_workflows;
create policy "Workflows viewable by authenticated"
  on project_workflows for select to authenticated using (true);

drop policy if exists "Authenticated can insert workflows" on project_workflows;
create policy "Authenticated can insert workflows"
  on project_workflows for insert to authenticated with check (true);

drop policy if exists "Authenticated can update workflows" on project_workflows;
create policy "Authenticated can update workflows"
  on project_workflows for update to authenticated using (true);

drop policy if exists "Authenticated can delete workflows" on project_workflows;
create policy "Authenticated can delete workflows"
  on project_workflows for delete to authenticated using (true);

-- Drop the CHECK constraint on tickets.status to allow custom status keys
alter table tickets drop constraint if exists tickets_status_check;

-- Replace sync_status_category trigger to handle custom statuses
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

-- ============================================
-- ONBOARDING STATE
-- ============================================

-- Tracks per-user onboarding progress.
-- step: 1-5 (current step), completed: whether onboarding is finished/skipped.
create table if not exists onboarding_state (
  user_id uuid primary key references profiles(id) on delete cascade,
  step int not null default 1 check (step between 1 and 5),
  completed boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table onboarding_state enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'onboarding_state' and policyname = 'Users can view own onboarding state') then
    create policy "Users can view own onboarding state" on onboarding_state for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'onboarding_state' and policyname = 'Users can insert own onboarding state') then
    create policy "Users can insert own onboarding state" on onboarding_state for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'onboarding_state' and policyname = 'Users can update own onboarding state') then
    create policy "Users can update own onboarding state" on onboarding_state for update to authenticated using (user_id = auth.uid());
  end if;
end $$;

-- Add core ticket fields: issue_type, story_points, start_date, parent_id, epic_id, full-text search

alter table tickets add column if not exists issue_type text default 'task';
alter table tickets add column if not exists story_points integer;
alter table tickets add column if not exists start_date date;
alter table tickets add column if not exists parent_id uuid references tickets(id) on delete set null;
alter table tickets add column if not exists epic_id uuid references tickets(id) on delete set null;

-- Constraints
alter table tickets add constraint tickets_issue_type_check
  check (issue_type in ('bug', 'feature', 'task', 'improvement', 'epic', 'story', 'sub_task'));

alter table tickets add constraint tickets_story_points_check
  check (story_points is null or story_points in (1, 2, 3, 5, 8, 13, 21));

-- Indexes
create index if not exists idx_tickets_parent_id on tickets(parent_id) where parent_id is not null;
create index if not exists idx_tickets_epic_id on tickets(epic_id) where epic_id is not null;
create index if not exists idx_tickets_issue_type on tickets(issue_type);

-- Full-text search vector
alter table tickets add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

create index if not exists idx_tickets_fts on tickets using gin(fts);

-- Ticket relations: blocks, blocked_by, related_to, duplicate_of

create table if not exists ticket_relations (
  id uuid primary key default gen_random_uuid(),
  source_ticket_id uuid not null references tickets(id) on delete cascade,
  target_ticket_id uuid not null references tickets(id) on delete cascade,
  relation_type text not null,
  created_at timestamptz default now(),

  constraint ticket_relations_type_check
    check (relation_type in ('blocks', 'blocked_by', 'related_to', 'duplicate_of')),
  constraint ticket_relations_no_self
    check (source_ticket_id != target_ticket_id),
  unique (source_ticket_id, target_ticket_id, relation_type)
);

create index if not exists idx_ticket_relations_source on ticket_relations(source_ticket_id);
create index if not exists idx_ticket_relations_target on ticket_relations(target_ticket_id);

-- RLS
alter table ticket_relations enable row level security;
create policy "Authenticated users can view relations" on ticket_relations for select to authenticated using (true);
create policy "Authenticated users can create relations" on ticket_relations for insert to authenticated with check (true);
create policy "Authenticated users can delete relations" on ticket_relations for delete to authenticated using (true);

-- Realtime
alter publication supabase_realtime add table ticket_relations;

-- Custom field definitions and values

create table if not exists custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  field_type text not null,
  options jsonb,
  required boolean default false,
  position integer default 0,
  created_at timestamptz default now(),

  constraint custom_field_type_check
    check (field_type in ('text', 'number', 'date', 'select', 'multi_select', 'checkbox', 'url'))
);

create index if not exists idx_custom_field_defs_project on custom_field_definitions(project_id);

create table if not exists ticket_custom_field_values (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  field_id uuid not null references custom_field_definitions(id) on delete cascade,
  value text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (ticket_id, field_id)
);

create index if not exists idx_custom_field_values_ticket on ticket_custom_field_values(ticket_id);

-- RLS
alter table custom_field_definitions enable row level security;
create policy "Authenticated users can manage custom fields" on custom_field_definitions for all to authenticated using (true) with check (true);

alter table ticket_custom_field_values enable row level security;
create policy "Authenticated users can manage field values" on ticket_custom_field_values for all to authenticated using (true) with check (true);

-- Multi-assignee junction table

create table if not exists ticket_assignees (
  ticket_id uuid not null references tickets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),

  primary key (ticket_id, user_id)
);

create index if not exists idx_ticket_assignees_user on ticket_assignees(user_id);

-- RLS
alter table ticket_assignees enable row level security;
create policy "Authenticated users can view assignees" on ticket_assignees for select to authenticated using (true);
create policy "Authenticated users can manage assignees" on ticket_assignees for insert to authenticated with check (true);
create policy "Authenticated users can remove assignees" on ticket_assignees for delete to authenticated using (true);

-- Realtime
alter publication supabase_realtime add table ticket_assignees;

-- Teams and team membership

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  color text default '#6e9ade',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_teams_project on teams(project_id);

create table if not exists team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text default 'member',
  created_at timestamptz default now(),

  primary key (team_id, user_id),
  constraint team_member_role_check check (role in ('lead', 'member'))
);

create index if not exists idx_team_members_user on team_members(user_id);

-- RLS
alter table teams enable row level security;
create policy "Authenticated users can manage teams" on teams for all to authenticated using (true) with check (true);

alter table team_members enable row level security;
create policy "Authenticated users can manage team members" on team_members for all to authenticated using (true) with check (true);

-- Milestones table and tickets.milestone_id FK

create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  target_date date,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint milestones_status_check check (status in ('active', 'completed', 'canceled'))
);

create index if not exists idx_milestones_project on milestones(project_id);

-- Add milestone_id to tickets
alter table tickets add column if not exists milestone_id uuid references milestones(id) on delete set null;
create index if not exists idx_tickets_milestone on tickets(milestone_id) where milestone_id is not null;

-- Realtime
alter publication supabase_realtime add table milestones;

-- RLS
alter table milestones enable row level security;
create policy "Authenticated users can manage milestones" on milestones for all to authenticated using (true) with check (true);

-- Add extra sprint/cycle fields

alter table cycles add column if not exists retrospective_notes text;
alter table cycles add column if not exists auto_rollover boolean default false;
alter table cycles add column if not exists status text default 'active';

alter table cycles add constraint cycles_status_check
  check (status in ('planned', 'active', 'completed'));

-- Ticket attachments

create table if not exists ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  uploaded_by uuid not null references profiles(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  file_size integer,
  created_at timestamptz default now()
);

create index if not exists idx_ticket_attachments_ticket on ticket_attachments(ticket_id);

-- RLS
alter table ticket_attachments enable row level security;
create policy "Authenticated users can view attachments" on ticket_attachments for select to authenticated using (true);
create policy "Authenticated users can upload attachments" on ticket_attachments for insert to authenticated with check (true);
create policy "Users can delete own attachments" on ticket_attachments for delete to authenticated using (uploaded_by = auth.uid());

-- Realtime
alter publication supabase_realtime add table ticket_attachments;

-- Customer portal tables

create table if not exists customer_orgs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  domain text,
  created_at timestamptz default now()
);

create index if not exists idx_customer_orgs_project on customer_orgs(project_id);

create table if not exists customer_users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references customer_orgs(id) on delete cascade,
  email text not null,
  name text,
  auth_user_id uuid unique,
  created_at timestamptz default now()
);

create index if not exists idx_customer_users_org on customer_users(org_id);
create index if not exists idx_customer_users_email on customer_users(email);

create table if not exists customer_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  customer_user_id uuid not null references customer_users(id) on delete cascade,
  created_at timestamptz default now(),

  unique (ticket_id, customer_user_id)
);

create table if not exists customer_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  customer_user_id uuid not null references customer_users(id) on delete cascade,
  body text not null,
  is_internal boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_customer_comments_ticket on customer_comments(ticket_id);

-- RLS
alter table customer_orgs enable row level security;
create policy "Authenticated users can manage customer orgs" on customer_orgs for all to authenticated using (true) with check (true);

alter table customer_users enable row level security;
create policy "Authenticated users can manage customer users" on customer_users for all to authenticated using (true) with check (true);

alter table customer_tickets enable row level security;
create policy "Authenticated users can manage customer tickets" on customer_tickets for all to authenticated using (true) with check (true);

alter table customer_comments enable row level security;
create policy "Authenticated users can manage customer comments" on customer_comments for all to authenticated using (true) with check (true);

-- Notification preferences per user

create table if not exists notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  email_enabled boolean default true,
  email_mode text default 'instant',
  push_enabled boolean default false,
  digest_enabled boolean default false,
  digest_frequency text default 'daily',
  notify_on_assign boolean default true,
  notify_on_mention boolean default true,
  notify_on_status_change boolean default true,
  notify_on_comment boolean default true,
  notify_on_due_date boolean default true,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz default now(),

  constraint email_mode_check check (email_mode in ('instant', 'digest', 'off')),
  constraint digest_frequency_check check (digest_frequency in ('daily', 'weekly'))
);

-- RLS
alter table notification_preferences enable row level security;
create policy "Users can manage own notification prefs" on notification_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- GitHub integrations and webhooks

create table if not exists github_integrations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  repo_owner text not null,
  repo_name text not null,
  installation_id text,
  access_token text,
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (project_id, repo_owner, repo_name)
);

create index if not exists idx_github_integrations_project on github_integrations(project_id);

create table if not exists ticket_github_links (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  github_integration_id uuid not null references github_integrations(id) on delete cascade,
  link_type text not null,
  url text not null,
  title text,
  number integer,
  state text,
  created_at timestamptz default now(),

  constraint link_type_check check (link_type in ('pr', 'issue', 'branch', 'commit'))
);

create index if not exists idx_ticket_github_links_ticket on ticket_github_links(ticket_id);

create table if not exists webhooks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  url text not null,
  secret text,
  events text[] default '{}',
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_webhooks_project on webhooks(project_id);

-- RLS
alter table github_integrations enable row level security;
create policy "Authenticated users can manage github integrations" on github_integrations for all to authenticated using (true) with check (true);

alter table ticket_github_links enable row level security;
create policy "Authenticated users can manage github links" on ticket_github_links for all to authenticated using (true) with check (true);

alter table webhooks enable row level security;
create policy "Authenticated users can manage webhooks" on webhooks for all to authenticated using (true) with check (true);

-- Add shared view support to saved_views

alter table saved_views add column if not exists is_shared boolean default false;
alter table saved_views add column if not exists share_token text;

-- Recent items tracking for command palette

create table if not exists recent_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  accessed_at timestamptz default now(),

  constraint recent_items_type_check check (item_type in ('ticket', 'project', 'milestone')),
  unique (user_id, item_type, item_id)
);

create index if not exists idx_recent_items_user on recent_items(user_id, accessed_at desc);

-- RLS
alter table recent_items enable row level security;
create policy "Users can manage own recent items" on recent_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Comment reactions (emoji reactions)

create table if not exists comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references comments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),

  unique (comment_id, user_id, emoji)
);

create index if not exists idx_comment_reactions_comment on comment_reactions(comment_id);

-- RLS
alter table comment_reactions enable row level security;
create policy "Authenticated users can view reactions" on comment_reactions for select to authenticated using (true);
create policy "Authenticated users can add reactions" on comment_reactions for insert to authenticated with check (user_id = auth.uid());
create policy "Users can remove own reactions" on comment_reactions for delete to authenticated using (user_id = auth.uid());

-- Realtime
alter publication supabase_realtime add table comment_reactions;

-- Project member roles

create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz default now(),

  primary key (project_id, user_id),
  constraint project_member_role_check check (role in ('owner', 'admin', 'member', 'viewer'))
);

create index if not exists idx_project_members_user on project_members(user_id);

-- RLS
alter table project_members enable row level security;
create policy "Authenticated users can view project members" on project_members for select to authenticated using (true);
create policy "Authenticated users can manage project members" on project_members for insert to authenticated with check (true);
create policy "Authenticated users can update project members" on project_members for update to authenticated using (true);
create policy "Authenticated users can remove project members" on project_members for delete to authenticated using (true);

-- Knowledge base articles

create table if not exists kb_articles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  body text,
  slug text,
  published boolean default false,
  author_id uuid not null references profiles(id) on delete cascade,
  category text,
  position integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_kb_articles_project on kb_articles(project_id);
create index if not exists idx_kb_articles_slug on kb_articles(project_id, slug);

-- RLS
alter table kb_articles enable row level security;
create policy "Authenticated users can manage kb articles" on kb_articles for all to authenticated using (true) with check (true);
create policy "Published articles are publicly readable" on kb_articles for select to anon using (published = true);

-- Full-text search function for tickets

create or replace function search_tickets(
  search_query text,
  p_project_id uuid default null,
  max_results integer default 20
)
returns table (
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  project_id uuid,
  rank real
)
language plpgsql
as $$
begin
  return query
  select
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.project_id,
    ts_rank(t.fts, websearch_to_tsquery('english', search_query)) as rank
  from tickets t
  where
    t.fts @@ websearch_to_tsquery('english', search_query)
    and (p_project_id is null or t.project_id = p_project_id)
  order by rank desc
  limit max_results;
end;
$$;

-- Workflow automation rules

create table if not exists workflow_automations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  enabled boolean default true,
  trigger_type text not null,
  trigger_config jsonb default '{}',
  action_type text not null,
  action_config jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint trigger_type_check check (trigger_type in ('status_change', 'label_added', 'assignee_changed', 'pr_merged', 'comment_added', 'due_date_reached')),
  constraint action_type_check check (action_type in ('change_status', 'add_label', 'assign_user', 'send_notification', 'move_to_cycle', 'add_comment'))
);

create index if not exists idx_workflow_automations_project on workflow_automations(project_id);

-- RLS
alter table workflow_automations enable row level security;
create policy "Authenticated users can manage automations" on workflow_automations for all to authenticated using (true) with check (true);
