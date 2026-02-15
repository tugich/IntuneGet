-- Icon Extraction Tracking Migration
-- Adds columns to track icon source, extraction attempts, and failure reasons
-- to enable multi-tier icon sourcing and prevent retrying permanently-broken apps.

ALTER TABLE curated_apps
  ADD COLUMN IF NOT EXISTS icon_source TEXT,
  ADD COLUMN IF NOT EXISTS icon_extraction_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS icon_last_attempted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS icon_failure_reason TEXT;

COMMENT ON COLUMN curated_apps.icon_source IS 'Which tier provided the icon: binary_exe, binary_msi, binary_msix, github_avatar, favicon';
COMMENT ON COLUMN curated_apps.icon_extraction_attempts IS 'Number of binary extraction attempts (stop retrying after 3)';
COMMENT ON COLUMN curated_apps.icon_last_attempted_at IS 'Timestamp of the last icon extraction attempt';
COMMENT ON COLUMN curated_apps.icon_failure_reason IS 'Why extraction failed: installer_too_large, no_icon_in_binary, download_timeout, no_installer_url, etc.';

-- Partial index for efficiently querying apps that still need icons
CREATE INDEX IF NOT EXISTS idx_curated_apps_needs_icon
  ON curated_apps (has_icon, icon_extraction_attempts)
  WHERE has_icon = FALSE;
