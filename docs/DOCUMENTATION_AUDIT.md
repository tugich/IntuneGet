# Documentation Audit

Audit date: 2026-02-07

## Sources Reviewed

- `README.md`
- `SECURITY.md`
- `CONTRIBUTING.md`
- `docs/*.md`
- `packager/README.md`
- In-app docs pages under `app/docs/*`

## What Is Covered

1. Core setup: Entra ID, database setup, Docker, GitHub Actions, self-hosting.
2. Operational basics: troubleshooting, health checks, packager setup.
3. Feature docs (in-app): unmanaged apps, MSP workflows, settings/webhooks.

## Fixed During This Audit

1. Broken root docs link:
   - Added `CONTRIBUTING.md` referenced by `README.md`.
2. Outdated repository references:
   - Updated docs using `IntuneGet-Website` to `IntuneGet`.
3. GitHub packaging drift:
   - Updated docs for private workflows repository (`GITHUB_WORKFLOWS_REPO`).
   - Updated callback path to `/api/package/callback`.
4. Missing referenced docs:
   - Added `docs/authentication-architecture.md`.
5. Packager env var drift:
   - Updated `packager/README.md` from `WEB_APP_URL` to `INTUNEGET_API_URL` and clarified API/Supabase modes.
6. Added missing feature/API/env docs:
   - Added `docs/API_REFERENCE.md`.
   - Added `docs/FEATURES_SCCM.md`.
   - Added `docs/FEATURES_UPDATES.md`.
   - Added `docs/FEATURES_INVENTORY_AND_REPORTS.md`.
   - Added `docs/ENV_REFERENCE.md`.

## Remaining Gaps (Current)

No major missing documentation areas remain from the original gap list.

## Recommended Next Improvements

1. Keep docs synced with implementation caveats:
   - Uploads highlight query param mismatch (`job` vs `jobs`).
   - Detection feedback enum alignment between validator and schema/types.
2. Add request/response examples per endpoint if a stricter API contract is needed.
3. Add changelog entries when docs change materially, to aid operators upgrading self-hosted instances.
