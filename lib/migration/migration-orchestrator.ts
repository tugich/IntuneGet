/**
 * SCCM Migration Orchestrator
 * Coordinates the migration of SCCM applications to Intune
 * Integrates with the existing cart workflow and packaging pipeline
 */

import type {
  SccmApplication,
  SccmAppRecord,
  SccmMigrationOptions,
  SccmMigrationPreviewItem,
  SccmMigrationResult,
  SccmMigrationProject,
} from '@/types/sccm';
import type { Win32CartItem } from '@/types/upload';
import type { DetectionRule } from '@/types/intune';
import type { NormalizedInstaller, NormalizedPackage, WingetScope } from '@/types/winget';
import { convertSccmAppSettings, convertDetectionRules, validateDetectionRules } from './settings-converter';
import { createCartItem } from '@/stores/cart-store';

/**
 * Migration preparation result
 */
export interface MigrationPreparation {
  appId: string;
  sccmApp: SccmAppRecord;
  wingetPackage: NormalizedPackage | null;
  installer: NormalizedInstaller | null;
  cartItem: Omit<Win32CartItem, 'id' | 'addedAt'> | null;
  preview: SccmMigrationPreviewItem;
  canMigrate: boolean;
  errors: string[];
}

/**
 * Build a cart item for an SCCM app migration
 */
export async function buildMigrationCartItem(
  sccmApp: SccmAppRecord,
  wingetPackage: NormalizedPackage,
  installer: NormalizedInstaller,
  options: SccmMigrationOptions
): Promise<{
  cartItem: Omit<Win32CartItem, 'id' | 'addedAt'>;
  detectionSource: 'sccm' | 'winget' | 'hybrid';
  commandSource: 'sccm' | 'winget';
  warnings: string[];
}> {
  const warnings: string[] = [];
  let detectionRules: DetectionRule[] = [];
  let detectionSource: 'sccm' | 'winget' | 'hybrid' = 'winget';
  let commandSource: 'sccm' | 'winget' = 'winget';
  let installCommand: string;
  let uninstallCommand: string;
  let installScope: WingetScope = 'machine';

  // Determine detection rules source
  if (options.preserveDetection && sccmApp.sccmDetectionRules && sccmApp.sccmDetectionRules.length > 0) {
    // Convert SCCM detection rules
    const convertedRules = sccmApp.convertedDetectionRules as DetectionRule[] | undefined;

    if (convertedRules && convertedRules.length > 0) {
      detectionRules = convertedRules;
      detectionSource = 'sccm';
    } else {
      // Convert on the fly if not pre-converted
      const freshConverted = convertDetectionRules(sccmApp.sccmDetectionRules);
      if (freshConverted.length > 0) {
        detectionRules = freshConverted;
        detectionSource = 'sccm';
      } else {
        warnings.push('SCCM detection rules could not be converted, using WinGet defaults');
      }
    }
  }

  // Fall back to or supplement with WinGet detection
  if (detectionRules.length === 0 || options.useWingetDefaults) {
    const baseCartItem = createCartItem(
      wingetPackage.id,
      wingetPackage.name,
      wingetPackage.publisher,
      wingetPackage.version,
      installer,
      'machine'
    );

    if (detectionRules.length === 0) {
      detectionRules = baseCartItem.detectionRules;
      detectionSource = 'winget';
    } else {
      // Hybrid: combine SCCM and WinGet rules
      detectionSource = 'hybrid';
    }

    installCommand = baseCartItem.installCommand;
    uninstallCommand = baseCartItem.uninstallCommand;
  } else {
    // Use SCCM commands if preserving
    installCommand = options.preserveInstallCommands && sccmApp.sccmInstallCommand
      ? sccmApp.sccmInstallCommand
      : '';
    uninstallCommand = options.preserveInstallCommands && sccmApp.sccmUninstallCommand
      ? sccmApp.sccmUninstallCommand
      : '';

    if (options.preserveInstallCommands && sccmApp.sccmInstallCommand) {
      commandSource = 'sccm';
    }

    // Fall back to WinGet commands if SCCM ones are empty
    if (!installCommand || !uninstallCommand) {
      const baseCartItem = createCartItem(
        wingetPackage.id,
        wingetPackage.name,
        wingetPackage.publisher,
        wingetPackage.version,
        installer,
        'machine'
      );
      installCommand = installCommand || baseCartItem.installCommand;
      uninstallCommand = uninstallCommand || baseCartItem.uninstallCommand;
    }
  }

  // Determine install scope from SCCM settings
  if (sccmApp.convertedInstallBehavior) {
    installScope = sccmApp.convertedInstallBehavior;
  } else if (sccmApp.sccmInstallBehavior) {
    installScope = sccmApp.sccmInstallBehavior === 'InstallForUser' ? 'user' : 'machine';
  }

  // Validate detection rules
  const validation = validateDetectionRules(detectionRules);
  if (!validation.valid) {
    warnings.push(...validation.errors);
  }
  warnings.push(...validation.warnings);

  // Build the cart item
  const cartItem = createCartItem(
    wingetPackage.id,
    wingetPackage.name,
    wingetPackage.publisher,
    wingetPackage.version,
    installer,
    installScope
  );

  // Override with our computed values
  cartItem.detectionRules = detectionRules;
  cartItem.installCommand = installCommand;
  cartItem.uninstallCommand = uninstallCommand;

  return {
    cartItem,
    detectionSource,
    commandSource,
    warnings,
  };
}

/**
 * Generate a migration preview for a single app
 */
export async function generateMigrationPreview(
  sccmApp: SccmAppRecord,
  wingetPackage: NormalizedPackage | null,
  installer: NormalizedInstaller | null,
  options: SccmMigrationOptions
): Promise<SccmMigrationPreviewItem> {
  const warnings: string[] = [];
  const blockingReasons: string[] = [];

  // Check if app can be migrated
  if (!sccmApp.matchedWingetId || sccmApp.matchStatus === 'unmatched') {
    blockingReasons.push('No WinGet package matched');
  }

  if (sccmApp.matchStatus === 'excluded' || sccmApp.matchStatus === 'skipped') {
    blockingReasons.push('App is marked as excluded');
  }

  if (sccmApp.technology === 'AppV') {
    blockingReasons.push('App-V packages are not supported in Intune');
  }

  if (!wingetPackage) {
    blockingReasons.push('WinGet package not found');
  }

  if (!installer) {
    blockingReasons.push('No compatible installer found');
  }

  if (sccmApp.migrationStatus === 'completed') {
    blockingReasons.push('App already migrated');
  }

  // If we can't migrate, return early with blocking info
  if (blockingReasons.length > 0) {
    return {
      appId: sccmApp.id,
      sccmName: sccmApp.displayName,
      wingetId: sccmApp.matchedWingetId || '',
      wingetName: sccmApp.matchedWingetName || '',
      detectionRules: [],
      installCommand: '',
      uninstallCommand: '',
      installBehavior: 'machine',
      detectionSource: 'winget',
      commandSource: 'winget',
      warnings,
      canMigrate: false,
      blockingReasons,
    };
  }

  // Build cart item preview
  const { cartItem, detectionSource, commandSource, warnings: buildWarnings } =
    await buildMigrationCartItem(sccmApp, wingetPackage!, installer!, options);

  warnings.push(...buildWarnings);

  return {
    appId: sccmApp.id,
    sccmName: sccmApp.displayName,
    wingetId: wingetPackage!.id,
    wingetName: wingetPackage!.name,
    detectionRules: cartItem.detectionRules,
    installCommand: cartItem.installCommand,
    uninstallCommand: cartItem.uninstallCommand,
    installBehavior: cartItem.installScope === 'user' ? 'user' : 'machine',
    detectionSource,
    commandSource,
    warnings,
    canMigrate: true,
  };
}

/**
 * Prepare migrations for multiple apps
 */
export async function prepareMigrations(
  apps: SccmAppRecord[],
  options: SccmMigrationOptions,
  fetchWingetPackage: (wingetId: string) => Promise<NormalizedPackage | null>,
  fetchBestInstaller: (pkg: NormalizedPackage) => Promise<NormalizedInstaller | null>,
  onProgress?: (processed: number, total: number, currentApp: string) => void
): Promise<MigrationPreparation[]> {
  const preparations: MigrationPreparation[] = [];

  for (let i = 0; i < apps.length; i++) {
    const app = apps[i];

    if (onProgress) {
      onProgress(i, apps.length, app.displayName);
    }

    // Fetch WinGet package if matched
    let wingetPackage: NormalizedPackage | null = null;
    let installer: NormalizedInstaller | null = null;

    if (app.matchedWingetId) {
      wingetPackage = await fetchWingetPackage(app.matchedWingetId);
      if (wingetPackage) {
        installer = await fetchBestInstaller(wingetPackage);
      }
    }

    // Generate preview
    const preview = await generateMigrationPreview(app, wingetPackage, installer, options);

    // Build cart item if migratable
    let cartItem: Omit<Win32CartItem, 'id' | 'addedAt'> | null = null;
    if (preview.canMigrate && wingetPackage && installer) {
      const result = await buildMigrationCartItem(app, wingetPackage, installer, options);
      cartItem = result.cartItem;
    }

    preparations.push({
      appId: app.id,
      sccmApp: app,
      wingetPackage,
      installer,
      cartItem,
      preview,
      canMigrate: preview.canMigrate,
      errors: preview.blockingReasons || [],
    });
  }

  if (onProgress) {
    onProgress(apps.length, apps.length, 'Complete');
  }

  return preparations;
}

/**
 * Execute migration for prepared apps
 * Returns cart items to be added to the cart store
 */
export function executeMigrationBatch(
  preparations: MigrationPreparation[]
): {
  cartItems: Array<Omit<Win32CartItem, 'id' | 'addedAt'>>;
  successful: string[];
  failed: Array<{ appId: string; error: string }>;
} {
  const cartItems: Array<Omit<Win32CartItem, 'id' | 'addedAt'>> = [];
  const successful: string[] = [];
  const failed: Array<{ appId: string; error: string }> = [];

  for (const prep of preparations) {
    if (prep.canMigrate && prep.cartItem) {
      cartItems.push(prep.cartItem);
      successful.push(prep.appId);
    } else {
      failed.push({
        appId: prep.appId,
        error: prep.errors.join('; ') || 'Unknown error',
      });
    }
  }

  return { cartItems, successful, failed };
}

/**
 * Calculate migration statistics
 */
export function calculateMigrationStats(preparations: MigrationPreparation[]): {
  total: number;
  migratable: number;
  blocked: number;
  withSccmDetection: number;
  withSccmCommands: number;
  warnings: number;
} {
  return {
    total: preparations.length,
    migratable: preparations.filter(p => p.canMigrate).length,
    blocked: preparations.filter(p => !p.canMigrate).length,
    withSccmDetection: preparations.filter(p =>
      p.preview.detectionSource === 'sccm' || p.preview.detectionSource === 'hybrid'
    ).length,
    withSccmCommands: preparations.filter(p => p.preview.commandSource === 'sccm').length,
    warnings: preparations.reduce((sum, p) => sum + p.preview.warnings.length, 0),
  };
}

/**
 * Group preparations by migration readiness
 */
export function groupByMigrationStatus(preparations: MigrationPreparation[]): {
  ready: MigrationPreparation[];
  needsReview: MigrationPreparation[];
  blocked: MigrationPreparation[];
} {
  const ready: MigrationPreparation[] = [];
  const needsReview: MigrationPreparation[] = [];
  const blocked: MigrationPreparation[] = [];

  for (const prep of preparations) {
    if (!prep.canMigrate) {
      blocked.push(prep);
    } else if (prep.preview.warnings.length > 0) {
      needsReview.push(prep);
    } else {
      ready.push(prep);
    }
  }

  return { ready, needsReview, blocked };
}

/**
 * Convert SCCM app record to migration-ready format
 */
export function convertAppForMigration(app: SccmAppRecord): {
  displayName: string;
  publisher: string | null;
  version: string | null;
  detectionRules: DetectionRule[];
  installBehavior: 'machine' | 'user';
} {
  // Pre-convert detection rules if not already done
  let detectionRules = app.convertedDetectionRules as DetectionRule[] | undefined;
  if (!detectionRules) {
    detectionRules = convertDetectionRules(app.sccmDetectionRules);
  }

  // Map install behavior
  let installBehavior: 'machine' | 'user' = 'machine';
  if (app.convertedInstallBehavior) {
    installBehavior = app.convertedInstallBehavior;
  } else if (app.sccmInstallBehavior === 'InstallForUser') {
    installBehavior = 'user';
  }

  return {
    displayName: app.displayName,
    publisher: app.manufacturer,
    version: app.version,
    detectionRules,
    installBehavior,
  };
}

/**
 * Build migration history entry
 */
export function buildMigrationHistoryEntry(
  projectId: string,
  userId: string,
  tenantId: string,
  action: string,
  appId?: string,
  appName?: string,
  previousValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>,
  success: boolean = true,
  errorMessage?: string
): Record<string, unknown> {
  return {
    project_id: projectId,
    user_id: userId,
    tenant_id: tenantId,
    action,
    app_id: appId,
    app_name: appName,
    previous_value: previousValue,
    new_value: newValue,
    success,
    error_message: errorMessage,
    created_at: new Date().toISOString(),
  };
}
