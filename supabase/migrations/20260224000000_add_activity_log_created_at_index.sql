-- Add index on activity_log(user_id, created_at) for the My Issues activity feed
create index if not exists idx_activity_log_user_created
  on activity_log (user_id, created_at desc);
