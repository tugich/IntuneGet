import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface ResolveTargetTenantInput {
  supabase: ReturnType<typeof createServerClient>;
  userId: string;
  tokenTenantId: string;
  requestedTenantId: string | null;
}

interface ResolveTargetTenantResult {
  tenantId: string;
  errorResponse: NextResponse | null;
}

/**
 * Resolve the effective tenant for MSP users and enforce tenant access checks.
 * Falls back to token tenant when no override is requested.
 */
export async function resolveTargetTenantId({
  supabase,
  userId,
  tokenTenantId,
  requestedTenantId,
}: ResolveTargetTenantInput): Promise<ResolveTargetTenantResult> {
  if (!requestedTenantId || requestedTenantId === tokenTenantId) {
    return { tenantId: tokenTenantId, errorResponse: null };
  }

  const { data: membership } = await supabase
    .from('msp_user_memberships')
    .select('msp_organization_id')
    .eq('user_id', userId)
    .single();

  if (!membership) {
    return {
      tenantId: tokenTenantId,
      errorResponse: NextResponse.json(
        { error: 'Not authorized to access other tenants' },
        { status: 403 }
      ),
    };
  }

  const { data: managedTenant } = await supabase
    .from('msp_managed_tenants')
    .select('id')
    .eq('msp_organization_id', membership.msp_organization_id)
    .eq('tenant_id', requestedTenantId)
    .eq('consent_status', 'granted')
    .eq('is_active', true)
    .single();

  if (!managedTenant) {
    return {
      tenantId: tokenTenantId,
      errorResponse: NextResponse.json(
        { error: 'Target tenant is not managed by your MSP organization or has not granted consent' },
        { status: 403 }
      ),
    };
  }

  return { tenantId: requestedTenantId, errorResponse: null };
}
