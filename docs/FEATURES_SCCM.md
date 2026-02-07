# SCCM Migration Guide

This guide documents the SCCM migration feature from import to Intune deployment queueing.

## What It Does

SCCM migration helps you:

1. Import existing SCCM app metadata (CSV/JSON export).
2. Match SCCM apps to WinGet packages.
3. Preview migration outcomes and blockers.
4. Queue selected apps into IntuneGet packaging/deployment flow.

## UI Workflow

1. Open `/dashboard/sccm` to view migrations and overall stats.
2. Click new migration and open `/dashboard/sccm/new`.
3. Download `Export-SCCMApps.ps1` from `/scripts/Export-SCCMApps.ps1`.
4. Upload export file, name the migration, and import.
5. Open migration detail `/dashboard/sccm/[migrationId]` and run matching.
6. Fix partial/unmatched items with manual matching or exclusions.
7. Open `/dashboard/sccm/[migrationId]/migrate` for preview.
8. Execute migration to create cart items and move into upload pipeline.

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/sccm/import` | Import SCCM export and create app records |
| `GET` | `/api/sccm/migrations` | List migrations, get one migration, or get stats |
| `POST` | `/api/sccm/migrations` | Create migration |
| `PATCH` | `/api/sccm/migrations` | Update migration metadata |
| `DELETE` | `/api/sccm/migrations?id=...` | Delete migration |
| `GET` | `/api/sccm/match` | List apps and match states |
| `POST` | `/api/sccm/match` | Run automatic matching |
| `PATCH` | `/api/sccm/match` | Manual match or exclude app |
| `POST` | `/api/sccm/migrate?action=preview` | Build migration preview |
| `POST` | `/api/sccm/migrate?action=execute` | Execute migration and queue apps |
| `PATCH` | `/api/sccm/migrate` | Update per-app migration settings |

All SCCM endpoints require `Authorization: Bearer <microsoft-access-token>`.

## Status Model

### Migration Status

- `importing`
- `matching`
- `migrating`
- `ready`
- `completed` (type exists)
- `error` (type exists)

Note: current route behavior typically returns migration back to `ready` after matching/execution.

### App Match Status

- `pending`
- `matched`
- `partial`
- `unmatched`
- `excluded`
- `skipped`

### App Migration Status

- `pending`
- `queued`
- `migrating`
- `completed`
- `failed`
- `skipped`

## Matching Behavior

Matching combines:

1. Existing historical mappings.
2. Exact and fuzzy package matching.
3. Heuristics by publisher/name/version.
4. Manual override when needed.

Manual actions:

- Set explicit WinGet package mapping.
- Exclude app from migration.

## Preview and Execution

Preview checks include:

- Installer availability in curated app + version history
- Detection/command conversion viability
- Unsupported technologies and rule types
- Warnings/blockers before execution

Execution performs:

- Migration status transition to `migrating`
- Conversion to IntuneGet package/cart payloads
- Queueing selected apps into packaging pipeline
- Per-app success/failure recording

## Requirements

- Valid Microsoft token and tenant context.
- SCCM export file (`csv` or `json`) with required columns.
- Data availability in `curated_apps` and `version_history` for selected mappings.

## Known Limitations

1. Large imports/matching runs are synchronous and may take time.
2. Script detection conversion primarily supports PowerShell.
3. Some technologies (for example App-V/macOS) may be marked unsupported.
4. Preview/execute can fail when no curated installer metadata exists.

## Related Docs

- `docs/API_REFERENCE.md`
- `docs/FEATURES_INVENTORY_AND_REPORTS.md`
- `docs/FEATURES_UPDATES.md`
