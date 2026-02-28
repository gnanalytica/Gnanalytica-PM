-- ============================================
-- CYCLE PLANNING
-- ============================================

-- Cycles scoped to a project (e.g. Sprint 1, Sprint 2)
create table if not exists cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  project_id uuid references projects(id) on delete cascade not null,
  created_at timestamptz default now(),
  constraint cycles_dates_valid check (end_date >= start_date)
);

-- Junction: tickets <-> cycles (many-to-many)
create table if not exists ticket_cycles (
  ticket_id uuid references tickets(id) on delete cascade,
  cycle_id uuid references cycles(id) on delete cascade,
  primary key (ticket_id, cycle_id)
);

-- Indexes
create index if not exists idx_cycles_project_id on cycles(project_id);
create index if not exists idx_cycles_dates on cycles(project_id, start_date, end_date);
create index if not exists idx_ticket_cycles_ticket_id on ticket_cycles(ticket_id);
create index if not exists idx_ticket_cycles_cycle_id on ticket_cycles(cycle_id);

-- RLS
alter table cycles enable row level security;
alter table ticket_cycles enable row level security;

-- Policies (drop if exists then create, since CREATE POLICY has no IF NOT EXISTS)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'cycles' and policyname = 'Cycles viewable by authenticated') then
    create policy "Cycles viewable by authenticated" on cycles for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'cycles' and policyname = 'Authenticated can create cycles') then
    create policy "Authenticated can create cycles" on cycles for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'cycles' and policyname = 'Authenticated can update cycles') then
    create policy "Authenticated can update cycles" on cycles for update to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'cycles' and policyname = 'Authenticated can delete cycles') then
    create policy "Authenticated can delete cycles" on cycles for delete to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ticket_cycles' and policyname = 'Ticket cycles viewable by authenticated') then
    create policy "Ticket cycles viewable by authenticated" on ticket_cycles for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ticket_cycles' and policyname = 'Authenticated can create ticket cycles') then
    create policy "Authenticated can create ticket cycles" on ticket_cycles for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ticket_cycles' and policyname = 'Authenticated can delete ticket cycles') then
    create policy "Authenticated can delete ticket cycles" on ticket_cycles for delete to authenticated using (true);
  end if;
end $$;
