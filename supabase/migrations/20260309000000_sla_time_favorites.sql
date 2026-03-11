-- ═══════════════════════════════════════════════════════════
-- Migration: SLA Tracking, Time Tracking, Favorites
-- ═══════════════════════════════════════════════════════════

-- ── SLA Policies ──
create table if not exists sla_policies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  priority text not null,
  response_time_minutes integer not null default 60,
  resolution_time_minutes integer not null default 480,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint sla_priority_check check (priority in ('low', 'medium', 'high', 'urgent')),
  unique (project_id, priority)
);
create index if not exists idx_sla_policies_project on sla_policies(project_id);
alter table sla_policies enable row level security;
create policy "Authenticated users can manage SLA policies"
  on sla_policies for all to authenticated using (true) with check (true);

-- SLA columns on tickets
alter table tickets add column if not exists first_response_at timestamptz;
alter table tickets add column if not exists resolved_at timestamptz;
alter table tickets add column if not exists sla_response_breached boolean default false;
alter table tickets add column if not exists sla_resolution_breached boolean default false;

-- Auto-set resolved_at trigger
create or replace function set_resolved_at()
returns trigger as $$
begin
  if new.status_category = 'completed' and (old.status_category is distinct from 'completed') then
    new.resolved_at = now();
  end if;
  if new.status_category != 'completed' and old.status_category = 'completed' then
    new.resolved_at = null;
    new.sla_resolution_breached = false;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tickets_set_resolved_at on tickets;
create trigger tickets_set_resolved_at
  before update on tickets for each row execute function set_resolved_at();

-- Auto-set first_response_at on first team comment
create or replace function set_first_response_at()
returns trigger as $$
begin
  update tickets
  set first_response_at = new.created_at
  where id = new.ticket_id
    and first_response_at is null;
  return new;
end;
$$ language plpgsql;

drop trigger if exists comments_set_first_response on comments;
create trigger comments_set_first_response
  after insert on comments for each row execute function set_first_response_at();

-- ── Time Entries ──
create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer,
  description text,
  is_running boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_time_entries_ticket on time_entries(ticket_id);
create index if not exists idx_time_entries_user on time_entries(user_id);
create index if not exists idx_time_entries_running on time_entries(user_id, is_running) where is_running = true;

alter table time_entries enable row level security;
create policy "Authenticated users can view time entries"
  on time_entries for select to authenticated using (true);
create policy "Users can insert own time entries"
  on time_entries for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own time entries"
  on time_entries for update to authenticated using (user_id = auth.uid());
create policy "Users can delete own time entries"
  on time_entries for delete to authenticated using (user_id = auth.uid());

-- Auto-compute duration
create or replace function compute_time_entry_duration()
returns trigger as $$
begin
  if new.ended_at is not null and new.started_at is not null then
    new.duration_minutes = ceil(extract(epoch from new.ended_at - new.started_at) / 60);
    new.is_running = false;
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists time_entries_compute_duration on time_entries;
create trigger time_entries_compute_duration
  before insert or update on time_entries for each row
  execute function compute_time_entry_duration();

-- ── Favorites ──
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  position integer default 0,
  created_at timestamptz default now(),
  constraint favorites_type_check check (item_type in ('project', 'ticket')),
  unique (user_id, item_type, item_id)
);

create index if not exists idx_favorites_user on favorites(user_id, position);
alter table favorites enable row level security;
create policy "Users can manage own favorites"
  on favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
