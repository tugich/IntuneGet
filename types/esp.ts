/**
 * Enrollment Status Page (ESP) Profile Types
 * For managing ESP profiles during app deployment
 */

export interface EspProfileSummary {
  id: string;
  displayName: string;
  description?: string;
  selectedAppCount: number;
}

export interface EspProfileSelection {
  id: string;
  displayName: string;
}

export interface AddToEspResult {
  profileId: string;
  profileName: string;
  success: boolean;
  error?: string;
  alreadyAdded?: boolean;
}
