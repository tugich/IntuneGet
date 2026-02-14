import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseAccessToken } from '@/lib/auth-utils';
import { resolveTargetTenantId } from '@/lib/msp/tenant-resolution';

export async function GET(request: NextRequest) {
  try {
    const user = await parseAccessToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const wingetId = searchParams.get('wingetId');

    if (!wingetId) {
      return NextResponse.json(
        { error: 'wingetId parameter required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const mspTenantId = request.headers.get('X-MSP-Tenant-Id');

    const tenantResolution = await resolveTargetTenantId({
      supabase,
      userId: user.userId,
      tokenTenantId: user.tenantId,
      requestedTenantId: mspTenantId,
    });

    if (tenantResolution.errorResponse) {
      return tenantResolution.errorResponse;
    }

    // Get the most recent successfully deployed job's package_config
    const { data, error } = await supabase
      .from('packaging_jobs')
      .select('package_config, completed_at')
      .eq('user_id', user.userId)
      .eq('tenant_id', tenantResolution.tenantId)
      .eq('winget_id', wingetId)
      .eq('status', 'deployed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({
        config: null,
        deployedAt: null,
      });
    }

    return NextResponse.json({
      config: data.package_config,
      deployedAt: data.completed_at,
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
