-- Create dashboard_layouts table for user customization
CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) DEFAULT 'My Dashboard',
  widgets JSONB NOT NULL DEFAULT '[]', -- Array of {id, type, size, order, isVisible, customHeight}
  user_role VARCHAR(50) DEFAULT 'user', -- 'product', 'developer', 'admin'
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, is_default) -- Only one default per user
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_user_id ON dashboard_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_layouts_is_default ON dashboard_layouts(user_id, is_default);

-- Create trigger for auto-update updated_at
CREATE OR REPLACE FUNCTION update_dashboard_layouts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_dashboard_layouts_timestamp ON dashboard_layouts;
CREATE TRIGGER update_dashboard_layouts_timestamp
  BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_dashboard_layouts_timestamp();
