'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  RefreshCw,
  Loader2,
  Package,
  AlertTriangle,
  ExternalLink,
  Radar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Monitor,
  LayoutGrid,
  Rows3,
  ArrowUpDown,
  X,
  ShoppingCart,
  Link as LinkIcon,
  Sparkles,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UnmanagedAppCard,
  ClaimAppModal,
  LinkPackageModal,
  ClaimAllModal,
} from '@/components/unmanaged';
import type { ClaimAllModalState, ClaimStatus } from '@/components/unmanaged';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useCartStore } from '@/stores/cart-store';
import { generateDetectionRules, generateInstallCommand, generateUninstallCommand } from '@/lib/detection-rules';
import { DEFAULT_PSADT_CONFIG, getDefaultProcessesToClose } from '@/types/psadt';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AppIcon } from '@/components/AppIcon';
import type {
  UnmanagedApp,
  UnmanagedAppsResponse,
  UnmanagedAppsStats,
  UnmanagedAppsFilters,
  MatchStatus,
} from '@/types/unmanaged';

const defaultFilters: UnmanagedAppsFilters = {
  search: '',
  matchStatus: 'all',
  platform: 'all',
  sortBy: 'deviceCount',
  sortOrder: 'desc',
  showClaimed: true,
};

type ViewMode = 'grid' | 'list';

// Animated counter component
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <>{displayValue.toLocaleString()}</>;
}

// Radial progress component for stats
function RadialProgress({
  value,
  max,
  color,
  size = 56
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r="22"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        className="text-black/5"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r="22"
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
        style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
    </svg>
  );
}

// Stats card with radial progress
function StatCard({
  label,
  value,
  total,
  icon: Icon,
  color,
  delay = 0
}: {
  label: string;
  value: number;
  total: number;
  icon: typeof Monitor;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="relative group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative glass-light rounded-2xl p-5 border border-black/[0.03] group-hover:border-black/10 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-text-primary tabular-nums">
              <AnimatedNumber value={value} />
            </p>
          </div>
          <div className="relative">
            <RadialProgress value={value} max={total} color={color} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter chip component
function FilterChip({
  active,
  onClick,
  children,
  count,
  color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        active
          ? "bg-black/10 text-text-primary shadow-lg"
          : "bg-black/[0.03] text-text-secondary hover:bg-black/[0.06] hover:text-text-primary"
      )}
      style={active && color ? {
        boxShadow: `0 0 20px ${color}30`,
        borderColor: `${color}40`
      } : {}}
    >
      {active && (
        <span
          className="absolute inset-0 rounded-full opacity-20"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="relative">{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            "relative px-2 py-0.5 rounded-full text-xs tabular-nums",
            active ? "bg-black/20" : "bg-black/5"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// Enhanced app row for list view
function AppListRow({
  app,
  onClaim,
  onLink,
  isClaimLoading
}: {
  app: UnmanagedApp;
  onClaim: () => void;
  onLink: () => void;
  isClaimLoading: boolean;
}) {
  const canClaim = app.matchStatus === 'matched' && !app.isClaimed;
  const canLink = app.matchStatus === 'unmatched' || app.matchStatus === 'partial';

  const statusConfig = {
    matched: { color: '#10b981', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Matched' },
    partial: { color: '#f59e0b', bg: 'bg-amber-500/10', icon: AlertCircle, label: 'Partial' },
    unmatched: { color: '#71717a', bg: 'bg-zinc-500/10', icon: HelpCircle, label: 'No Match' },
    pending: { color: '#06b6d4', bg: 'bg-cyan-500/10', icon: Clock, label: 'Pending' },
  };

  const status = statusConfig[app.matchStatus];
  const StatusIcon = status.icon;

  return (
    <div className="group relative">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-black/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center gap-4 p-4 rounded-xl bg-black/[0.02] border border-black/[0.03] group-hover:border-black/10 transition-all duration-200">
        {/* App icon */}
        <div className="relative flex-shrink-0">
          <AppIcon
            packageId={app.matchedPackageId || app.displayName}
            packageName={app.displayName}
            size="md"
            className="group-hover:scale-105 transition-transform duration-200"
          />
          {app.isClaimed && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-bg-surface">
              <CheckCircle2 className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* App info */}
        <div className="flex-1 min-w-0 grid grid-cols-[1fr,auto,auto,auto] gap-4 items-center">
          <div className="min-w-0">
            <h3 className="text-text-primary font-medium truncate group-hover:text-accent-cyan-bright transition-colors">
              {app.displayName}
            </h3>
            <p className="text-text-muted text-sm truncate">{app.publisher || 'Unknown publisher'}</p>
          </div>

          {/* Device count */}
          <div className="flex items-center gap-2 text-text-secondary">
            <Monitor className="w-4 h-4" />
            <span className="text-sm tabular-nums">{app.deviceCount.toLocaleString()}</span>
          </div>

          {/* Status badge */}
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", status.bg)}>
            <StatusIcon className="w-3.5 h-3.5" style={{ color: status.color }} />
            <span style={{ color: status.color }}>{status.label}</span>
            {app.matchConfidence && app.matchStatus !== 'unmatched' && (
              <span className="opacity-60">({Math.round(app.matchConfidence * 100)}%)</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canLink && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onLink}
                className="h-8 px-3 text-text-secondary hover:text-text-primary hover:bg-black/10"
              >
                <LinkIcon className="w-4 h-4" />
              </Button>
            )}
            {canClaim && (
              <Button
                size="sm"
                onClick={onClaim}
                disabled={isClaimLoading}
                className="h-8 px-4 bg-gradient-to-r from-accent-cyan to-accent-violet hover:opacity-90 text-white border-0"
              >
                {isClaimLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                    Claim
                  </>
                )}
              </Button>
            )}
            {app.isClaimed && (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Claimed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UnmanagedAppsPage() {
  const { getAccessToken, isAuthenticated } = useMicrosoftAuth();
  const addItem = useCartStore((state) => state.addItem);
  const addItemSilent = useCartStore((state) => state.addItemSilent);
  const cartItems = useCartStore((state) => state.items);
  const tokenRef = useRef<string | null>(null);

  // Data state
  const [apps, setApps] = useState<UnmanagedApp[]>([]);
  const [stats, setStats] = useState<UnmanagedAppsStats | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<UnmanagedAppsFilters>(defaultFilters);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mounted, setMounted] = useState(false);

  // Modal state
  const [claimModalApp, setClaimModalApp] = useState<UnmanagedApp | null>(null);
  const [linkModalApp, setLinkModalApp] = useState<UnmanagedApp | null>(null);
  const [claimingAppId, setClaimingAppId] = useState<string | null>(null);
  const [claimAllModal, setClaimAllModal] = useState<ClaimAllModalState | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current access token
  const getToken = useCallback(async (): Promise<string | null> => {
    const token = await getAccessToken();
    tokenRef.current = token;
    return token;
  }, [getAccessToken]);

  // Fetch unmanaged apps
  const fetchApps = useCallback(async (forceRefresh = false) => {
    const accessToken = await getToken();
    if (!accessToken) return;

    try {
      const url = `/api/intune/unmanaged-apps${forceRefresh ? '?refresh=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 403 && errorData.permissionRequired) {
          setPermissionError(errorData.permissionRequired);
          return;
        }

        throw new Error(errorData.error || 'Failed to fetch unmanaged apps');
      }

      setPermissionError(null);
      const data: UnmanagedAppsResponse = await response.json();
      setApps(data.apps);
      setLastSynced(data.lastSynced);
      setFromCache(data.fromCache);
    } catch (error) {
      console.error('Error fetching unmanaged apps:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch unmanaged apps from Intune',
        variant: 'destructive',
      });
    }
  }, [getToken]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    const accessToken = await getToken();
    if (!accessToken) return;

    try {
      const response = await fetch('/api/intune/unmanaged-apps', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data: UnmanagedAppsStats = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [getToken]);

  // Initial load
  useEffect(() => {
    if (!isAuthenticated) return;

    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchApps(), fetchStats()]);
      setIsLoading(false);
    };
    load();
  }, [fetchApps, fetchStats, isAuthenticated]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchApps(true), fetchStats()]);
    setIsRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Unmanaged apps list has been updated',
    });
  };

  // Create a set of wingetIds currently in cart for quick lookup
  const cartWingetIds = useMemo(() => {
    return new Set(cartItems.map(item => item.wingetId));
  }, [cartItems]);

  // Filter and sort apps
  const filteredApps = useMemo(() => {
    let result = [...apps];

    // Hide Microsoft apps - they cause issues with manifests
    result = result.filter((app) => {
      const publisherLower = (app.publisher || '').toLowerCase();
      const packageIdLower = (app.matchedPackageId || '').toLowerCase();
      const displayNameLower = app.displayName.toLowerCase();

      // Filter out Microsoft apps
      const isMicrosoft =
        publisherLower.includes('microsoft') ||
        packageIdLower.startsWith('microsoft.') ||
        displayNameLower.startsWith('microsoft ');

      return !isMicrosoft;
    });

    // Sync isClaimed status with actual cart contents
    result = result.map((app) => {
      const isActuallyInCart = app.matchedPackageId ? cartWingetIds.has(app.matchedPackageId) : false;
      return {
        ...app,
        isClaimed: isActuallyInCart,
      };
    });

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (app) =>
          app.displayName.toLowerCase().includes(searchLower) ||
          app.publisher?.toLowerCase().includes(searchLower) ||
          app.matchedPackageId?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.matchStatus !== 'all') {
      result = result.filter((app) => app.matchStatus === filters.matchStatus);
    }

    if (!filters.showClaimed) {
      result = result.filter((app) => !app.isClaimed);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'deviceCount':
          comparison = a.deviceCount - b.deviceCount;
          break;
        case 'publisher':
          comparison = (a.publisher || '').localeCompare(b.publisher || '');
          break;
        case 'matchStatus':
          const statusOrder = { matched: 0, partial: 1, unmatched: 2, pending: 3 };
          comparison = statusOrder[a.matchStatus] - statusOrder[b.matchStatus];
          break;
      }
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [apps, filters, cartWingetIds]);

  // Claim app handler
  const handleClaimApp = async (app: UnmanagedApp) => {
    const accessToken = await getToken();
    if (!accessToken || !app.matchedPackageId) return;

    setClaimingAppId(app.discoveredAppId);
    setClaimModalApp(null);

    try {
      // Step 1: Fetch manifest
      const manifestResponse = await fetch(
        `/api/winget/manifest?id=${encodeURIComponent(app.matchedPackageId)}&arch=x64`
      );

      if (!manifestResponse.ok) {
        throw new Error('Failed to fetch package manifest');
      }

      const { recommendedInstaller, manifest } = await manifestResponse.json();

      if (!recommendedInstaller) {
        throw new Error('No compatible installer found');
      }

      // Step 2: Generate detection rules and prepare cart item
      const detectionRules = generateDetectionRules(
        recommendedInstaller,
        manifest?.name || app.displayName,
        app.matchedPackageId,
        manifest?.version || app.version || ''
      );

      const processesToClose = getDefaultProcessesToClose(
        manifest?.name || app.displayName,
        recommendedInstaller.type
      );

      // Step 3: Add to cart
      addItem({
        wingetId: app.matchedPackageId,
        displayName: manifest?.name || app.displayName,
        publisher: manifest?.publisher || app.publisher || '',
        version: manifest?.version || app.version || '',
        architecture: recommendedInstaller.architecture,
        installScope: recommendedInstaller.scope || 'machine',
        installerType: recommendedInstaller.type,
        installerUrl: recommendedInstaller.url,
        installerSha256: recommendedInstaller.sha256,
        installCommand: generateInstallCommand(
          recommendedInstaller,
          recommendedInstaller.scope || 'machine'
        ),
        uninstallCommand: generateUninstallCommand(
          recommendedInstaller,
          manifest?.name || app.displayName
        ),
        detectionRules,
        psadtConfig: {
          ...DEFAULT_PSADT_CONFIG,
          processesToClose,
          detectionRules,
        },
      });

      // Step 4: Call claim API and validate response
      const claimResponse = await fetch('/api/intune/claim', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discoveredAppId: app.discoveredAppId,
          discoveredAppName: app.displayName,
          wingetPackageId: app.matchedPackageId,
          deviceCount: app.deviceCount,
        }),
      });

      if (!claimResponse.ok) {
        const errorData = await claimResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to record claim');
      }

      // Step 5: Only update UI state after ALL operations succeed
      setApps((prev) =>
        prev.map((a) =>
          a.discoveredAppId === app.discoveredAppId
            ? { ...a, isClaimed: true, claimStatus: 'pending' }
            : a
        )
      );

      // Step 6: Refresh stats to update counters
      fetchStats();
    } catch (error) {
      console.error('Error claiming app:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to claim app',
        variant: 'destructive',
      });
    } finally {
      setClaimingAppId(null);
    }
  };

  // Helper function to claim a single app (used by handleClaimAll)
  const claimSingleApp = async (
    app: UnmanagedApp,
    accessToken: string
  ): Promise<{ app: UnmanagedApp; success: boolean }> => {
    try {
      // Fetch manifest
      const manifestResponse = await fetch(
        `/api/winget/manifest?id=${encodeURIComponent(app.matchedPackageId!)}&arch=x64`
      );

      if (!manifestResponse.ok) {
        return { app, success: false };
      }

      const { recommendedInstaller, manifest } = await manifestResponse.json();

      if (!recommendedInstaller) {
        return { app, success: false };
      }

      // Generate detection rules and prepare cart item
      const detectionRules = generateDetectionRules(
        recommendedInstaller,
        manifest?.name || app.displayName,
        app.matchedPackageId!,
        manifest?.version || app.version || ''
      );

      const processesToClose = getDefaultProcessesToClose(
        manifest?.name || app.displayName,
        recommendedInstaller.type
      );

      // Add to cart silently (don't open cart popup during bulk operations)
      addItemSilent({
        wingetId: app.matchedPackageId!,
        displayName: manifest?.name || app.displayName,
        publisher: manifest?.publisher || app.publisher || '',
        version: manifest?.version || app.version || '',
        architecture: recommendedInstaller.architecture,
        installScope: recommendedInstaller.scope || 'machine',
        installerType: recommendedInstaller.type,
        installerUrl: recommendedInstaller.url,
        installerSha256: recommendedInstaller.sha256,
        installCommand: generateInstallCommand(
          recommendedInstaller,
          recommendedInstaller.scope || 'machine'
        ),
        uninstallCommand: generateUninstallCommand(
          recommendedInstaller,
          manifest?.name || app.displayName
        ),
        detectionRules,
        psadtConfig: {
          ...DEFAULT_PSADT_CONFIG,
          processesToClose,
          detectionRules,
        },
      });

      // Call claim API
      const claimResponse = await fetch('/api/intune/claim', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discoveredAppId: app.discoveredAppId,
          discoveredAppName: app.displayName,
          wingetPackageId: app.matchedPackageId,
          deviceCount: app.deviceCount,
        }),
      });

      if (!claimResponse.ok) {
        return { app, success: false };
      }

      return { app, success: true };
    } catch (error) {
      console.error(`Error claiming app ${app.displayName}:`, error);
      return { app, success: false };
    }
  };

  // Claim all matched apps handler - processes apps in parallel batches
  const handleClaimAll = async () => {
    const accessToken = await getToken();
    if (!accessToken) return;

    // Get all claimable apps from filtered list
    const claimableApps = filteredApps.filter(
      (app) => app.matchStatus === 'matched' && !app.isClaimed && app.matchedPackageId
    );

    if (claimableApps.length === 0) {
      toast({
        title: 'No apps to claim',
        description: 'All matched apps have already been claimed',
      });
      return;
    }

    // Initialize modal with all apps as "pending"
    const resultsMap = new Map<string, ClaimStatus>(
      claimableApps.map((a) => [a.discoveredAppId, 'pending'])
    );
    setClaimAllModal({
      isOpen: true,
      apps: claimableApps,
      results: resultsMap,
      isComplete: false,
    });

    const BATCH_SIZE = 5;
    const successfulAppIds: string[] = [];

    // Process apps in parallel batches
    for (let i = 0; i < claimableApps.length; i += BATCH_SIZE) {
      const batch = claimableApps.slice(i, i + BATCH_SIZE);

      // Process batch in parallel
      const results = await Promise.allSettled(
        batch.map((app) => claimSingleApp(app, accessToken))
      );

      // Update results map with batch outcomes
      results.forEach((result, idx) => {
        const appId = batch[idx].discoveredAppId;
        if (result.status === 'fulfilled' && result.value.success) {
          resultsMap.set(appId, 'success');
          successfulAppIds.push(appId);
        } else {
          resultsMap.set(appId, 'failed');
        }
      });

      // Update modal with new results (create new Map to trigger re-render)
      setClaimAllModal((prev) =>
        prev ? { ...prev, results: new Map(resultsMap) } : null
      );
    }

    // Batch update all app states at once (single re-render)
    setApps((prev) =>
      prev.map((a) =>
        successfulAppIds.includes(a.discoveredAppId)
          ? { ...a, isClaimed: true, claimStatus: 'pending' }
          : a
      )
    );

    // Mark modal as complete
    setClaimAllModal((prev) => (prev ? { ...prev, isComplete: true } : null));

    // Refresh stats
    fetchStats();
  };

  // Link package handler
  const handleLinkPackage = async (app: UnmanagedApp, wingetPackageId: string) => {
    const accessToken = await getToken();
    if (!accessToken) return;

    try {
      const response = await fetch('/api/mappings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discoveredAppName: app.displayName,
          discoveredPublisher: app.publisher,
          wingetPackageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create mapping');
      }

      // Check for cache update warning in response
      const responseData = await response.json();
      if (responseData.cacheWarning) {
        console.warn('Cache update warning:', responseData.cacheWarning);
      }

      setApps((prev) =>
        prev.map((a) =>
          a.discoveredAppId === app.discoveredAppId
            ? {
                ...a,
                matchStatus: 'matched' as MatchStatus,
                matchedPackageId: wingetPackageId,
                matchConfidence: 1.0,
              }
            : a
        )
      );

      // Refresh stats to update counters
      fetchStats();

      toast({
        title: 'Package linked',
        description: `${app.displayName} has been linked to ${wingetPackageId}`,
      });
    } catch (error) {
      console.error('Error linking package:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to link package',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Count apps by status
  // Filter out Microsoft apps for status counts (consistent with filteredApps)
  const nonMicrosoftApps = useMemo(() => {
    return apps.filter((app) => {
      const publisherLower = (app.publisher || '').toLowerCase();
      const packageIdLower = (app.matchedPackageId || '').toLowerCase();
      const displayNameLower = app.displayName.toLowerCase();

      const isMicrosoft =
        publisherLower.includes('microsoft') ||
        packageIdLower.startsWith('microsoft.') ||
        displayNameLower.startsWith('microsoft ');

      return !isMicrosoft;
    });
  }, [apps]);

  const statusCounts = useMemo(() => {
    return {
      all: nonMicrosoftApps.length,
      matched: nonMicrosoftApps.filter(a => a.matchStatus === 'matched').length,
      partial: nonMicrosoftApps.filter(a => a.matchStatus === 'partial').length,
      unmatched: nonMicrosoftApps.filter(a => a.matchStatus === 'unmatched').length,
    };
  }, [nonMicrosoftApps]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-accent-cyan/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-cyan animate-spin" />
            <div className="absolute inset-3 rounded-full border border-accent-violet/20" />
            <div className="absolute inset-3 rounded-full border border-transparent border-t-accent-violet animate-spin animation-delay-200" style={{ animationDirection: 'reverse' }} />
            <Radar className="absolute inset-0 m-auto w-8 h-8 text-accent-cyan animate-pulse" />
          </div>
          <p className="text-text-secondary text-lg">Scanning for unmanaged apps...</p>
          <p className="text-text-muted text-sm mt-2">Analyzing your Intune tenant</p>
        </div>
      </div>
    );
  }

  // Permission error state
  if (permissionError) {
    return (
      <div className="space-y-8">
        <div className={mounted ? 'animate-fade-up' : 'opacity-0'}>
          <h1 className="text-display-sm text-text-primary">Unmanaged Apps</h1>
          <p className="text-text-secondary mt-2">
            Unmanaged apps detected across your devices
          </p>
        </div>

        <div className={cn("glass-light rounded-2xl p-10 border border-amber-500/20", mounted ? 'animate-fade-up stagger-2' : 'opacity-0')}>
          <div className="flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
              <div className="absolute -inset-1 rounded-2xl bg-amber-500/20 blur-xl opacity-50" />
            </div>

            <h2 className="text-2xl font-semibold text-text-primary mb-3">Additional Permission Required</h2>
            <p className="text-text-secondary mb-8">
              To access unmanaged apps, your Azure AD application needs the{' '}
              <code className="text-accent-cyan bg-accent-cyan/10 px-2 py-1 rounded-md font-mono text-sm">
                {permissionError}
              </code>{' '}
              permission.
            </p>

            <div className="w-full bg-bg-elevated/50 rounded-xl p-6 text-left mb-8 border border-black/5">
              <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-cyan" />
                Quick Setup Guide
              </h3>
              <ol className="space-y-3">
                {[
                  'Go to Azure Portal > App registrations > Your app',
                  'Click "API permissions"',
                  'Add permission > Microsoft Graph > Application permissions',
                  `Search for "${permissionError}" and add it`,
                  'Click "Grant admin consent" for your organization',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-text-secondary">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-cyan/10 text-accent-cyan flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-3">
              <a
                href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-cyan to-accent-cyan-bright text-black font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Open Azure Portal
                <ExternalLink className="w-4 h-4" />
              </a>
              <Button
                variant="outline"
                onClick={() => {
                  setPermissionError(null);
                  handleRefresh();
                }}
                className="border-black/10 hover:bg-black/5"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={cn("flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6", mounted ? 'animate-fade-up' : 'opacity-0')}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 flex items-center justify-center">
                <Radar className="w-5 h-5 text-accent-cyan" />
              </div>
            </div>
            <h1 className="text-display-sm text-text-primary">Unmanaged Apps</h1>
          </div>
          <p className="text-text-secondary">
            Unmanaged apps detected across your devices. Claim them to enable managed deployment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastSynced && (
            <div className="flex items-center gap-2 text-xs text-text-muted bg-black/[0.03] px-3 py-2 rounded-lg">
              <div className={cn("w-2 h-2 rounded-full", fromCache ? "bg-amber-500" : "bg-emerald-500")} />
              <span>{fromCache ? 'Cached' : 'Live'}</span>
              <span className="text-text-muted">|</span>
              <span>{new Date(lastSynced).toLocaleTimeString()}</span>
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-black/10 hover:bg-black/5 hover:border-accent-cyan/30"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", mounted ? 'animate-fade-up stagger-2' : 'opacity-0')}>
          <StatCard
            label="Total Apps"
            value={stats.total}
            total={stats.total}
            icon={Package}
            color="#06b6d4"
            delay={0}
          />
          <StatCard
            label="Matched"
            value={stats.matched}
            total={stats.total}
            icon={CheckCircle2}
            color="#10b981"
            delay={50}
          />
          <StatCard
            label="Partial"
            value={stats.partial}
            total={stats.total}
            icon={AlertCircle}
            color="#f59e0b"
            delay={100}
          />
          <StatCard
            label="Unmatched"
            value={stats.unmatched}
            total={stats.total}
            icon={HelpCircle}
            color="#71717a"
            delay={150}
          />
          <StatCard
            label="Claimed"
            value={stats.claimed}
            total={stats.total}
            icon={ShoppingCart}
            color="#8b5cf6"
            delay={200}
          />
          <StatCard
            label="Devices"
            value={stats.totalDevices}
            total={stats.totalDevices}
            icon={Monitor}
            color="#3b82f6"
            delay={250}
          />
        </div>
      )}

      {/* Filters & Controls */}
      <div className={cn("space-y-4", mounted ? 'animate-fade-up stagger-3' : 'opacity-0')}>
        {/* Search and View Toggle */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by app name, publisher, or package ID..."
              className="pl-12 h-12 bg-black/[0.03] border-black/[0.06] focus:border-accent-cyan/50 rounded-xl text-base"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ ...filters, search: '' })}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-black/[0.03] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === 'grid'
                    ? "bg-black/10 text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === 'list'
                    ? "bg-black/10 text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                <Rows3 className="w-5 h-5" />
              </button>
            </div>

            {/* Sort toggle */}
            <Button
              variant="outline"
              onClick={() => setFilters({
                ...filters,
                sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc',
              })}
              className="border-black/[0.06] bg-black/[0.03] hover:bg-black/[0.06]"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {filters.sortBy === 'deviceCount' ? 'Devices' : 'Name'}
              <span className="ml-1 text-text-muted">
                ({filters.sortOrder === 'desc' ? 'High' : 'Low'})
              </span>
            </Button>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted uppercase tracking-wider mr-2">Filter:</span>
          <FilterChip
            active={filters.matchStatus === 'all'}
            onClick={() => setFilters({ ...filters, matchStatus: 'all' })}
            count={statusCounts.all}
            color="#06b6d4"
          >
            All
          </FilterChip>
          <FilterChip
            active={filters.matchStatus === 'matched'}
            onClick={() => setFilters({ ...filters, matchStatus: 'matched' })}
            count={statusCounts.matched}
            color="#10b981"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Matched
          </FilterChip>
          <FilterChip
            active={filters.matchStatus === 'partial'}
            onClick={() => setFilters({ ...filters, matchStatus: 'partial' })}
            count={statusCounts.partial}
            color="#f59e0b"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Partial
          </FilterChip>
          <FilterChip
            active={filters.matchStatus === 'unmatched'}
            onClick={() => setFilters({ ...filters, matchStatus: 'unmatched' })}
            count={statusCounts.unmatched}
            color="#71717a"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Unmatched
          </FilterChip>

          <div className="h-6 w-px bg-black/10 mx-2" />

          <FilterChip
            active={!filters.showClaimed}
            onClick={() => setFilters({ ...filters, showClaimed: !filters.showClaimed })}
            color="#8b5cf6"
          >
            {filters.showClaimed ? 'Hide Claimed' : 'Show Claimed'}
          </FilterChip>
        </div>
      </div>

      {/* Results count */}
      <div className={cn("flex items-center justify-between", mounted ? 'animate-fade-up stagger-4' : 'opacity-0')}>
        <p className="text-sm text-text-muted">
          Showing <span className="text-text-primary font-medium">{filteredApps.length}</span> of{' '}
          <span className="text-text-primary font-medium">{apps.length}</span> unmanaged apps
        </p>
        {filteredApps.length > 0 && filters.matchStatus === 'matched' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span>{filteredApps.filter(a => !a.isClaimed).length} ready to claim</span>
            </div>
            {filteredApps.filter(a => !a.isClaimed).length > 0 && (
              <Button
                onClick={handleClaimAll}
                disabled={claimAllModal?.isOpen}
                className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Claim All ({filteredApps.filter(a => !a.isClaimed).length})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Apps Display */}
      {filteredApps.length === 0 ? (
        <div className={cn("text-center py-20", mounted ? 'animate-fade-up stagger-5' : 'opacity-0')}>
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-black/5 to-black/10 flex items-center justify-center">
              <Package className="w-10 h-10 text-text-muted" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">No apps found</h3>
          <p className="text-text-secondary max-w-md mx-auto">
            {filters.search || filters.matchStatus !== 'all'
              ? 'Try adjusting your filters to see more results.'
              : 'No unmanaged apps were discovered in your tenant.'}
          </p>
          {(filters.search || filters.matchStatus !== 'all') && (
            <Button
              variant="outline"
              onClick={() => setFilters(defaultFilters)}
              className="mt-6 border-black/10"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-3", mounted ? 'animate-fade-up stagger-5' : 'opacity-0')}>
          {filteredApps.map((app, index) => (
            <div
              key={app.discoveredAppId}
              style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
            >
              <UnmanagedAppCard
                app={app}
                onClaim={() => setClaimModalApp(app)}
                onLink={() => setLinkModalApp(app)}
                isClaimLoading={claimingAppId === app.discoveredAppId}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("space-y-2", mounted ? 'animate-fade-up stagger-5' : 'opacity-0')}>
          {filteredApps.map((app, index) => (
            <div
              key={app.discoveredAppId}
              style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
            >
              <AppListRow
                app={app}
                onClaim={() => setClaimModalApp(app)}
                onLink={() => setLinkModalApp(app)}
                isClaimLoading={claimingAppId === app.discoveredAppId}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {claimModalApp && (
        <ClaimAppModal
          app={claimModalApp}
          isOpen={!!claimModalApp}
          onClose={() => setClaimModalApp(null)}
          onConfirm={handleClaimApp}
        />
      )}

      {linkModalApp && (
        <LinkPackageModal
          app={linkModalApp}
          isOpen={!!linkModalApp}
          onClose={() => setLinkModalApp(null)}
          onLink={handleLinkPackage}
        />
      )}

      {claimAllModal && (
        <ClaimAllModal
          state={claimAllModal}
          onClose={() => setClaimAllModal(null)}
        />
      )}
    </div>
  );
}
