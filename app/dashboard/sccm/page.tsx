'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Package,
  Upload,
  Wand2,
  ClipboardCheck,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { PageHeader, AnimatedStatCard, StatCardGrid, AnimatedEmptyState, SkeletonGrid } from '@/components/dashboard';
import type { SccmMigration, SccmDashboardStats } from '@/types/sccm';

export default function SccmMigrationsPage() {
  const { getAccessToken } = useMicrosoftAuth();
  const [migrations, setMigrations] = useState<SccmMigration[]>([]);
  const [stats, setStats] = useState<SccmDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMigrations = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('Authentication required');
      }

      const [migrationsRes, statsRes] = await Promise.all([
        fetch('/api/sccm/migrations', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/sccm/migrations?stats=true', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (!migrationsRes.ok) {
        throw new Error('Failed to fetch migrations');
      }

      const migrationsData = await migrationsRes.json();
      setMigrations(migrationsData.migrations || []);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to fetch migrations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch migrations');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchMigrations();
  }, [fetchMigrations]);

  const handleDelete = async (migrationId: string) => {
    setDeletingId(migrationId);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error('Authentication required');

      const response = await fetch(`/api/sccm/migrations?id=${migrationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete migration');
      }

      toast.success('Migration deleted successfully');
      await fetchMigrations();
    } catch (err) {
      console.error('Failed to delete migration:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete migration');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="SCCM Migration"
          description="Migrate applications from SCCM to Intune"
        />
        <SkeletonGrid count={4} columns={4} variant="stat" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-light rounded-xl p-5 border border-overlay/5 animate-pulse h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SCCM Migration"
        description="Migrate applications from SCCM to Intune"
        gradient
        gradientColors="mixed"
        actions={
          <div className="flex items-center gap-3">
            <Button
              onClick={() => fetchMigrations(true)}
              disabled={isRefreshing}
              variant="outline"
              className="border-overlay/10 text-text-secondary hover:bg-overlay/5 hover:border-black/20"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <Link href="/dashboard/sccm/new">
              <Button className="bg-gradient-to-r from-accent-cyan to-accent-violet hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                New Migration
              </Button>
            </Link>
          </div>
        }
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4 bg-status-error/10 border border-status-error/20 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-status-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-status-error font-medium">Error</p>
              <p className="text-status-error/70 text-sm mt-1">{error}</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setError(null); fetchMigrations(); }}
              className="text-status-error hover:bg-status-error/10 text-xs"
            >
              Retry
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {stats && (
        <StatCardGrid columns={4}>
          <AnimatedStatCard title="Migrations" value={stats.totalMigrations} icon={FolderKanban} color="cyan" delay={0} />
          <AnimatedStatCard title="Total Apps" value={stats.totalApps} icon={Package} color="violet" delay={0.1} />
          <AnimatedStatCard title="Migrated" value={stats.migratedApps} icon={CheckCircle2} color="success" delay={0.2} />
          <AnimatedStatCard title="Pending" value={stats.pendingMigration} icon={Clock} color="warning" delay={0.3} />
        </StatCardGrid>
      )}

      {migrations.length === 0 ? (
        <AnimatedEmptyState
          icon={FolderKanban}
          title="No migrations yet"
          description="Create a new migration to import your SCCM applications and start migrating to Intune"
          color="cyan"
          showOrbs
          action={{
            label: 'Create Migration',
            onClick: () => (window.location.href = '/dashboard/sccm/new'),
          }}
        >
          <div className="flex items-center justify-center gap-3 mt-2">
            {[
              { icon: Upload, label: 'Export' },
              { icon: Wand2, label: 'Match' },
              { icon: ClipboardCheck, label: 'Review' },
              { icon: Play, label: 'Migrate' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-overlay/5 flex items-center justify-center">
                    <step.icon className="w-4 h-4 text-text-muted" />
                  </div>
                  <span className="text-xs text-text-muted mt-1">{step.label}</span>
                </div>
                {i < 3 && <div className="w-6 h-px bg-overlay/10 mt-[-12px]" />}
              </div>
            ))}
          </div>
        </AnimatedEmptyState>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className="space-y-4"
        >
          {migrations.map((migration) => (
            <MigrationCard
              key={migration.id}
              migration={migration}
              onDelete={handleDelete}
              isDeleting={deletingId === migration.id}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

const STATUS_CONFIG = {
  importing: { label: 'Importing', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-l-accent-cyan', actionLabel: 'Importing...', actionDisabled: true },
  matching: { label: 'Matching', color: 'text-accent-violet', bg: 'bg-accent-violet/10', border: 'border-l-accent-violet', actionLabel: 'View Matching', actionDisabled: false },
  ready: { label: 'Ready', color: 'text-status-success', bg: 'bg-status-success/10', border: 'border-l-status-success', actionLabel: 'Review Matches', actionDisabled: false },
  migrating: { label: 'Migrating', color: 'text-status-warning', bg: 'bg-status-warning/10', border: 'border-l-status-warning', actionLabel: 'Migrating...', actionDisabled: true },
  completed: { label: 'Completed', color: 'text-status-success', bg: 'bg-status-success/10', border: 'border-l-status-success', actionLabel: 'View Results', actionDisabled: false },
  error: { label: 'Error', color: 'text-status-error', bg: 'bg-status-error/10', border: 'border-l-status-error', actionLabel: 'View Details', actionDisabled: false },
} as const;

function MigrationCard({
  migration,
  onDelete,
  isDeleting,
}: {
  migration: SccmMigration;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const config = STATUS_CONFIG[migration.status] || STATUS_CONFIG.ready;
  const migrationRate = migration.totalApps > 0
    ? Math.round((migration.migratedApps / migration.totalApps) * 100)
    : 0;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={cn(
        'glass-light border border-overlay/5 border-l-4 rounded-xl p-5 transition-all group',
        'hover:border-overlay/10 hover:translate-y-[-2px] hover:shadow-card',
        config.border
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-text-primary font-medium truncate">{migration.name}</h3>
          </div>

          {migration.description && (
            <p className="text-text-muted text-sm mt-1 line-clamp-1">{migration.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-overlay/5">
            <div>
              <p className="text-text-muted text-xs">Total Apps</p>
              <p className="text-text-primary font-medium">{migration.totalApps}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Matched</p>
              <p className="text-accent-cyan font-medium">
                {migration.matchedApps}
                {migration.partialMatchApps > 0 && (
                  <span className="text-status-warning ml-1">(+{migration.partialMatchApps} partial)</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Migrated</p>
              <p className="text-status-success font-medium">{migration.migratedApps}</p>
            </div>
            <div>
              <p className="text-text-muted text-xs">Failed</p>
              <p className="text-status-error font-medium">{migration.failedApps}</p>
            </div>
          </div>

          {migration.totalApps > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-text-muted">Migration Progress</span>
                <span className="text-text-secondary">{migrationRate}%</span>
              </div>
              <div className="h-2 bg-overlay/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent-cyan to-accent-violet transition-all duration-500"
                  style={{ width: `${migrationRate}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 text-xs text-text-muted">
            <span>Created: {new Date(migration.createdAt).toLocaleDateString()}</span>
            {migration.lastMigrationAt && (
              <span>Last migration: {new Date(migration.lastMigrationAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold', config.bg, config.color)}>
            {config.label}
          </span>

          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-text-muted hover:text-status-error hover:bg-status-error/10"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Migration?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{migration.name}&quot; and all associated app data.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(migration.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Link href={`/dashboard/sccm/${migration.id}`}>
              <Button
                size="sm"
                disabled={config.actionDisabled}
                className={cn(
                  config.actionDisabled
                    ? 'bg-overlay/10 text-text-muted cursor-not-allowed'
                    : 'bg-gradient-to-r from-accent-cyan to-accent-violet hover:opacity-90'
                )}
              >
                {config.actionDisabled && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {config.actionLabel}
                {!config.actionDisabled && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
