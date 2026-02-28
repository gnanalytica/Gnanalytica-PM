-- ============================================
-- Collaboration: watchers, comment threads, @mentions, actor_id
-- ============================================

-- 1. ticket_watchers junction table
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

alter publication supabase_realtime add table ticket_watchers;

-- 2. comments.parent_id for threading
alter table comments add column parent_id uuid references comments(id) on delete cascade;
create index idx_comments_parent_id on comments(parent_id);

-- 3. notifications.actor_id for "Alice commented..."
alter table notifications add column actor_id uuid references profiles(id);
create index idx_notifications_actor_id on notifications(actor_id);

-- 4. Comment UPDATE/DELETE policies (own comments only)
create policy "Users can update own comments"
  on comments for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete own comments"
  on comments for delete to authenticated
  using (user_id = auth.uid());
