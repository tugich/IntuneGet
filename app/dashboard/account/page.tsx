'use client';

import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  User,
  Building2,
  Clock,
  LogOut,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  Calendar,
  Shield,
  Copy,
  Check,
  Zap,
  TrendingUp,
  Activity,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useDashboardStats } from '@/hooks/useAnalytics';
import { PageHeader } from '@/components/dashboard';
import { AnimatedStatCard, StatCardGrid } from '@/components/dashboard/AnimatedStatCard';
import { cn } from '@/lib/utils';

export default function AccountPage() {
  const { user, signOut, getTokenExpiryTime, getAccessToken } = useMicrosoftAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const prefersReducedMotion = useReducedMotion();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);

  // Update token expiry periodically
  useEffect(() => {
    const updateExpiry = async () => {
      await getAccessToken(); // Ensure token is loaded
      setTokenExpiry(getTokenExpiryTime());
    };
    updateExpiry();
    const interval = setInterval(updateExpiry, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [getAccessToken, getTokenExpiryTime]);

  const handleSignOut = async () => {
    await signOut();
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: prefersReducedMotion ? {} : {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion ? { duration: 0.2 } : {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  // Calculate success rate
  const successRate = stats
    ? stats.totalDeployed + stats.failed > 0
      ? Math.round((stats.totalDeployed / (stats.totalDeployed + stats.failed)) * 100)
      : 100
    : 0;

  // Token status helper
  const getTokenStatus = () => {
    if (tokenExpiry === null) return { color: 'zinc', label: 'Unknown', bg: 'bg-zinc-500/10', text: 'text-zinc-400' };
    if (tokenExpiry > 30) return { color: 'success', label: 'Active', bg: 'bg-status-success/10', text: 'text-status-success' };
    if (tokenExpiry > 5) return { color: 'warning', label: 'Expiring Soon', bg: 'bg-status-warning/10', text: 'text-status-warning' };
    return { color: 'error', label: 'Expiring', bg: 'bg-status-error/10', text: 'text-status-error' };
  };

  const tokenStatus = getTokenStatus();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Account"
        description="Your profile, usage statistics, and session details"
        gradient
        gradientColors="mixed"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Profile Section */}
        <motion.section
          variants={itemVariants}
          className="glass-dark rounded-xl p-6 border border-white/5 hover:border-accent-cyan/20 transition-colors relative overflow-hidden"
        >
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/5 via-transparent to-accent-violet/5 pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                <User className="w-5 h-5 text-accent-cyan" />
              </div>
              <h2 className="text-lg font-semibold text-white">Profile</h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              {/* Large Avatar */}
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-br from-accent-cyan via-accent-violet to-accent-cyan rounded-full opacity-75 blur-sm" />
                <div className="relative w-20 h-20 rounded-full bg-bg-elevated flex items-center justify-center border-2 border-bg-surface">
                  <span className="text-2xl font-bold text-white">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-status-success rounded-full border-2 border-bg-surface" />
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-1">
                <ProfileRow
                  label="Name"
                  value={user?.name || 'Not provided'}
                />
                <ProfileRow
                  label="Email"
                  value={user?.email || 'Not provided'}
                />
                <ProfileRow
                  label="Microsoft Account ID"
                  value={user?.id || 'Not available'}
                  mono
                  truncate
                  copyable
                  onCopy={(val) => copyToClipboard(val, 'id')}
                  copied={copiedField === 'id'}
                  noBorder
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Usage Statistics */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-violet/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent-violet" />
            </div>
            <h2 className="text-lg font-semibold text-white">Usage Statistics</h2>
          </div>

          <StatCardGrid columns={2}>
            <AnimatedStatCard
              title="Total Deployed"
              value={stats?.totalDeployed ?? 0}
              icon={Zap}
              color="cyan"
              loading={statsLoading}
              description="All-time deployments"
              delay={0}
            />
            <AnimatedStatCard
              title="This Month"
              value={stats?.thisMonth ?? 0}
              icon={Calendar}
              color="violet"
              loading={statsLoading}
              description="Current month"
              delay={0.1}
            />
            <AnimatedStatCard
              title="Success Rate"
              value={successRate}
              valueType="percentage"
              icon={TrendingUp}
              color="success"
              loading={statsLoading}
              description="Deployment success"
              delay={0.2}
            />
            <AnimatedStatCard
              title="Pending Jobs"
              value={stats?.pending ?? 0}
              icon={Activity}
              color={stats?.pending && stats.pending > 0 ? 'warning' : 'neutral'}
              loading={statsLoading}
              description="In progress"
              delay={0.3}
            />
          </StatCardGrid>
        </motion.section>

        {/* Tenant Details */}
        <motion.section
          variants={itemVariants}
          className="glass-dark rounded-xl p-6 border border-white/5 hover:border-accent-cyan/20 transition-colors"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent-violet/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent-violet" />
            </div>
            <h2 className="text-lg font-semibold text-white">Tenant Details</h2>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div>
                <p className="text-zinc-400 text-sm">Connection Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-status-success" />
                  <p className="text-status-success">Connected</p>
                </div>
              </div>
            </div>

            <ProfileRow
              label="Tenant ID"
              value={user?.tenantId || 'Not available'}
              mono
              truncate
              copyable
              onCopy={(val) => copyToClipboard(val, 'tenantId')}
              copied={copiedField === 'tenantId'}
            />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-zinc-400 text-sm">Intune Portal</p>
                <a
                  href="https://intune.microsoft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-accent-cyan hover:text-accent-cyan-bright transition-colors mt-1"
                >
                  Open Intune Portal
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Session Information */}
        <motion.section
          variants={itemVariants}
          className="glass-dark rounded-xl p-6 border border-white/5 hover:border-accent-cyan/20 transition-colors"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-cyan" />
            </div>
            <h2 className="text-lg font-semibold text-white">Session</h2>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div>
                <p className="text-zinc-400 text-sm">Token Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    tokenStatus.bg,
                    tokenStatus.text
                  )}>
                    <Timer className="w-3 h-3" />
                    {tokenStatus.label}
                  </span>
                  {tokenExpiry !== null && (
                    <span className="text-zinc-500 text-sm">
                      {tokenExpiry > 0 ? `${tokenExpiry} min remaining` : 'Expired'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <ProfileRow
              label="Authentication Provider"
              value="Microsoft Entra ID"
              noBorder
            />
          </div>
        </motion.section>

        {/* Danger Zone */}
        <motion.section
          variants={itemVariants}
          className="rounded-xl p-6 border border-status-error/20 bg-status-error/5 hover:border-status-error/30 transition-colors"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-status-error/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-status-error" />
            </div>
            <h2 className="text-lg font-semibold text-white">Sign Out</h2>
          </div>

          <p className="text-zinc-400 text-sm mb-4">
            Signing out will disconnect your Microsoft account from IntuneGet. You
            will need to sign in again to deploy applications.
          </p>

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-status-error/30 text-status-error hover:bg-status-error/10 hover:border-status-error/50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </motion.section>
      </motion.div>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  mono,
  truncate,
  noBorder,
  copyable,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
  noBorder?: boolean;
  copyable?: boolean;
  onCopy?: (value: string) => void;
  copied?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-3 gap-4',
        !noBorder && 'border-b border-white/5'
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-zinc-400 text-sm">{label}</p>
        <p className={cn(
          'text-white mt-0.5',
          mono && 'font-mono text-sm',
          truncate && 'truncate'
        )}>
          {value}
        </p>
      </div>
      {copyable && onCopy && value && value !== 'Not available' && (
        <button
          onClick={() => onCopy(value)}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-status-success" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}
