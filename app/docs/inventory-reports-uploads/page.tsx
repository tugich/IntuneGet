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
  title: "Inventory, Reports, and Uploads | IntuneGet Docs",
  description:
    "Operational documentation for inventory browsing, reporting, and upload job tracking.",
  alternates: {
    canonical: "https://intuneget.com/docs/inventory-reports-uploads",
  },
  openGraph: {
    title: "Inventory, Reports, and Uploads | IntuneGet Docs",
    description:
      "Operational documentation for inventory browsing, reporting, and upload job tracking.",
  },
};

export default function InventoryReportsUploadsPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
          Inventory, Reports, and Uploads
        </h1>
        <p className="mt-4 text-lg text-text-secondary leading-relaxed">
          Operational dashboards for day-to-day management: what is deployed,
          how deployment quality trends over time, and how packaging jobs are
          progressing.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Inventory
        </h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>Route: <code>/dashboard/inventory</code></li>
          <li>Search, sort, and grid/list view for Intune Win32 apps</li>
          <li>App details panel includes assignment information</li>
          <li>Endpoints: <code>GET /api/intune/apps</code>, <code>GET /api/intune/apps/[id]</code></li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Reports
        </h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>Route: <code>/dashboard/reports</code></li>
          <li>Date range presets: 7, 30, 90, 365 days</li>
          <li>Summary cards, trend chart, top apps, and recent failures</li>
          <li>CSV export support</li>
          <li>Endpoints: <code>GET /api/analytics</code>, <code>GET /api/analytics/export</code></li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Uploads
        </h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>Route: <code>/dashboard/uploads</code></li>
          <li>Active/completed/failed views for packaging lifecycle states</li>
          <li>Auto-refresh while active jobs are present</li>
          <li>Cancel/dismiss and force-redeploy actions</li>
        </ul>

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
              <TableCell><code>GET</code></TableCell>
              <TableCell><code>/api/package</code></TableCell>
              <TableCell className="text-sm text-text-secondary">List jobs by user or fetch one job</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>POST</code></TableCell>
              <TableCell><code>/api/package</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Queue package jobs</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>POST</code></TableCell>
              <TableCell><code>/api/package/cancel</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Cancel or dismiss jobs</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>POST</code></TableCell>
              <TableCell><code>/api/package/callback</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Pipeline status callback updates</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section>
        <Callout type="warning" title="Operational Notes">
          <p>
            Inventory and report routes require bearer auth. Upload list reads
            currently use query-based user scoping in the route handler.
          </p>
        </Callout>
      </section>
    </div>
  );
}
