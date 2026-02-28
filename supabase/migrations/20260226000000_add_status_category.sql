-- ============================================
-- Migration: Add status_category to tickets
--
-- Adds a workflow category field that classifies each ticket status
-- into one of: backlog, unstarted, started, completed, canceled.
--
-- A DB trigger auto-derives status_category from the status column,
-- so application code only needs to set `status`.
-- ============================================

-- 1. Expand status CHECK to include 'backlog' and 'canceled'
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('backlog', 'todo', 'in_progress', 'done', 'canceled'));

-- 2. Add status_category column
ALTER TABLE tickets
  ADD COLUMN status_category text
  DEFAULT 'unstarted'
  CHECK (status_category IN ('backlog', 'unstarted', 'started', 'completed', 'canceled'));

-- 3. Backfill existing rows
UPDATE tickets SET status_category = 'unstarted'  WHERE status = 'todo';
UPDATE tickets SET status_category = 'started'    WHERE status = 'in_progress';
UPDATE tickets SET status_category = 'completed'  WHERE status = 'done';

-- 4. Add index for filtering/grouping by category
CREATE INDEX idx_tickets_status_category ON tickets(status_category);
CREATE INDEX idx_tickets_project_status_category ON tickets(project_id, status_category);

-- 5. Trigger: auto-sync status_category when status is set
CREATE OR REPLACE FUNCTION sync_status_category()
RETURNS trigger AS $$
BEGIN
  NEW.status_category = CASE NEW.status
    WHEN 'backlog'     THEN 'backlog'
    WHEN 'todo'        THEN 'unstarted'
    WHEN 'in_progress' THEN 'started'
    WHEN 'done'        THEN 'completed'
    WHEN 'canceled'    THEN 'canceled'
    ELSE COALESCE(NEW.status_category, 'unstarted')
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_sync_status_category
  BEFORE INSERT OR UPDATE OF status ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION sync_status_category();
