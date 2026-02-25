-- Language Variant Support
-- Adds locale variant columns to curated_apps so that language-specific
-- WinGet packages (e.g., Mozilla.Firefox.de, Mozilla.Firefox.fr) are grouped
-- under a single parent app. Variants are hidden from search/browse and
-- surfaced only when configuring a package for deployment.

-- ============================================================================
-- Add columns to curated_apps
-- ============================================================================
ALTER TABLE curated_apps
  ADD COLUMN IF NOT EXISTS parent_winget_id TEXT,
  ADD COLUMN IF NOT EXISTS locale_code TEXT,
  ADD COLUMN IF NOT EXISTS is_locale_variant BOOLEAN DEFAULT FALSE;

-- Backfill existing rows that will have NULL instead of FALSE
UPDATE curated_apps SET is_locale_variant = FALSE WHERE is_locale_variant IS NULL;

-- Partial indexes for efficient variant lookups
CREATE INDEX IF NOT EXISTS idx_curated_apps_parent
  ON curated_apps (parent_winget_id)
  WHERE parent_winget_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_curated_apps_locale_variant
  ON curated_apps (is_locale_variant)
  WHERE is_locale_variant = TRUE;

-- ============================================================================
-- Update search_curated_apps to exclude locale variants
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
  rank REAL
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
    ts_rank_cd(ca.fts, websearch_to_tsquery('english', search_query)) AS rank
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
      0.0::REAL AS rank
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
-- Update get_popular_curated_apps to exclude locale variants
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
  popularity_rank INTEGER
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
    ca.popularity_rank
  FROM curated_apps ca
  WHERE
    ca.is_verified = TRUE
    AND ca.is_locale_variant = FALSE
    AND (category_filter IS NULL OR ca.category = category_filter)
  ORDER BY ca.popularity_rank ASC NULLS LAST
  LIMIT result_limit
  OFFSET result_offset;
$$;

-- ============================================================================
-- New function: get_locale_variants
-- Returns all locale variants for a parent app
-- ============================================================================
CREATE OR REPLACE FUNCTION get_locale_variants(parent_id TEXT)
RETURNS TABLE (
  winget_id TEXT,
  locale_code TEXT,
  latest_version TEXT,
  icon_path TEXT
)
LANGUAGE sql STABLE AS $$
  SELECT
    ca.winget_id,
    ca.locale_code,
    ca.latest_version,
    ca.icon_path
  FROM curated_apps ca
  WHERE
    ca.parent_winget_id = parent_id
    AND ca.is_locale_variant = TRUE
  ORDER BY ca.locale_code ASC;
$$;

-- ============================================================================
-- Function: inherit_parent_icons
-- Copies icon_path from parent apps to their locale variants
-- Called after sync to ensure variants share parent icons
-- ============================================================================
CREATE OR REPLACE FUNCTION inherit_parent_icons()
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE curated_apps v
  SET icon_path = p.icon_path, has_icon = p.has_icon
  FROM curated_apps p
  WHERE v.parent_winget_id = p.winget_id
    AND v.is_locale_variant = TRUE
    AND p.has_icon = TRUE
    AND (v.icon_path IS NULL OR v.icon_path != p.icon_path);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ============================================================================
-- Update get_curated_categories to exclude locale variants from counts
-- ============================================================================
CREATE OR REPLACE FUNCTION get_curated_categories()
RETURNS TABLE (
  category TEXT,
  app_count BIGINT
)
LANGUAGE sql STABLE AS $$
  SELECT
    ca.category,
    COUNT(*) as app_count
  FROM curated_apps ca
  WHERE ca.is_verified = TRUE
    AND ca.category IS NOT NULL
    AND ca.is_locale_variant = FALSE
  GROUP BY ca.category
  ORDER BY app_count DESC;
$$;
