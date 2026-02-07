ALTER TABLE update_check_results
  ADD COLUMN IF NOT EXISTS large_icon_type TEXT,
  ADD COLUMN IF NOT EXISTS large_icon_value TEXT;
