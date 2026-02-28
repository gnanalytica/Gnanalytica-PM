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
