/**
 * MSP Audit Logs API Routes
 * GET - Query audit logs with filters and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseAccessToken } from '@/lib/auth-utils';
import { queryAuditLogs } from '@/lib/audit-logger';
import { auditLogQuerySchema, validateMspInput } from '@/lib/validators/msp';
import { hasPermission, type MspRole } from '@/lib/msp-permissions';

/**
 * GET /api/msp/audit-logs
 * Query audit logs for the user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const user = parseAccessToken(request.headers.get('Authorization'));
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get user's membership and verify they belong to an organization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership, error: membershipError } = await (supabase as any)
      .from('msp_user_memberships')
      .select('msp_organization_id, role')
      .eq('user_id', user.userId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'MSP organization not found' },
        { status: 404 }
      );
    }

    // Check permission
    if (!hasPermission(membership.role as MspRole, 'view_audit_logs')) {
      return NextResponse.json(
        { error: 'You do not have permission to view audit logs' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
      action: searchParams.get('action') || undefined,
      resource_type: searchParams.get('resource_type') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
    };

    // Validate query params
    const validation = validateMspInput(auditLogQuerySchema, queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const result = await queryAuditLogs({
      organization_id: membership.msp_organization_id,
      ...validation.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Audit logs GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
