'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useMicrosoftAuth } from './useMicrosoftAuth';
import { useMspOptional } from './useMspOptional';
import type { EspProfileSummary, AddToEspResult } from '@/types/esp';

interface EspProfilesResponse {
  profiles: EspProfileSummary[];
  count: number;
}

interface AddToEspResponse {
  results: AddToEspResult[];
}

interface AddToEspRequest {
  intuneAppId: string;
  espProfileIds: string[];
  espProfileNames?: Record<string, string>;
}

export function useEspProfiles() {
  const { getAccessToken, isAuthenticated } = useMicrosoftAuth();
  const { isMspUser, selectedTenantId } = useMspOptional();
  const tenantKey = isMspUser ? selectedTenantId || 'primary' : 'self';

  return useQuery<EspProfilesResponse>({
    queryKey: ['intune', 'esp-profiles', tenantKey],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/intune/esp-profiles', {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(isMspUser && selectedTenantId
            ? { 'X-MSP-Tenant-Id': selectedTenantId }
            : {}),
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to fetch ESP profiles');
      }

      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });
}

export function useAddToEsp() {
  const { getAccessToken } = useMicrosoftAuth();
  const { isMspUser, selectedTenantId } = useMspOptional();

  return useMutation<AddToEspResponse, Error, AddToEspRequest>({
    mutationFn: async (request: AddToEspRequest) => {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/intune/esp-profiles/add-app', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(isMspUser && selectedTenantId
            ? { 'X-MSP-Tenant-Id': selectedTenantId }
            : {}),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to add app to ESP profiles');
      }

      return response.json();
    },
  });
}
