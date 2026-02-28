-- Create all remaining tables missing from the database

-- ── Ticket Relations ──

create table if not exists ticket_relations (
  id uuid primary key default gen_random_uuid(),
  source_ticket_id uuid not null references tickets(id) on delete cascade,
  target_ticket_id uuid not null references tickets(id) on delete cascade,
  relation_type text not null,
  created_at timestamptz default now(),
  constraint ticket_relations_type_check check (relation_type in ('blocks', 'blocked_by', 'related_to', 'duplicate_of')),
  constraint ticket_relations_no_self check (source_ticket_id != target_ticket_id),
  unique (source_ticket_id, target_ticket_id, relation_type)
);
create index if not exists idx_ticket_relations_source on ticket_relations(source_ticket_id);
create index if not exists idx_ticket_relations_target on ticket_relations(target_ticket_id);
alter table ticket_relations enable row level security;
create policy "Authenticated users can view relations" on ticket_relations for select to authenticated using (true);
create policy "Authenticated users can create relations" on ticket_relations for insert to authenticated with check (true);
create policy "Authenticated users can delete relations" on ticket_relations for delete to authenticated using (true);

-- ── Custom Fields ──

create table if not exists custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  field_type text not null,
  options jsonb,
  required boolean default false,
  position integer default 0,
  created_at timestamptz default now(),
  constraint custom_field_type_check check (field_type in ('text', 'number', 'date', 'select', 'multi_select', 'checkbox', 'url'))
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
alter table custom_field_definitions enable row level security;
create policy "Authenticated users can manage custom fields" on custom_field_definitions for all to authenticated using (true) with check (true);
alter table ticket_custom_field_values enable row level security;
create policy "Authenticated users can manage field values" on ticket_custom_field_values for all to authenticated using (true) with check (true);

-- ── Multi-Assignee ──

create table if not exists ticket_assignees (
  ticket_id uuid not null references tickets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (ticket_id, user_id)
);
create index if not exists idx_ticket_assignees_user on ticket_assignees(user_id);
alter table ticket_assignees enable row level security;
create policy "Authenticated users can view assignees" on ticket_assignees for select to authenticated using (true);
create policy "Authenticated users can manage assignees" on ticket_assignees for insert to authenticated with check (true);
create policy "Authenticated users can remove assignees" on ticket_assignees for delete to authenticated using (true);

-- ── Teams ──

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
alter table teams enable row level security;
create policy "Authenticated users can manage teams" on teams for all to authenticated using (true) with check (true);
alter table team_members enable row level security;
create policy "Authenticated users can manage team members" on team_members for all to authenticated using (true) with check (true);

-- ── Cycle extra columns ──

alter table cycles add column if not exists retrospective_notes text;
alter table cycles add column if not exists auto_rollover boolean default false;
alter table cycles add column if not exists status text default 'active';
do $$ begin
  alter table cycles add constraint cycles_status_check check (status in ('planned', 'active', 'completed'));
exception when duplicate_object then null;
end $$;

-- ── Ticket Attachments ──

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
alter table ticket_attachments enable row level security;
create policy "Authenticated users can view attachments" on ticket_attachments for select to authenticated using (true);
create policy "Authenticated users can upload attachments" on ticket_attachments for insert to authenticated with check (true);
create policy "Users can delete own attachments" on ticket_attachments for delete to authenticated using (uploaded_by = auth.uid());

-- ── Customer Portal ──

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

alter table customer_orgs enable row level security;
create policy "Authenticated users can manage customer orgs" on customer_orgs for all to authenticated using (true) with check (true);
alter table customer_users enable row level security;
create policy "Authenticated users can manage customer users" on customer_users for all to authenticated using (true) with check (true);
alter table customer_tickets enable row level security;
create policy "Authenticated users can manage customer tickets" on customer_tickets for all to authenticated using (true) with check (true);
alter table customer_comments enable row level security;
create policy "Authenticated users can manage customer comments" on customer_comments for all to authenticated using (true) with check (true);

-- ── Notification Preferences ──

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
alter table notification_preferences enable row level security;
create policy "Users can manage own notification prefs" on notification_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── GitHub Integrations ──

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

alter table github_integrations enable row level security;
create policy "Authenticated users can manage github integrations" on github_integrations for all to authenticated using (true) with check (true);
alter table ticket_github_links enable row level security;
create policy "Authenticated users can manage github links" on ticket_github_links for all to authenticated using (true) with check (true);
alter table webhooks enable row level security;
create policy "Authenticated users can manage webhooks" on webhooks for all to authenticated using (true) with check (true);

-- ── Comment Reactions ──

create table if not exists comment_reactions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references comments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique (comment_id, user_id, emoji)
);
create index if not exists idx_comment_reactions_comment on comment_reactions(comment_id);
alter table comment_reactions enable row level security;
create policy "Authenticated users can view reactions" on comment_reactions for select to authenticated using (true);
create policy "Authenticated users can add reactions" on comment_reactions for insert to authenticated with check (user_id = auth.uid());
create policy "Users can remove own reactions" on comment_reactions for delete to authenticated using (user_id = auth.uid());

-- ── Project Members ──

create table if not exists project_members (
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz default now(),
  primary key (project_id, user_id),
  constraint project_member_role_check check (role in ('owner', 'admin', 'member', 'viewer'))
);
create index if not exists idx_project_members_user on project_members(user_id);
alter table project_members enable row level security;
create policy "Authenticated users can view project members" on project_members for select to authenticated using (true);
create policy "Authenticated users can manage project members" on project_members for insert to authenticated with check (true);
create policy "Authenticated users can update project members" on project_members for update to authenticated using (true);
create policy "Authenticated users can remove project members" on project_members for delete to authenticated using (true);

-- ── Knowledge Base ──

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
alter table kb_articles enable row level security;
create policy "Authenticated users can manage kb articles" on kb_articles for all to authenticated using (true) with check (true);
create policy "Published articles are publicly readable" on kb_articles for select to anon using (published = true);

-- ── Workflow Automations ──

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
alter table workflow_automations enable row level security;
create policy "Authenticated users can manage automations" on workflow_automations for all to authenticated using (true) with check (true);

-- ── Reload PostgREST schema cache ──
NOTIFY pgrst, 'reload schema';
