/**
 * Graph API Token Acquisition
 * Shared utility for obtaining access tokens via client credentials flow.
 * Used by consent verification and store app deployment.
 */

export interface GraphTokenResult {
  accessToken: string;
  expiresIn: number;
}

/**
 * Acquire a Graph API access token for the given tenant using client credentials.
 * Requires AZURE_AD_CLIENT_ID and AZURE_CLIENT_SECRET environment variables.
 */
export async function acquireGraphToken(tenantId: string): Promise<GraphTokenResult> {
  const clientId = process.env.AZURE_AD_CLIENT_ID || process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.AZURE_AD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Azure AD credentials not configured (AZURE_AD_CLIENT_ID / AZURE_CLIENT_SECRET)');
  }

  const response = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }).toString(),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Token acquisition failed (${response.status}): ${errorBody}`);
  }

  const tokenData = await response.json();

  return {
    accessToken: tokenData.access_token,
    expiresIn: tokenData.expires_in,
  };
}
