/**
 * GitHub Issue Creation for App Suggestions
 * Creates issues in the public IntuneGet repo when users submit app suggestions.
 */

import { sanitizeText } from '@/lib/validators/community';

interface CreateIssueResult {
  issueNumber: number;
  issueUrl: string;
}

interface GitHubIssueConfig {
  token: string;
  owner: string;
  repo: string;
}

function getGitHubIssueConfig(): GitHubIssueConfig {
  const token = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_ISSUES_REPO || 'IntuneGet';

  if (!token) {
    throw new Error('GITHUB_PAT environment variable is not set');
  }
  if (!owner) {
    throw new Error('GITHUB_OWNER environment variable is not set');
  }

  return { token, owner, repo };
}

/**
 * Create a GitHub issue for an app suggestion.
 * Uses the public IntuneGet repo (GITHUB_ISSUES_REPO env var).
 */
export async function createAppSuggestionIssue(
  wingetId: string,
  reason: string | null | undefined,
  suggestionId: string
): Promise<CreateIssueResult> {
  const config = getGitHubIssueConfig();

  const sanitizedReason = reason ? sanitizeText(reason) : null;

  const bodyLines = [
    `## App Request`,
    ``,
    `**WinGet ID:** \`${wingetId}\``,
  ];

  if (sanitizedReason) {
    bodyLines.push(``, `**Reason:** ${sanitizedReason}`);
  }

  bodyLines.push(
    ``,
    `---`,
    `*This issue was automatically created from a community app suggestion.*`,
    `*Suggestion ID: \`${suggestionId}\`*`
  );

  const body = bodyLines.join('\n');

  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        title: `App Request: ${wingetId}`,
        body,
        labels: ['app-request'],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create GitHub issue: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();

  return {
    issueNumber: data.number,
    issueUrl: data.html_url,
  };
}
