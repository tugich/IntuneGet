-- Microsoft Store App Support
-- Adds app_source discriminator and store_package_id to curated_apps,
-- packaging_jobs, and upload_history so Store apps can coexist with
-- Win32 LOB apps throughout the pipeline.

-- ============================================================================
-- curated_apps: source indicator + Microsoft Store product ID
-- ============================================================================
ALTER TABLE curated_apps
  ADD COLUMN IF NOT EXISTS app_source TEXT DEFAULT 'win32',
  ADD COLUMN IF NOT EXISTS store_package_id TEXT;

-- Index for filtering store apps
CREATE INDEX IF NOT EXISTS idx_curated_apps_app_source
  ON curated_apps (app_source)
  WHERE app_source = 'store';

-- ============================================================================
-- packaging_jobs: support store apps (no installer required)
-- ============================================================================
ALTER TABLE packaging_jobs
  ADD COLUMN IF NOT EXISTS app_source TEXT DEFAULT 'win32';

-- Store apps have no installer, so these columns must be nullable
ALTER TABLE packaging_jobs ALTER COLUMN installer_type DROP NOT NULL;
ALTER TABLE packaging_jobs ALTER COLUMN installer_url DROP NOT NULL;

-- ============================================================================
-- upload_history: track source
-- ============================================================================
ALTER TABLE upload_history
  ADD COLUMN IF NOT EXISTS app_source TEXT DEFAULT 'win32';

-- ============================================================================
-- Update search_curated_apps to include app_source and store_package_id
-- ============================================================================
DROP FUNCTION IF EXISTS search_curated_apps(TEXT, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION search_curated_apps(
  search_query TEXT,
  category_filter TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 50,
  result_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
  winget_id TEXT,
  name TEXT,
  publisher TEXT,
  latest_version TEXT,
  description TEXT,
  homepage TEXT,
  category TEXT,
  tags TEXT[],
  icon_path TEXT,
  popularity_rank INTEGER,
  rank REAL,
  app_source TEXT,
  store_package_id TEXT
)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  fts_count INTEGER;
BEGIN
  -- First, try full-text search
  RETURN QUERY
  SELECT
    ca.id,
    ca.winget_id,
    ca.name,
    ca.publisher,
    ca.latest_version,
    ca.description,
    ca.homepage,
    ca.category,
    ca.tags,
    ca.icon_path,
    ca.popularity_rank,
    ts_rank_cd(ca.fts, websearch_to_tsquery('english', search_query)) AS rank,
    ca.app_source,
    ca.store_package_id
  FROM curated_apps ca
  WHERE
    ca.fts @@ websearch_to_tsquery('english', search_query)
    AND (category_filter IS NULL OR ca.category = category_filter)
    AND ca.is_verified = TRUE
    AND ca.is_locale_variant = FALSE
  ORDER BY rank DESC, ca.popularity_rank ASC NULLS LAST
  LIMIT result_limit
  OFFSET result_offset;

  -- Check if FTS returned any results
  GET DIAGNOSTICS fts_count = ROW_COUNT;

  -- If FTS returned no results, fallback to ILIKE pattern matching
  IF fts_count = 0 THEN
    RETURN QUERY
    SELECT
      ca.id,
      ca.winget_id,
      ca.name,
      ca.publisher,
      ca.latest_version,
      ca.description,
      ca.homepage,
      ca.category,
      ca.tags,
      ca.icon_path,
      ca.popularity_rank,
      0.0::REAL AS rank,
      ca.app_source,
      ca.store_package_id
    FROM curated_apps ca
    WHERE
      (
        ca.name ILIKE '%' || search_query || '%'
        OR ca.winget_id ILIKE '%' || search_query || '%'
        OR ca.publisher ILIKE '%' || search_query || '%'
      )
      AND (category_filter IS NULL OR ca.category = category_filter)
      AND ca.is_verified = TRUE
      AND ca.is_locale_variant = FALSE
    ORDER BY
      CASE
        WHEN LOWER(ca.name) = LOWER(search_query) THEN 1
        WHEN LOWER(ca.name) LIKE LOWER(search_query) || '%' THEN 2
        WHEN LOWER(ca.winget_id) LIKE '%' || LOWER(search_query) || '%' THEN 3
        ELSE 4
      END,
      ca.popularity_rank ASC NULLS LAST
    LIMIT result_limit
    OFFSET result_offset;
  END IF;
END;
$$;

-- ============================================================================
-- Update get_popular_curated_apps to include app_source and store_package_id
-- ============================================================================
DROP FUNCTION IF EXISTS get_popular_curated_apps(INTEGER, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION get_popular_curated_apps(
  result_limit INTEGER DEFAULT 50,
  result_offset INTEGER DEFAULT 0,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  winget_id TEXT,
  name TEXT,
  publisher TEXT,
  latest_version TEXT,
  description TEXT,
  homepage TEXT,
  category TEXT,
  tags TEXT[],
  icon_path TEXT,
  popularity_rank INTEGER,
  app_source TEXT,
  store_package_id TEXT
)
LANGUAGE sql STABLE AS $$
  SELECT
    ca.id,
    ca.winget_id,
    ca.name,
    ca.publisher,
    ca.latest_version,
    ca.description,
    ca.homepage,
    ca.category,
    ca.tags,
    ca.icon_path,
    ca.popularity_rank,
    ca.app_source,
    ca.store_package_id
  FROM curated_apps ca
  WHERE
    ca.is_verified = TRUE
    AND ca.is_locale_variant = FALSE
    AND (category_filter IS NULL OR ca.category = category_filter)
  ORDER BY ca.popularity_rank ASC NULLS LAST
  LIMIT result_limit
  OFFSET result_offset;
$$;
