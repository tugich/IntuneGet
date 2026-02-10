const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  browser: 'Browsers',
  development: 'Development',
  'developer-tools': 'Developer Tools',
  productivity: 'Productivity',
  utilities: 'Utilities',
  communication: 'Communication',
  media: 'Media',
  graphics: 'Graphics',
  gaming: 'Gaming',
  security: 'Security',
  runtime: 'Runtime',
  system: 'System',
  'cloud-storage': 'Cloud Storage',
  virtualization: 'Virtualization',
  collaboration: 'Collaboration',
  office: 'Office',
  education: 'Education',
  business: 'Business',
  finance: 'Finance',
  design: 'Design',
  photo: 'Photo',
  video: 'Video',
  audio: 'Audio',
  backup: 'Backup',
  networking: 'Networking',
  database: 'Database',
  monitoring: 'Monitoring',
  automation: 'Automation',
  devops: 'DevOps',
  'package-management': 'Package Management',
  ide: 'IDE',
  utilitiesandtools: 'Utilities & Tools',
  other: 'Other',
};

const WORD_OVERRIDES: Record<string, string> = {
  ai: 'AI',
  ml: 'ML',
  ide: 'IDE',
  api: 'API',
  cli: 'CLI',
  vpn: 'VPN',
  sql: 'SQL',
  devops: 'DevOps',
  ui: 'UI',
  ux: 'UX',
  iot: 'IoT',
  os: 'OS',
};

function toTitleCaseWord(word: string): string {
  const lower = word.toLowerCase();
  if (!lower) {
    return lower;
  }

  if (WORD_OVERRIDES[lower]) {
    return WORD_OVERRIDES[lower];
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function getCategoryLabel(category: string | null | undefined): string {
  if (!category) {
    return '';
  }

  const normalized = category.trim().toLowerCase();
  const direct = CATEGORY_LABELS[normalized];
  if (direct) {
    return direct;
  }

  return normalized
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(toTitleCaseWord)
    .join(' ');
}
