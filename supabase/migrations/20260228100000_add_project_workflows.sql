-- ============================================
-- Per-project workflow configuration
-- ============================================

-- Project Workflows table: stores custom statuses and transitions per project
create table project_workflows (
  project_id uuid primary key references projects(id) on delete cascade,
  statuses jsonb not null default '[]'::jsonb,
  transitions jsonb default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger project_workflows_updated_at
  before update on project_workflows
  for each row
  execute function update_updated_at();

-- RLS
alter table project_workflows enable row level security;

create policy "Workflows viewable by authenticated"
  on project_workflows for select to authenticated using (true);

create policy "Authenticated can insert workflows"
  on project_workflows for insert to authenticated with check (true);

create policy "Authenticated can update workflows"
  on project_workflows for update to authenticated using (true);

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
