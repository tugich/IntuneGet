'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpdatePolicySelector } from './UpdatePolicySelector';
import { cn } from '@/lib/utils';
import type { AvailableUpdate, UpdatePolicyType } from '@/types/update-policies';

interface UpdateCardProps {
  update: AvailableUpdate;
  onTriggerUpdate: (update: AvailableUpdate) => Promise<void>;
  onPolicyChange: (update: AvailableUpdate, policyType: UpdatePolicyType) => Promise<void>;
  onDismiss?: (update: AvailableUpdate) => void;
  isUpdating?: boolean;
}

export function UpdateCard({
  update,
  onTriggerUpdate,
  onPolicyChange,
  onDismiss,
  isUpdating = false,
}: UpdateCardProps) {
  const [iconError, setIconError] = useState(false);

  const handlePolicyChange = async (policyType: UpdatePolicyType) => {
    await onPolicyChange(update, policyType);
  };

  const policyStatus = update.policy;
  const isAutoUpdateEnabled =
    policyStatus?.policy_type === 'auto_update' && policyStatus?.is_enabled;
  const hasFailures = (policyStatus?.consecutive_failures || 0) > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'glass-dark rounded-xl p-4 border transition-all duration-200',
        update.is_critical
          ? 'border-status-warning/30 bg-status-warning/5'
          : 'border-white/5 hover:border-white/10'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* App Icon */}
        <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
          {update.large_icon_value && !iconError ? (
            <img
              src={`data:${update.large_icon_type || 'image/png'};base64,${update.large_icon_value}`}
              alt={update.display_name}
              className="w-9 h-9 rounded"
              onError={() => setIconError(true)}
            />
          ) : (
            <Package className="w-5 h-5 text-zinc-500" />
          )}
        </div>

        {/* App Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-white truncate">
              {update.display_name}
            </h3>
            {update.is_critical && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-status-warning bg-status-warning/10 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                Critical
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono">{update.winget_id}</span>
          </div>

          {/* Version Info */}
          <div className="flex items-center gap-2 mt-3">
            <span className="px-2 py-1 text-xs font-mono text-zinc-400 bg-white/5 rounded">
              {update.current_version}
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
            <span className="px-2 py-1 text-xs font-mono text-status-success bg-status-success/10 rounded">
              {update.latest_version}
            </span>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-3 mt-3">
            {isAutoUpdateEnabled && (
              <span className="flex items-center gap-1 text-xs text-status-success">
                <RefreshCw className="w-3 h-3" />
                Auto-update enabled
              </span>
            )}
            {hasFailures && (
              <span className="flex items-center gap-1 text-xs text-status-error">
                <XCircle className="w-3 h-3" />
                {policyStatus?.consecutive_failures} failures
              </span>
            )}
            {policyStatus?.last_auto_update_at && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="w-3 h-3" />
                Last update: {new Date(policyStatus.last_auto_update_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <UpdatePolicySelector
            currentPolicy={policyStatus?.policy_type || null}
            onPolicyChange={handlePolicyChange}
            size="sm"
            showLabel={false}
          />

          <Button
            size="sm"
            onClick={() => onTriggerUpdate(update)}
            disabled={isUpdating}
            className="bg-accent-cyan hover:bg-accent-cyan-bright text-bg-deepest font-medium"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Update
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

interface UpdateCardSkeletonProps {
  count?: number;
}

export function UpdateCardSkeleton({ count = 3 }: UpdateCardSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-dark rounded-xl p-4 border border-white/5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-11 h-11 bg-white/5 rounded-lg animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-40 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-white/5 rounded animate-pulse mb-3" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
                <div className="h-4 w-4 bg-white/5 rounded animate-pulse" />
                <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white/5 rounded animate-pulse" />
              <div className="h-8 w-20 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
