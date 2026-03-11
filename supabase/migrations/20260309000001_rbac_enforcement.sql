-- ============================================
-- RBAC Enforcement Migration
-- Replaces permissive (using true) RLS policies with role-aware policies
-- based on project_members roles: owner(4), admin(3), member(2), viewer(1)
-- ============================================

-- ============================================
-- 1. HELPER FUNCTIONS
-- ============================================

-- Role level helper: owner=4, admin=3, member=2, viewer=1
create or replace function role_level(r text) returns int as $$
  select case r when 'owner' then 4 when 'admin' then 3 when 'member' then 2 when 'viewer' then 1 else 0 end;
$$ language sql immutable;

-- Check if current user has at least min_role on a project
create or replace function has_project_access(p_id uuid, min_role text) returns boolean as $$
  select exists (
    select 1 from project_members
    where project_id = p_id and user_id = auth.uid()
      and role_level(role) >= role_level(min_role)
  );
$$ language sql stable security definer;

-- ============================================
-- 2. DATA MIGRATION: Backfill project owners
-- ============================================

-- Insert project_members(project_id, user_id, role='owner') for every
-- project's created_by user that doesn't already have an entry
insert into project_members (project_id, user_id, role)
select p.id, p.created_by, 'owner'
from projects p
where p.created_by is not null
  and not exists (
    select 1 from project_members pm
    where pm.project_id = p.id and pm.user_id = p.created_by
  );

-- ============================================
-- 3. TRIGGER: Auto-add project owner on creation
-- ============================================

create or replace function auto_add_project_owner()
returns trigger as $$
begin
  if new.created_by is not null then
    insert into project_members (project_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict (project_id, user_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists auto_add_project_owner on projects;
create trigger auto_add_project_owner
  after insert on projects
  for each row
  execute function auto_add_project_owner();

-- ============================================
-- 4. DROP ALL EXISTING PERMISSIVE RLS POLICIES
-- ============================================

-- projects
drop policy if exists "Projects are viewable by authenticated users" on projects;
drop policy if exists "Authenticated users can create projects" on projects;
drop policy if exists "Authenticated users can update projects" on projects;
drop policy if exists "Authenticated users can delete projects" on projects;

-- tickets
drop policy if exists "Tickets are viewable by authenticated users" on tickets;
drop policy if exists "Authenticated users can create tickets" on tickets;
drop policy if exists "Authenticated users can update tickets" on tickets;
drop policy if exists "Authenticated users can delete tickets" on tickets;

-- labels
drop policy if exists "Labels are viewable by authenticated users" on labels;
drop policy if exists "Authenticated users can create labels" on labels;
drop policy if exists "Authenticated users can update labels" on labels;
drop policy if exists "Authenticated users can delete labels" on labels;

-- ticket_labels
drop policy if exists "Ticket labels are viewable by authenticated users" on ticket_labels;
drop policy if exists "Authenticated users can create ticket labels" on ticket_labels;
drop policy if exists "Authenticated users can delete ticket labels" on ticket_labels;

-- ticket_assignees
drop policy if exists "Authenticated users can view assignees" on ticket_assignees;
drop policy if exists "Authenticated users can manage assignees" on ticket_assignees;
drop policy if exists "Authenticated users can remove assignees" on ticket_assignees;

-- project_workflows
drop policy if exists "Workflows viewable by authenticated" on project_workflows;
drop policy if exists "Authenticated can insert workflows" on project_workflows;
drop policy if exists "Authenticated can update workflows" on project_workflows;
drop policy if exists "Authenticated can delete workflows" on project_workflows;

-- project_members
drop policy if exists "Authenticated users can view project members" on project_members;
drop policy if exists "Authenticated users can manage project members" on project_members;
drop policy if exists "Authenticated users can update project members" on project_members;
drop policy if exists "Authenticated users can remove project members" on project_members;

-- comments
drop policy if exists "Comments are viewable by authenticated users" on comments;
drop policy if exists "Authenticated users can create comments" on comments;
drop policy if exists "Users can update own comments" on comments;
drop policy if exists "Users can delete own comments" on comments;

-- cycles
drop policy if exists "Cycles viewable by authenticated" on cycles;
drop policy if exists "Authenticated can create cycles" on cycles;
drop policy if exists "Authenticated can update cycles" on cycles;
drop policy if exists "Authenticated can delete cycles" on cycles;

-- ticket_cycles
drop policy if exists "Ticket cycles viewable by authenticated" on ticket_cycles;
drop policy if exists "Authenticated can create ticket cycles" on ticket_cycles;
drop policy if exists "Authenticated can delete ticket cycles" on ticket_cycles;

-- milestones
drop policy if exists "Authenticated users can manage milestones" on milestones;

-- saved_views
drop policy if exists "Saved views viewable by owner" on saved_views;
drop policy if exists "Users can insert own saved views" on saved_views;
drop policy if exists "Users can update own saved views" on saved_views;
drop policy if exists "Users can delete own saved views" on saved_views;

-- activity_log
drop policy if exists "Activity logs viewable by authenticated" on activity_log;
drop policy if exists "Authenticated can insert activity logs" on activity_log;

-- ticket_watchers
drop policy if exists "Watchers viewable by authenticated" on ticket_watchers;
drop policy if exists "Authenticated can insert watchers" on ticket_watchers;
drop policy if exists "Authenticated can delete watchers" on ticket_watchers;

-- ticket_relations
drop policy if exists "Authenticated users can view relations" on ticket_relations;
drop policy if exists "Authenticated users can create relations" on ticket_relations;
drop policy if exists "Authenticated users can delete relations" on ticket_relations;

-- custom_field_definitions
drop policy if exists "Authenticated users can manage custom fields" on custom_field_definitions;

-- ticket_custom_field_values
drop policy if exists "Authenticated users can manage field values" on ticket_custom_field_values;

-- ticket_attachments
drop policy if exists "Authenticated users can view attachments" on ticket_attachments;
drop policy if exists "Authenticated users can upload attachments" on ticket_attachments;
drop policy if exists "Users can delete own attachments" on ticket_attachments;

-- comment_reactions
drop policy if exists "Authenticated users can view reactions" on comment_reactions;
drop policy if exists "Authenticated users can add reactions" on comment_reactions;
drop policy if exists "Users can remove own reactions" on comment_reactions;

-- kb_articles
drop policy if exists "Authenticated users can manage kb articles" on kb_articles;
drop policy if exists "Published articles are publicly readable" on kb_articles;

-- workflow_automations
drop policy if exists "Authenticated users can manage automations" on workflow_automations;

-- github_integrations
drop policy if exists "Authenticated users can manage github integrations" on github_integrations;

-- ticket_github_links
drop policy if exists "Authenticated users can manage github links" on ticket_github_links;

-- webhooks
drop policy if exists "Authenticated users can manage webhooks" on webhooks;

-- teams
drop policy if exists "Authenticated users can manage teams" on teams;

-- team_members
drop policy if exists "Authenticated users can manage team members" on team_members;

-- customer_orgs
drop policy if exists "Authenticated users can manage customer orgs" on customer_orgs;

-- customer_users
drop policy if exists "Authenticated users can manage customer users" on customer_users;

-- customer_tickets
drop policy if exists "Authenticated users can manage customer tickets" on customer_tickets;

-- customer_comments
drop policy if exists "Authenticated users can manage customer comments" on customer_comments;

-- ============================================
-- 5. CREATE NEW ROLE-AWARE RLS POLICIES
-- ============================================

-- Ensure RLS is still enabled on all tables
alter table projects enable row level security;
alter table tickets enable row level security;
alter table labels enable row level security;
alter table ticket_labels enable row level security;
alter table ticket_assignees enable row level security;
alter table project_workflows enable row level security;
alter table project_members enable row level security;
alter table comments enable row level security;
alter table cycles enable row level security;
alter table ticket_cycles enable row level security;
alter table milestones enable row level security;
alter table saved_views enable row level security;
alter table activity_log enable row level security;
alter table ticket_watchers enable row level security;
alter table ticket_relations enable row level security;
alter table custom_field_definitions enable row level security;
alter table ticket_custom_field_values enable row level security;
alter table ticket_attachments enable row level security;
alter table comment_reactions enable row level security;
alter table kb_articles enable row level security;
alter table workflow_automations enable row level security;
alter table github_integrations enable row level security;
alter table ticket_github_links enable row level security;
alter table webhooks enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table customer_orgs enable row level security;
alter table customer_users enable row level security;
alter table customer_tickets enable row level security;
alter table customer_comments enable row level security;

-- ----------------------------------------
-- PROJECTS
-- ----------------------------------------
create policy "projects_select_role" on projects
  for select to authenticated
  using (has_project_access(id, 'viewer') or created_by = auth.uid());

create policy "projects_insert_role" on projects
  for insert to authenticated
  with check (true);

create policy "projects_update_role" on projects
  for update to authenticated
  using (has_project_access(id, 'admin'));

create policy "projects_delete_role" on projects
  for delete to authenticated
  using (has_project_access(id, 'owner'));

-- ----------------------------------------
-- TICKETS
-- ----------------------------------------
create policy "tickets_select_role" on tickets
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "tickets_insert_role" on tickets
  for insert to authenticated
  with check (has_project_access(project_id, 'member'));

create policy "tickets_update_role" on tickets
  for update to authenticated
  using (has_project_access(project_id, 'member'));

create policy "tickets_delete_role" on tickets
  for delete to authenticated
  using (has_project_access(project_id, 'admin'));

-- ----------------------------------------
-- LABELS (project_id directly)
-- ----------------------------------------
create policy "labels_select_role" on labels
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "labels_insert_role" on labels
  for insert to authenticated
  with check (has_project_access(project_id, 'member'));

create policy "labels_update_role" on labels
  for update to authenticated
  using (has_project_access(project_id, 'member'));

create policy "labels_delete_role" on labels
  for delete to authenticated
  using (has_project_access(project_id, 'member'));

-- ----------------------------------------
-- TICKET_LABELS (via ticket -> project)
-- ----------------------------------------
create policy "ticket_labels_select_role" on ticket_labels
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_labels.ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "ticket_labels_insert_role" on ticket_labels
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = ticket_labels.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "ticket_labels_delete_role" on ticket_labels
  for delete to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_labels.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- TICKET_ASSIGNEES (via ticket -> project)
-- ----------------------------------------
create policy "ticket_assignees_select_role" on ticket_assignees
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_assignees.ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "ticket_assignees_insert_role" on ticket_assignees
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = ticket_assignees.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "ticket_assignees_delete_role" on ticket_assignees
  for delete to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_assignees.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- PROJECT_MEMBERS
-- ----------------------------------------
create policy "project_members_select_role" on project_members
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "project_members_insert_role" on project_members
  for insert to authenticated
  with check (has_project_access(project_id, 'admin'));

create policy "project_members_update_role" on project_members
  for update to authenticated
  using (has_project_access(project_id, 'admin'));

create policy "project_members_delete_role" on project_members
  for delete to authenticated
  using (has_project_access(project_id, 'admin'));

-- ----------------------------------------
-- COMMENTS (via ticket -> project)
-- ----------------------------------------
create policy "comments_select_role" on comments
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = comments.ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "comments_insert_role" on comments
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = comments.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "comments_update_role" on comments
  for update to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from tickets t where t.id = comments.ticket_id
        and has_project_access(t.project_id, 'member')
    )
  );

create policy "comments_delete_role" on comments
  for delete to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from tickets t where t.id = comments.ticket_id
        and has_project_access(t.project_id, 'member')
    )
  );

-- ----------------------------------------
-- PROJECT_WORKFLOWS
-- ----------------------------------------
create policy "project_workflows_select_role" on project_workflows
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "project_workflows_insert_role" on project_workflows
  for insert to authenticated
  with check (has_project_access(project_id, 'admin'));

create policy "project_workflows_update_role" on project_workflows
  for update to authenticated
  using (has_project_access(project_id, 'admin'));

create policy "project_workflows_delete_role" on project_workflows
  for delete to authenticated
  using (has_project_access(project_id, 'admin'));

-- ----------------------------------------
-- CYCLES
-- ----------------------------------------
create policy "cycles_select_role" on cycles
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "cycles_insert_role" on cycles
  for insert to authenticated
  with check (has_project_access(project_id, 'member'));

create policy "cycles_update_role" on cycles
  for update to authenticated
  using (has_project_access(project_id, 'member'));

create policy "cycles_delete_role" on cycles
  for delete to authenticated
  using (has_project_access(project_id, 'member'));

-- ----------------------------------------
-- TICKET_CYCLES (via cycle -> project)
-- ----------------------------------------
create policy "ticket_cycles_select_role" on ticket_cycles
  for select to authenticated
  using (exists (
    select 1 from cycles c where c.id = ticket_cycles.cycle_id
      and has_project_access(c.project_id, 'viewer')
  ));

create policy "ticket_cycles_insert_role" on ticket_cycles
  for insert to authenticated
  with check (exists (
    select 1 from cycles c where c.id = ticket_cycles.cycle_id
      and has_project_access(c.project_id, 'member')
  ));

create policy "ticket_cycles_delete_role" on ticket_cycles
  for delete to authenticated
  using (exists (
    select 1 from cycles c where c.id = ticket_cycles.cycle_id
      and has_project_access(c.project_id, 'member')
  ));

-- ----------------------------------------
-- MILESTONES
-- ----------------------------------------
create policy "milestones_select_role" on milestones
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "milestones_insert_role" on milestones
  for insert to authenticated
  with check (has_project_access(project_id, 'member'));

create policy "milestones_update_role" on milestones
  for update to authenticated
  using (has_project_access(project_id, 'member'));

create policy "milestones_delete_role" on milestones
  for delete to authenticated
  using (has_project_access(project_id, 'member'));

-- ----------------------------------------
-- SAVED_VIEWS
-- ----------------------------------------
create policy "saved_views_select_role" on saved_views
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "saved_views_insert_role" on saved_views
  for insert to authenticated
  with check (has_project_access(project_id, 'member'));

create policy "saved_views_update_role" on saved_views
  for update to authenticated
  using (created_by = auth.uid());

create policy "saved_views_delete_role" on saved_views
  for delete to authenticated
  using (created_by = auth.uid());

-- ----------------------------------------
-- ACTIVITY_LOG (via ticket -> project)
-- ----------------------------------------
create policy "activity_log_select_role" on activity_log
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = activity_log.ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "activity_log_insert_role" on activity_log
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = activity_log.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- TICKET_WATCHERS (via ticket -> project)
-- ----------------------------------------
create policy "ticket_watchers_select_role" on ticket_watchers
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_watchers.ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "ticket_watchers_insert_role" on ticket_watchers
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = ticket_watchers.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "ticket_watchers_delete_role" on ticket_watchers
  for delete to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_watchers.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- TICKET_RELATIONS (via source ticket -> project)
-- ----------------------------------------
create policy "ticket_relations_select_role" on ticket_relations
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_relations.source_ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "ticket_relations_insert_role" on ticket_relations
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = ticket_relations.source_ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "ticket_relations_delete_role" on ticket_relations
  for delete to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_relations.source_ticket_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- CUSTOM_FIELD_DEFINITIONS (project_id directly)
-- ----------------------------------------
create policy "custom_field_definitions_select_role" on custom_field_definitions
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "custom_field_definitions_insert_role" on custom_field_definitions
  for insert to authenticated
  with check (has_project_access(project_id, 'member'));

create policy "custom_field_definitions_update_role" on custom_field_definitions
  for update to authenticated
  using (has_project_access(project_id, 'member'));

create policy "custom_field_definitions_delete_role" on custom_field_definitions
  for delete to authenticated
  using (has_project_access(project_id, 'member'));

-- ----------------------------------------
-- TICKET_CUSTOM_FIELD_VALUES (via ticket -> project)
-- ----------------------------------------
create policy "ticket_custom_field_values_select_role" on ticket_custom_field_values
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_custom_field_values.ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "ticket_custom_field_values_insert_role" on ticket_custom_field_values
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = ticket_custom_field_values.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "ticket_custom_field_values_update_role" on ticket_custom_field_values
  for update to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_custom_field_values.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "ticket_custom_field_values_delete_role" on ticket_custom_field_values
  for delete to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_custom_field_values.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- TICKET_ATTACHMENTS (via ticket -> project)
-- ----------------------------------------
create policy "ticket_attachments_select_role" on ticket_attachments
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_attachments.ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "ticket_attachments_insert_role" on ticket_attachments
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = ticket_attachments.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "ticket_attachments_update_role" on ticket_attachments
  for update to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_attachments.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "ticket_attachments_delete_role" on ticket_attachments
  for delete to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_attachments.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- COMMENT_REACTIONS (via comment -> ticket -> project)
-- ----------------------------------------
create policy "comment_reactions_select_role" on comment_reactions
  for select to authenticated
  using (exists (
    select 1 from comments c
    join tickets t on t.id = c.ticket_id
    where c.id = comment_reactions.comment_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "comment_reactions_insert_role" on comment_reactions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from comments c
      join tickets t on t.id = c.ticket_id
      where c.id = comment_reactions.comment_id
        and has_project_access(t.project_id, 'member')
    )
  );

create policy "comment_reactions_delete_role" on comment_reactions
  for delete to authenticated
  using (
    user_id = auth.uid()
    and exists (
      select 1 from comments c
      join tickets t on t.id = c.ticket_id
      where c.id = comment_reactions.comment_id
        and has_project_access(t.project_id, 'member')
    )
  );

-- ----------------------------------------
-- KB_ARTICLES
-- ----------------------------------------
-- Public read for portal (published articles)
create policy "kb_articles_select_public" on kb_articles
  for select to anon
  using (published = true);

-- Authenticated: viewer can see all articles in their projects
create policy "kb_articles_select_role" on kb_articles
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "kb_articles_insert_role" on kb_articles
  for insert to authenticated
  with check (has_project_access(project_id, 'member'));

create policy "kb_articles_update_role" on kb_articles
  for update to authenticated
  using (has_project_access(project_id, 'member'));

create policy "kb_articles_delete_role" on kb_articles
  for delete to authenticated
  using (has_project_access(project_id, 'member'));

-- ----------------------------------------
-- WORKFLOW_AUTOMATIONS
-- ----------------------------------------
create policy "workflow_automations_select_role" on workflow_automations
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "workflow_automations_insert_role" on workflow_automations
  for insert to authenticated
  with check (has_project_access(project_id, 'admin'));

create policy "workflow_automations_update_role" on workflow_automations
  for update to authenticated
  using (has_project_access(project_id, 'admin'));

create policy "workflow_automations_delete_role" on workflow_automations
  for delete to authenticated
  using (has_project_access(project_id, 'admin'));

-- ----------------------------------------
-- GITHUB_INTEGRATIONS
-- ----------------------------------------
create policy "github_integrations_select_role" on github_integrations
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "github_integrations_insert_role" on github_integrations
  for insert to authenticated
  with check (has_project_access(project_id, 'admin'));

create policy "github_integrations_update_role" on github_integrations
  for update to authenticated
  using (has_project_access(project_id, 'admin'));

create policy "github_integrations_delete_role" on github_integrations
  for delete to authenticated
  using (has_project_access(project_id, 'admin'));

-- ----------------------------------------
-- TICKET_GITHUB_LINKS (via ticket -> project)
-- ----------------------------------------
create policy "ticket_github_links_select_role" on ticket_github_links
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_github_links.ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "ticket_github_links_insert_role" on ticket_github_links
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = ticket_github_links.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "ticket_github_links_update_role" on ticket_github_links
  for update to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_github_links.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "ticket_github_links_delete_role" on ticket_github_links
  for delete to authenticated
  using (exists (
    select 1 from tickets t where t.id = ticket_github_links.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- WEBHOOKS
-- ----------------------------------------
create policy "webhooks_select_role" on webhooks
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "webhooks_insert_role" on webhooks
  for insert to authenticated
  with check (has_project_access(project_id, 'admin'));

create policy "webhooks_update_role" on webhooks
  for update to authenticated
  using (has_project_access(project_id, 'admin'));

create policy "webhooks_delete_role" on webhooks
  for delete to authenticated
  using (has_project_access(project_id, 'admin'));

-- ----------------------------------------
-- TEAMS (project_id directly)
-- ----------------------------------------
create policy "teams_select_role" on teams
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "teams_insert_role" on teams
  for insert to authenticated
  with check (has_project_access(project_id, 'member'));

create policy "teams_update_role" on teams
  for update to authenticated
  using (has_project_access(project_id, 'member'));

create policy "teams_delete_role" on teams
  for delete to authenticated
  using (has_project_access(project_id, 'admin'));

-- ----------------------------------------
-- TEAM_MEMBERS (via team -> project)
-- ----------------------------------------
create policy "team_members_select_role" on team_members
  for select to authenticated
  using (exists (
    select 1 from teams t where t.id = team_members.team_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "team_members_insert_role" on team_members
  for insert to authenticated
  with check (exists (
    select 1 from teams t where t.id = team_members.team_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "team_members_update_role" on team_members
  for update to authenticated
  using (exists (
    select 1 from teams t where t.id = team_members.team_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "team_members_delete_role" on team_members
  for delete to authenticated
  using (exists (
    select 1 from teams t where t.id = team_members.team_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- CUSTOMER_ORGS (project_id directly)
-- ----------------------------------------
create policy "customer_orgs_select_role" on customer_orgs
  for select to authenticated
  using (has_project_access(project_id, 'viewer'));

create policy "customer_orgs_insert_role" on customer_orgs
  for insert to authenticated
  with check (has_project_access(project_id, 'member'));

create policy "customer_orgs_update_role" on customer_orgs
  for update to authenticated
  using (has_project_access(project_id, 'member'));

create policy "customer_orgs_delete_role" on customer_orgs
  for delete to authenticated
  using (has_project_access(project_id, 'admin'));

-- ----------------------------------------
-- CUSTOMER_USERS (via org -> project)
-- ----------------------------------------
create policy "customer_users_select_role" on customer_users
  for select to authenticated
  using (exists (
    select 1 from customer_orgs co where co.id = customer_users.org_id
      and has_project_access(co.project_id, 'viewer')
  ));

create policy "customer_users_insert_role" on customer_users
  for insert to authenticated
  with check (exists (
    select 1 from customer_orgs co where co.id = customer_users.org_id
      and has_project_access(co.project_id, 'member')
  ));

create policy "customer_users_update_role" on customer_users
  for update to authenticated
  using (exists (
    select 1 from customer_orgs co where co.id = customer_users.org_id
      and has_project_access(co.project_id, 'member')
  ));

create policy "customer_users_delete_role" on customer_users
  for delete to authenticated
  using (exists (
    select 1 from customer_orgs co where co.id = customer_users.org_id
      and has_project_access(co.project_id, 'admin')
  ));

-- ----------------------------------------
-- CUSTOMER_TICKETS (via ticket -> project)
-- ----------------------------------------
create policy "customer_tickets_select_role" on customer_tickets
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = customer_tickets.ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "customer_tickets_insert_role" on customer_tickets
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = customer_tickets.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "customer_tickets_update_role" on customer_tickets
  for update to authenticated
  using (exists (
    select 1 from tickets t where t.id = customer_tickets.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "customer_tickets_delete_role" on customer_tickets
  for delete to authenticated
  using (exists (
    select 1 from tickets t where t.id = customer_tickets.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- CUSTOMER_COMMENTS (via ticket -> project)
-- ----------------------------------------
create policy "customer_comments_select_role" on customer_comments
  for select to authenticated
  using (exists (
    select 1 from tickets t where t.id = customer_comments.ticket_id
      and has_project_access(t.project_id, 'viewer')
  ));

create policy "customer_comments_insert_role" on customer_comments
  for insert to authenticated
  with check (exists (
    select 1 from tickets t where t.id = customer_comments.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "customer_comments_update_role" on customer_comments
  for update to authenticated
  using (exists (
    select 1 from tickets t where t.id = customer_comments.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

create policy "customer_comments_delete_role" on customer_comments
  for delete to authenticated
  using (exists (
    select 1 from tickets t where t.id = customer_comments.ticket_id
      and has_project_access(t.project_id, 'member')
  ));

-- ----------------------------------------
-- USER-SCOPED TABLES (kept as-is, no changes)
-- profiles: existing policies preserved (viewable by authenticated, update/insert own)
-- notifications: existing policies preserved (user_id = auth.uid())
-- notification_preferences: existing policies preserved (user_id = auth.uid())
-- onboarding_state: existing policies preserved (user_id = auth.uid())
-- recent_items: existing policies preserved (user_id = auth.uid())
-- ----------------------------------------

-- ============================================
-- Add index on project_members for performance
-- ============================================
create index if not exists idx_project_members_project_role
  on project_members(project_id, user_id, role);
