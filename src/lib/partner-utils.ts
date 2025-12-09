// Partner and Task utility constants and functions

// Task type options
export const TASK_TYPES = {
  NEW_PRODUCT_CONFIG: 'New Product Config',
  CONFIG_UPDATE: 'Config Update',
  INFRASTRUCTURE: 'Infrastructure',
  OTHER: 'Other',
} as const;

export type TaskTypeKey = keyof typeof TASK_TYPES;

// Task type badge colors
export const TASK_TYPE_COLORS: Record<TaskTypeKey, { bg: string; text: string }> = {
  NEW_PRODUCT_CONFIG: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-400' },
  CONFIG_UPDATE: { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-800 dark:text-sky-400' },
  INFRASTRUCTURE: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-800 dark:text-violet-400' },
  OTHER: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
};

// Platform options
export const PLATFORMS = {
  WHMCS: 'WHMCS',
  BROKER_PANEL: 'Broker Panel',
  PARTNER_PORTAL: 'Partner Portal',
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

// Partner type options
export const PARTNER_TYPES = {
  BROKER: 'Broker',
  AFFILIATE: 'Affiliate',
  EA: 'EA',
  OTHER: 'Other',
} as const;

export type PartnerTypeKey = keyof typeof PARTNER_TYPES;

// Config type options
export const CONFIG_TYPES = {
  LOCKED_DOWN: 'Locked-down',
  STANDARD: 'Standard',
  CUSTOM: 'Custom',
} as const;

export type ConfigTypeKey = keyof typeof CONFIG_TYPES;

// Partner status options
export const PARTNER_STATUSES = {
  PRE_SALES: 'Pre-sales',
  IN_PROGRESS: 'In-Progress',
  LIVE: 'LIVE',
  INACTIVE: 'Inactive',
} as const;

export type PartnerStatusKey = keyof typeof PARTNER_STATUSES;

// Status badge colors (semantic)
export const STATUS_COLORS: Record<PartnerStatusKey, { bg: string; text: string }> = {
  PRE_SALES: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-400' },
  IN_PROGRESS: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400' },
  LIVE: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400' },
  INACTIVE: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
};

// Platform badge colors
export const PLATFORM_COLORS: Record<PlatformKey, { bg: string; text: string }> = {
  WHMCS: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-400' },
  BROKER_PANEL: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400' },
  PARTNER_PORTAL: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-400' },
};

// Partner type badge colors
export const PARTNER_TYPE_COLORS: Record<PartnerTypeKey, { bg: string; text: string }> = {
  BROKER: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-400' },
  AFFILIATE: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-400' },
  EA: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-400' },
  OTHER: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' },
};

/**
 * Generate a 32-character alphanumeric upload key
 * Uses crypto.getRandomValues for cryptographically secure randomness
 */
export function generateUploadKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Get display label for a platform key
 */
export function getPlatformLabel(key: string | null | undefined): string {
  if (!key) return '—';
  return PLATFORMS[key as PlatformKey] || key;
}

/**
 * Get display label for a partner type key
 */
export function getPartnerTypeLabel(key: string | null | undefined): string {
  if (!key) return '—';
  return PARTNER_TYPES[key as PartnerTypeKey] || key;
}

/**
 * Get display label for a config type key
 */
export function getConfigLabel(key: string | null | undefined): string {
  if (!key) return '—';
  return CONFIG_TYPES[key as ConfigTypeKey] || key;
}

/**
 * Get display label for a partner status key
 */
export function getStatusLabel(key: string | null | undefined): string {
  if (!key) return '—';
  return PARTNER_STATUSES[key as PartnerStatusKey] || key;
}

/**
 * Get badge colors for a status
 */
export function getStatusColors(key: string | null | undefined): { bg: string; text: string } {
  if (!key || !(key in STATUS_COLORS)) {
    return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' };
  }
  return STATUS_COLORS[key as PartnerStatusKey];
}

/**
 * Get badge colors for a platform
 */
export function getPlatformColors(key: string | null | undefined): { bg: string; text: string } {
  if (!key || !(key in PLATFORM_COLORS)) {
    return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' };
  }
  return PLATFORM_COLORS[key as PlatformKey];
}

/**
 * Get badge colors for a partner type
 */
export function getPartnerTypeColors(key: string | null | undefined): { bg: string; text: string } {
  if (!key || !(key in PARTNER_TYPE_COLORS)) {
    return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' };
  }
  return PARTNER_TYPE_COLORS[key as PartnerTypeKey];
}

/**
 * Get display label for a task type key
 */
export function getTaskTypeLabel(key: string | null | undefined): string {
  if (!key) return '—';
  return TASK_TYPES[key as TaskTypeKey] || key;
}

/**
 * Get badge colors for a task type
 */
export function getTaskTypeColors(key: string | null | undefined): { bg: string; text: string } {
  if (!key || !(key in TASK_TYPE_COLORS)) {
    return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400' };
  }
  return TASK_TYPE_COLORS[key as TaskTypeKey];
}

// Order for sorting statuses (LIVE first, then In-Progress, etc.)
export const STATUS_ORDER: PartnerStatusKey[] = ['LIVE', 'IN_PROGRESS', 'PRE_SALES', 'INACTIVE'];

/**
 * Sort partners by status in preferred order (LIVE first)
 */
export function sortByStatus<T extends { partnerStatus: string }>(partners: T[]): T[] {
  return [...partners].sort((a, b) => {
    const aIndex = STATUS_ORDER.indexOf(a.partnerStatus as PartnerStatusKey);
    const bIndex = STATUS_ORDER.indexOf(b.partnerStatus as PartnerStatusKey);
    // If status not found, put at end
    const aOrder = aIndex === -1 ? STATUS_ORDER.length : aIndex;
    const bOrder = bIndex === -1 ? STATUS_ORDER.length : bIndex;
    return aOrder - bOrder;
  });
}

/**
 * Group partners by status
 */
export function groupByStatus<T extends { partnerStatus: string }>(
  partners: T[]
): Map<PartnerStatusKey, T[]> {
  const groups = new Map<PartnerStatusKey, T[]>();

  // Initialize groups in order
  for (const status of STATUS_ORDER) {
    groups.set(status, []);
  }

  // Populate groups
  for (const partner of partners) {
    const status = partner.partnerStatus as PartnerStatusKey;
    const group = groups.get(status);
    if (group) {
      group.push(partner);
    } else {
      // Handle unknown status
      const otherGroup = groups.get('INACTIVE') || [];
      otherGroup.push(partner);
      groups.set('INACTIVE', otherGroup);
    }
  }

  return groups;
}
