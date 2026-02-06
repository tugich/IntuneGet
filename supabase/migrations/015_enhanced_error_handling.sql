-- Migration: Enhanced Error Handling
-- Adds structured error tracking columns to packaging_jobs table

-- Add error tracking columns for structured error reporting
ALTER TABLE packaging_jobs
ADD COLUMN IF NOT EXISTS error_stage TEXT,
ADD COLUMN IF NOT EXISTS error_category TEXT,
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS error_details JSONB;

-- Add comments for documentation
COMMENT ON COLUMN packaging_jobs.error_stage IS 'Stage where failure occurred: download, package, upload, authenticate, finalize, unknown';
COMMENT ON COLUMN packaging_jobs.error_category IS 'Category for UI grouping: network, validation, permission, installer, intune_api, system';
COMMENT ON COLUMN packaging_jobs.error_code IS 'Machine-readable error code (e.g., DOWNLOAD_404, HASH_MISMATCH, AUTH_FORBIDDEN)';
COMMENT ON COLUMN packaging_jobs.error_details IS 'Additional context as JSON (HTTP status, URLs, expected vs actual hash, etc.)';

-- Create index for error analysis queries
CREATE INDEX IF NOT EXISTS idx_packaging_jobs_error_code ON packaging_jobs(error_code) WHERE error_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_packaging_jobs_error_category ON packaging_jobs(error_category) WHERE error_category IS NOT NULL;
