// Navigation items
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/dealers', label: 'Dealers', icon: 'Building2' },
  { path: '/attribution', label: 'Attribution', icon: 'Target' },
  { path: '/reports', label: 'Reports', icon: 'FileBarChart' },
]

// Dealer types
export const DEALER_TYPES = ['OEM', 'Independent', 'Aggregator']

// Vehicle segments
export const VEHICLE_SEGMENTS = [
  'Sedan',
  'SUV',
  'Truck',
  'Coupe',
  'Hatchback',
  'Van',
  'Wagon',
  'Convertible',
]

// Radius options for competitor analysis
export const RADIUS_OPTIONS = [15, 25, 35, 50]

// Date range options
export const DATE_RANGE_OPTIONS = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'ytd', label: 'Year to Date' },
]

// Confidence levels
export const CONFIDENCE_LEVELS = [
  { value: 'high', label: 'High (90%+)', min: 90 },
  { value: 'medium', label: 'Medium (70-89%)', min: 70 },
  { value: 'low', label: 'Low (<70%)', min: 0 },
]

// Chart colors
export const CHART_COLORS = [
  '#0066CC',
  '#FF6B35',
  '#4CAF50',
  '#FFC107',
  '#9C27B0',
  '#00BCD4',
  '#E91E63',
  '#607D8B',
]
