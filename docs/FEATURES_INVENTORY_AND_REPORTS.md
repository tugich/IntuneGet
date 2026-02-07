# Inventory, Reports, and Uploads Guide

This guide covers three operational dashboard areas:

1. Inventory (`/dashboard/inventory`)
2. Reports (`/dashboard/reports`)
3. Uploads (`/dashboard/uploads`)

## Inventory

### What You Get

- Intune Win32 app list
- Search and sort
- Grid/list view toggle
- App detail panel (including assignments)

### Data Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/intune/apps` | List Win32 apps |
| `GET` | `/api/intune/apps/[id]` | Get app details + assignments |

Auth: bearer token required.

### Filtering/Sorting (Client-Side)

- Search by display name, publisher, description
- Sort by name/publisher/created/modified
- Toggle asc/desc

## Reports

### What You Get

- Total/completed/failed/pending summary
- Success-rate visualization
- Daily deployment trend (completed vs failed)
- Top apps chart
- Recent failures table
- CSV export

### Data Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/analytics?days=N` | Analytics dataset for dashboard charts |
| `GET` | `/api/analytics/export?days=N` | CSV export |

Auth: bearer token required.

`days` is clamped to `1..365`.

## Uploads

### What You Get

- Packaging/deployment job list and status
- Active/completed/failed tabs
- Polling refresh while active jobs exist
- Cancel/dismiss actions
- Force redeploy option for duplicate-skipped jobs

### Data Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/package?userId=...` | List jobs for user |
| `GET` | `/api/package?jobId=...` | Get one job |
| `POST` | `/api/package` | Queue jobs |
| `POST` | `/api/package/cancel` | Cancel/dismiss job |
| `POST` | `/api/package/callback` | Status callback from pipeline |

### Upload Status Buckets in UI

- Active: `queued`, `packaging`, `uploading`
- Completed: `completed`, `deployed`, `duplicate_skipped`
- Failed: `failed`, `cancelled`

### Notable Behavior

- Page auto-refreshes every 2s when active jobs exist.
- Highlighting supports query string `jobs=<comma-separated-job-ids>`.

## Operational Caveats

1. `GET /api/package` currently relies on `userId` query param and does not enforce bearer auth in that handler.
2. Reports "recent failures" navigation and uploads highlight query param naming are not fully aligned (`job` vs `jobs`).
3. The "Upload to Intune" button rendering in uploads depends on job state and package URL availability.

## Related Docs

- `docs/API_REFERENCE.md`
- `docs/FEATURES_UPDATES.md`
