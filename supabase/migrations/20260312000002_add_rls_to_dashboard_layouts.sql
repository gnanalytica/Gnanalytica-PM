-- Enable RLS on dashboard_layouts
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own layouts
CREATE POLICY IF NOT EXISTS "Users can view own dashboard layouts" ON dashboard_layouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create own dashboard layouts" ON dashboard_layouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own dashboard layouts" ON dashboard_layouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own dashboard layouts" ON dashboard_layouts
  FOR DELETE USING (auth.uid() = user_id);
