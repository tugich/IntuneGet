'use client';

import { Monitor, CheckCircle2, AlertCircle, HelpCircle, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UnmanagedAppsStats } from '@/types/unmanaged';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: typeof Monitor;
  color: string;
  bgColor: string;
}

function StatsCard({ label, value, icon: Icon, color, bgColor }: StatsCardProps) {
  return (
    <div className="glass-light rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', bgColor)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
      </div>
    </div>
  );
}

interface UnmanagedAppsStatsProps {
  stats: UnmanagedAppsStats;
}

export function UnmanagedAppsStatsDisplay({ stats }: UnmanagedAppsStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatsCard
        label="Total Apps"
        value={stats.total.toLocaleString()}
        icon={Monitor}
        color="text-accent-cyan"
        bgColor="bg-accent-cyan/10"
      />
      <StatsCard
        label="Matched"
        value={stats.matched.toLocaleString()}
        icon={CheckCircle2}
        color="text-status-success"
        bgColor="bg-status-success/10"
      />
      <StatsCard
        label="Partial"
        value={stats.partial.toLocaleString()}
        icon={AlertCircle}
        color="text-amber-400"
        bgColor="bg-amber-500/10"
      />
      <StatsCard
        label="Unmatched"
        value={stats.unmatched.toLocaleString()}
        icon={HelpCircle}
        color="text-text-muted"
        bgColor="bg-black/5"
      />
      <StatsCard
        label="Claimed"
        value={stats.claimed.toLocaleString()}
        icon={ShoppingCart}
        color="text-accent-violet"
        bgColor="bg-accent-violet/10"
      />
      <StatsCard
        label="Total Devices"
        value={stats.totalDevices.toLocaleString()}
        icon={Monitor}
        color="text-blue-400"
        bgColor="bg-blue-500/10"
      />
    </div>
  );
}
