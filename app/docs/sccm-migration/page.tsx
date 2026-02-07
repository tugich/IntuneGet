import { Metadata } from "next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Callout,
} from "@/components/docs";

export const metadata: Metadata = {
  title: "SCCM Migration | IntuneGet Docs",
  description:
    "Import SCCM exports, match apps to WinGet, preview migration, and execute queued deployments.",
};

export default function SccmMigrationPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
          SCCM Migration
        </h1>
        <p className="mt-4 text-lg text-text-secondary leading-relaxed">
          Migrate existing SCCM application portfolios into IntuneGet in four
          phases: import, matching, preview, and execution.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Workflow
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-text-secondary">
          <li>Export SCCM apps using <code>/scripts/Export-SCCMApps.ps1</code>.</li>
          <li>Create a migration and import CSV/JSON from <code>/dashboard/sccm/new</code>.</li>
          <li>Run automatic matching in <code>/dashboard/sccm/[migrationId]</code>.</li>
          <li>Review unmatched apps and apply manual mapping/exclusions.</li>
          <li>Open migration preview and execute from <code>/dashboard/sccm/[migrationId]/migrate</code>.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          API Endpoints
        </h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Method</TableHeader>
              <TableHeader>Path</TableHeader>
              <TableHeader>Purpose</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell><code>POST</code></TableCell>
              <TableCell><code>/api/sccm/import</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Import SCCM app data</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>GET</code></TableCell>
              <TableCell><code>/api/sccm/migrations</code></TableCell>
              <TableCell className="text-sm text-text-secondary">List migrations, single migration, or stats</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>POST/PATCH/DELETE</code></TableCell>
              <TableCell><code>/api/sccm/migrations</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Create/update/delete migrations</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>GET/POST/PATCH</code></TableCell>
              <TableCell><code>/api/sccm/match</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Read, run, and adjust matching state</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>POST/PATCH</code></TableCell>
              <TableCell><code>/api/sccm/migrate</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Preview/execute migration and update per-app settings</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Status Model
        </h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>Migration statuses include <code>importing</code>, <code>matching</code>, <code>migrating</code>, and <code>ready</code>.</li>
          <li>Match statuses include <code>pending</code>, <code>matched</code>, <code>partial</code>, <code>unmatched</code>, and <code>excluded</code>.</li>
          <li>Migration result statuses include <code>queued</code> and <code>failed</code> for app-level outcomes.</li>
        </ul>
        <Callout type="warning" title="Execution Prerequisites">
          <p>
            Preview/execution depends on curated app and installer metadata.
            Missing package metadata can block migration.
          </p>
        </Callout>
      </section>
    </div>
  );
}
