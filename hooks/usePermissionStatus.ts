'use client';

import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useMspOptional } from '@/hooks/useMspOptional';

export type PermissionErrorType =
  | 'consent_not_granted'
  | 'insufficient_intune_permissions'
  | 'network_error'
  | 'missing_credentials'
  | null;

export type PermissionStatusType = 'unauthenticated' | 'checking' | 'verified' | 'error';

interface ConsentVerificationResult {
  verified: boolean;
  tenantId: string;
  message: string;
  error?: PermissionErrorType;
}

export function usePermissionStatus() {
  const { isAuthenticated, getAccessToken, user } = useMicrosoftAuth();
  const { isMspUser, selectedTenantId } = useMspOptional();

  const fetchPermissionStatus = useCallback(async (): Promise<ConsentVerificationResult> => {
    const token = await getAccessToken();
    if (!token) {
      return { verified: false, tenantId: '', message: 'No token', error: 'network_error' };
    }

    const response = await fetch('/api/auth/verify-consent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(isMspUser && selectedTenantId ? { 'X-MSP-Tenant-Id': selectedTenantId } : {}),
      },
    });

    if (!response.ok && response.status >= 500) {
      return { verified: false, tenantId: '', message: 'Server error', error: 'network_error' };
    }

    return response.json();
  }, [getAccessToken, isMspUser, selectedTenantId]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['permission-status', user?.tenantId, isMspUser ? selectedTenantId || 'primary' : 'self'],
    queryFn: fetchPermissionStatus,
    enabled: isAuthenticated && !!user?.tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  const status: PermissionStatusType = useMemo(() => {
    if (!isAuthenticated) return 'unauthenticated';
    if (isLoading || isFetching) return 'checking';
    if (data?.verified) return 'verified';
    return 'error';
  }, [isAuthenticated, isLoading, isFetching, data?.verified]);

  return {
    status,
    error: data?.error || null,
    errorMessage: data?.message || null,
    isChecking: isLoading || isFetching,
    verify: refetch,
    canDeploy: status === 'verified',
  };
}
