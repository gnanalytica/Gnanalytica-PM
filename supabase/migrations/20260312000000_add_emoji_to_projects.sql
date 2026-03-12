-- Add emoji_slug column to projects table for project display icons
ALTER TABLE projects ADD COLUMN IF NOT EXISTS emoji_slug VARCHAR(50) NULL DEFAULT NULL;

-- Migration metadata
-- Purpose: Store project emoji/icon slugs (e.g., "rocket", "chart", "people")
-- Backward compatible: All existing projects get NULL
-- Default UI: Show placeholder emoji or first letter of project name
