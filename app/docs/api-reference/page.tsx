import { Metadata } from "next";
import Link from "next/link";
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
  title: "API Reference | IntuneGet Docs",
  description:
    "Endpoint overview for IntuneGet APIs grouped by feature area.",
};

export default function ApiReferencePage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-text-primary sm:text-4xl">
          API Reference
        </h1>
        <p className="mt-4 text-lg text-text-secondary leading-relaxed">
          High-level endpoint map for package orchestration, Intune inventory,
          updates, SCCM migration, community features, notifications, and MSP
          operations.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Authentication
        </h2>
        <p className="text-text-secondary mb-4">
          Most routes require a Microsoft access token:
        </p>
        <pre className="rounded-lg border border-black/10 bg-white p-4 text-sm text-text-secondary overflow-x-auto">
{`Authorization: Bearer <microsoft-access-token>`}
        </pre>
        <Callout type="info" title="Callback Security">
          <p>
            Pipeline callbacks use HMAC verification when{" "}
            <code>CALLBACK_SECRET</code> is configured.
          </p>
        </Callout>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Core Domains
        </h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Domain</TableHeader>
              <TableHeader>Primary Routes</TableHeader>
              <TableHeader>Purpose</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-text-primary">Package Pipeline</TableCell>
              <TableCell><code>/api/package*</code>, <code>/api/packager/*</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Queue, track, cancel, and process packaging jobs</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-text-primary">Intune Inventory</TableCell>
              <TableCell><code>/api/intune/apps</code>, <code>/api/intune/apps/[id]</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Read Win32 app inventory and assignments</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-text-primary">Analytics</TableCell>
              <TableCell><code>/api/analytics</code>, <code>/api/analytics/export</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Dashboard metrics and CSV exports</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-text-primary">Updates</TableCell>
              <TableCell><code>/api/updates/*</code>, <code>/api/update-policies/*</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Update discovery, triggers, and policy management</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-text-primary">SCCM Migration</TableCell>
              <TableCell><code>/api/sccm/*</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Import, match, preview, and execute SCCM migration workflows</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-text-primary">Community</TableCell>
              <TableCell><code>/api/community/*</code>, <code>/api/apps/[id]/rate</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Suggestions, voting, ratings, and detection feedback</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-text-primary">MSP</TableCell>
              <TableCell><code>/api/msp/*</code></TableCell>
              <TableCell className="text-sm text-text-secondary">Multi-tenant org, team, jobs, reports, and webhooks</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-4">
          Related Docs
        </h2>
        <ul className="list-disc list-inside space-y-2 text-text-secondary">
          <li>
            <Link href="/docs/environment-reference" className="text-accent-cyan hover:underline">
              Environment Reference
            </Link>
          </li>
          <li>
            <Link href="/docs/sccm-migration" className="text-accent-cyan hover:underline">
              SCCM Migration
            </Link>
          </li>
          <li>
            <Link href="/docs/updates-policies" className="text-accent-cyan hover:underline">
              Updates & Policies
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
