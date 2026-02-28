-- Add missing columns to tickets table

alter table tickets add column if not exists issue_type text default 'task';
alter table tickets add column if not exists story_points integer;
alter table tickets add column if not exists start_date date;
alter table tickets add column if not exists parent_id uuid references tickets(id) on delete set null;
alter table tickets add column if not exists epic_id uuid references tickets(id) on delete set null;

-- Constraints (use DO block to handle "already exists" gracefully)
do $$ begin
  alter table tickets add constraint tickets_issue_type_check
    check (issue_type in ('bug', 'feature', 'task', 'improvement', 'epic', 'story', 'sub_task'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table tickets add constraint tickets_story_points_check
    check (story_points is null or story_points in (1, 2, 3, 5, 8, 13, 21));
exception when duplicate_object then null;
end $$;

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

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
