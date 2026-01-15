/**
 * Application Constants
 */

// ============================================
// ORDER STATUS
// ============================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  IN_PRODUCTION: 'in_production',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.SCHEDULED]: 'Scheduled',
  [ORDER_STATUS.IN_PRODUCTION]: 'In Production',
  [ORDER_STATUS.COMPLETED]: 'Completed',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'bg-yellow-500/20 text-yellow-400',
  [ORDER_STATUS.SCHEDULED]: 'bg-blue-500/20 text-blue-400',
  [ORDER_STATUS.IN_PRODUCTION]: 'bg-accent/20 text-accent',
  [ORDER_STATUS.COMPLETED]: 'bg-green-500/20 text-green-400',
  [ORDER_STATUS.CANCELLED]: 'bg-red-500/20 text-red-400',
};

// ============================================
// ORDER INTERVALS (for predicted orders)
// ============================================

export const ORDER_INTERVALS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
};

export const ORDER_INTERVAL_LABELS = {
  [ORDER_INTERVALS.DAILY]: 'Daily',
  [ORDER_INTERVALS.WEEKLY]: 'Weekly',
  [ORDER_INTERVALS.BIWEEKLY]: 'Bi-weekly',
  [ORDER_INTERVALS.MONTHLY]: 'Monthly',
  [ORDER_INTERVALS.QUARTERLY]: 'Quarterly',
  [ORDER_INTERVALS.YEARLY]: 'Yearly',
};

export const ORDER_INTERVAL_DAYS = {
  [ORDER_INTERVALS.DAILY]: 1,
  [ORDER_INTERVALS.WEEKLY]: 7,
  [ORDER_INTERVALS.BIWEEKLY]: 14,
  [ORDER_INTERVALS.MONTHLY]: 30,
  [ORDER_INTERVALS.QUARTERLY]: 90,
  [ORDER_INTERVALS.YEARLY]: 365,
};

// ============================================
// MACHINE STATUS
// ============================================

export const MACHINE_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  OFFLINE: 'offline',
};

export const MACHINE_STATUS_LABELS = {
  [MACHINE_STATUS.AVAILABLE]: 'Available',
  [MACHINE_STATUS.IN_USE]: 'In Use',
  [MACHINE_STATUS.MAINTENANCE]: 'Maintenance',
  [MACHINE_STATUS.OFFLINE]: 'Offline',
};

export const MACHINE_STATUS_COLORS = {
  [MACHINE_STATUS.AVAILABLE]: 'bg-green-500/20 text-green-400',
  [MACHINE_STATUS.IN_USE]: 'bg-blue-500/20 text-blue-400',
  [MACHINE_STATUS.MAINTENANCE]: 'bg-yellow-500/20 text-yellow-400',
  [MACHINE_STATUS.OFFLINE]: 'bg-red-500/20 text-red-400',
};

// ============================================
// PREDICTION CONFIDENCE
// ============================================

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.75,   // >= 75% confidence (reliable)
  MEDIUM: 0.5,  // >= 50% confidence
  LOW: 0,       // < 50% confidence (unreliable)
};

export const CONFIDENCE_COLORS = {
  HIGH: 'bg-green-500/20 text-green-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  LOW: 'bg-red-500/20 text-red-400',
};

export function getConfidenceLevel(score) {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

export function getConfidenceColor(score) {
  return CONFIDENCE_COLORS[getConfidenceLevel(score)];
}

export function isReliablePrediction(score) {
  return score >= CONFIDENCE_THRESHOLDS.HIGH;
}

// ============================================
// TIME CONSTANTS
// ============================================

export const WORK_HOURS = {
  START: 6,     // 06:00
  END: 22,      // 22:00
  PER_DAY: 16,  // 16 hours per work day
};

export const DEFAULT_SETUP_TIME_MINUTES = 45;

// ============================================
// UI CONSTANTS
// ============================================

export const DATE_RANGE_PRESETS = [
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
];

export const PRIORITY_OPTIONS = [
  { value: 1, label: '1 - Highest' },
  { value: 2, label: '2 - High' },
  { value: 3, label: '3 - Medium-High' },
  { value: 4, label: '4 - Medium' },
  { value: 5, label: '5 - Normal' },
  { value: 6, label: '6 - Low-Medium' },
  { value: 7, label: '7 - Low' },
  { value: 8, label: '8 - Lower' },
  { value: 9, label: '9 - Lowest' },
  { value: 10, label: '10 - Background' },
];

// ============================================
// NAVIGATION
// ============================================

export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: 'ClipboardList',
  },
  {
    label: 'Schedule',
    href: '/schedule',
    icon: 'Calendar',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
];

// ============================================
// API ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  CUSTOMERS: '/api/customers',
  MATERIALS: '/api/materials',
  MACHINES: '/api/machines',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  PREDICTED_ORDERS: '/api/predicted-orders',
  FORECASTS: '/api/forecasts',
  PRODUCTION_BLOCKS: '/api/production-blocks',
  SETTINGS: '/api/settings',
  HEALTH: '/api/health',
};

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  NETWORK: 'Network error. Please check your connection.',
};
