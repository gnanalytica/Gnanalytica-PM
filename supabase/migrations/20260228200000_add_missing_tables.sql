-- Create missing tables and add missing columns

-- ============================================
-- SAVED VIEWS (table exists, add missing columns + policies)
-- ============================================

-- Add missing columns to existing saved_views table
alter table saved_views add column if not exists is_shared boolean default false;
alter table saved_views add column if not exists share_token text;

alter table saved_views enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'saved_views' and policyname = 'Saved views viewable by owner or shared') then
    create policy "Saved views viewable by owner or shared" on saved_views for select to authenticated using (created_by = auth.uid() or is_shared = true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'saved_views' and policyname = 'Users can insert own saved views') then
    create policy "Users can insert own saved views" on saved_views for insert to authenticated with check (created_by = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'saved_views' and policyname = 'Users can update own saved views') then
    create policy "Users can update own saved views" on saved_views for update to authenticated using (created_by = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'saved_views' and policyname = 'Users can delete own saved views') then
    create policy "Users can delete own saved views" on saved_views for delete to authenticated using (created_by = auth.uid());
  end if;
end $$;

-- ============================================
-- ONBOARDING STATE
-- ============================================

create table if not exists onboarding_state (
  user_id uuid primary key references profiles(id) on delete cascade,
  step int not null default 1 check (step between 1 and 5),
  completed boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

-- ============================================
-- MILESTONES
-- ============================================

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

-- Add milestone_id to tickets if not present
alter table tickets add column if not exists milestone_id uuid references milestones(id) on delete set null;
create index if not exists idx_tickets_milestone on tickets(milestone_id) where milestone_id is not null;

alter table milestones enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'milestones' and policyname = 'Authenticated users can manage milestones') then
    create policy "Authenticated users can manage milestones" on milestones for all to authenticated using (true) with check (true);
  end if;
end $$;

-- ============================================
-- RECENT ITEMS
-- ============================================

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

alter table recent_items enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'recent_items' and policyname = 'Users can manage own recent items') then
    create policy "Users can manage own recent items" on recent_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;
