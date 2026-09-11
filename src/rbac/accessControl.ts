export interface ScreenDefinition {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: string;
  superAdminKeyOnly?: boolean;
  superAdminOnly?: boolean;
}

export const SYSTEM_SCREENS: ScreenDefinition[] = [
  {
    id: 'entry',
    label: 'Production Entry Logbook',
    description: 'Shopfloor digital logbook entry, machine utilisation, and shift production records',
    path: '/entry',
    icon: 'entry',
  },
  {
    id: 'dashboard',
    label: 'Analytics Dashboard',
    description: 'High-level KPI gauges, plant throughput, and shift performance charts',
    path: '/dashboard',
    icon: 'approvals',
  },
  {
    id: 'approvals',
    label: 'Supervisor Shift Approvals',
    description: 'Review submitted operator logbooks, countersign, or request corrections',
    path: '/approvals',
    icon: 'approvals',
  },
  {
    id: 'reports',
    label: 'Operational DPR Reports',
    description: 'Historical production summaries, machine breakdown reports, and CSV exports',
    path: '/reports',
    icon: 'reports',
  },
  {
    id: 'master',
    label: 'Enterprise Master Data',
    description: 'Manage machines, departments, plants, shifts, models, and downtime reason codes',
    path: '/admin/master',
    icon: 'master',
    superAdminOnly: true,
  },
  {
    id: 'templates',
    label: 'Form Templates Engine',
    description: 'Dynamic logbook template builder, column configuration, and format ingestion',
    path: '/admin/templates',
    icon: 'templates',
    superAdminKeyOnly: true,
  },
  {
    id: 'users',
    label: 'User Management & Access Control',
    description: 'Personnel directory, plant assignments, and role-based screen permission matrix',
    path: '/admin/users',
    icon: 'users',
    superAdminKeyOnly: true,
  },
];

export interface RoleAccessConfig {
  roleId: string;
  roleName: string;
  description: string;
  defaultLandingRoute: string;
  allowedScreens: string[];
  canViewExecutiveAnalytics?: boolean;
}

export const DEFAULT_ROLE_ACCESS: Record<string, RoleAccessConfig> = {
  role_operator: {
    roleId: 'role_operator',
    roleName: 'Machine Operator',
    description: 'Shopfloor production personnel responsible for machine operation and daily entry',
    defaultLandingRoute: '/dashboard',
    // Operators access Dashboard and Production Entry
    allowedScreens: ['dashboard', 'entry'],
    canViewExecutiveAnalytics: false,
  },
  role_supervisor: {
    roleId: 'role_supervisor',
    roleName: 'Shift Supervisor',
    description: 'Line supervisors managing shift handovers, logbook verification, and sign-offs',
    defaultLandingRoute: '/dashboard',
    allowedScreens: ['dashboard', 'entry', 'approvals'],
    canViewExecutiveAnalytics: false,
  },
  role_qa: {
    roleId: 'role_qa',
    roleName: 'QA Inspector',
    description: 'Quality assurance engineers recording sample measurements and burr observations',
    defaultLandingRoute: '/dashboard',
    allowedScreens: ['dashboard', 'entry'],
    canViewExecutiveAnalytics: false,
  },
  role_manager: {
    roleId: 'role_manager',
    roleName: 'Plant Manager',
    description: 'Operations managers analyzing plant KPIs, downtime trends, and shift summaries',
    defaultLandingRoute: '/dashboard',
    allowedScreens: ['dashboard', 'approvals', 'reports'],
    canViewExecutiveAnalytics: true,
  },
  role_admin: {
    roleId: 'role_admin',
    roleName: 'Super System Administrator',
    description: 'Highest security privilege with exclusive key access to Form Templates & Access Control',
    defaultLandingRoute: '/dashboard',
    // Super Admin has access to all screens
    allowedScreens: ['dashboard', 'entry', 'approvals', 'reports', 'master', 'templates', 'users'],
    canViewExecutiveAnalytics: true,
  },
};

const STORAGE_KEY = 'pitti_access_control_policy_v1';

// Custom event to notify components when access policy changes in real time
const POLICY_CHANGED_EVENT = 'pitti_access_policy_changed';

export function getStoredPolicy(): Record<string, RoleAccessConfig> {
  if (typeof window === 'undefined') return DEFAULT_ROLE_ACCESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ROLE_ACCESS;
    const parsed = JSON.parse(raw);
    // Ensure Super Admin always retains key access to templates & users
    if (parsed.role_admin) {
      if (!parsed.role_admin.allowedScreens.includes('templates')) parsed.role_admin.allowedScreens.push('templates');
      if (!parsed.role_admin.allowedScreens.includes('users')) parsed.role_admin.allowedScreens.push('users');
    }
    // Ensure Operator always has access to dashboard and lands on /dashboard
    if (parsed.role_operator) {
      if (!parsed.role_operator.allowedScreens.includes('dashboard')) {
        parsed.role_operator.allowedScreens.unshift('dashboard');
      }
      parsed.role_operator.defaultLandingRoute = '/dashboard';
    }
    return { ...DEFAULT_ROLE_ACCESS, ...parsed };
  } catch {
    return DEFAULT_ROLE_ACCESS;
  }
}

export function savePolicy(newPolicy: Record<string, RoleAccessConfig>): void {
  if (typeof window === 'undefined') return;
  // Security guardrail: Super Admin always retains key access to Form Templates and Access Controls
  if (newPolicy.role_admin) {
    if (!newPolicy.role_admin.allowedScreens.includes('templates')) {
      newPolicy.role_admin.allowedScreens.push('templates');
    }
    if (!newPolicy.role_admin.allowedScreens.includes('users')) {
      newPolicy.role_admin.allowedScreens.push('users');
    }
  }

  // Non-super-admins cannot have templates or users access
  for (const roleKey of Object.keys(newPolicy)) {
    if (roleKey !== 'role_admin') {
      newPolicy[roleKey].allowedScreens = newPolicy[roleKey].allowedScreens.filter(
        (s) => s !== 'templates' && s !== 'users' && s !== 'master'
      );
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newPolicy));
  window.dispatchEvent(new CustomEvent(POLICY_CHANGED_EVENT, { detail: newPolicy }));
}

export function resetToDefaultPolicy(): Record<string, RoleAccessConfig> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(POLICY_CHANGED_EVENT, { detail: DEFAULT_ROLE_ACCESS }));
  }
  return DEFAULT_ROLE_ACCESS;
}

export function hasScreenAccess(role: string, screenId: string): boolean {
  if (role === 'role_admin') return true;
  // Templates, Users, and Master data are Super Admin exclusive
  if (screenId === 'templates' || screenId === 'users' || screenId === 'master') {
    return role === 'role_admin';
  }
  const policy = getStoredPolicy();
  const roleConfig = policy[role] || DEFAULT_ROLE_ACCESS[role];
  if (!roleConfig) return false;
  return roleConfig.allowedScreens.includes(screenId);
}

/**
 * Checks if a role is authorized to view company-wide/plant-wide executive analytics
 * (e.g. throughput charts, OEE gauges, downtime breakdown).
 * By default: Only Admins, Super Admins, and Plant Managers/Managers can view.
 * Configurable dynamically by Super Admin via the Access Control panel.
 */
export function canViewExecutiveAnalytics(role: string): boolean {
  if (role === 'role_admin') return true;
  const policy = getStoredPolicy();
  const roleConfig = policy[role] || DEFAULT_ROLE_ACCESS[role];
  if (roleConfig && typeof roleConfig.canViewExecutiveAnalytics === 'boolean') {
    return roleConfig.canViewExecutiveAnalytics;
  }
  return role === 'role_manager' || role === 'role_admin';
}

export function getDefaultLandingRoute(role: string): string {
  const policy = getStoredPolicy();
  const roleConfig = policy[role] || DEFAULT_ROLE_ACCESS[role];
  if (roleConfig?.defaultLandingRoute) {
    // If the default landing route is allowed, use it
    const matchingScreen = SYSTEM_SCREENS.find((s) => s.path === roleConfig.defaultLandingRoute);
    if (!matchingScreen || hasScreenAccess(role, matchingScreen.id)) {
      return roleConfig.defaultLandingRoute;
    }
  }
  // Fallback to dashboard if allowed, or entry
  if (hasScreenAccess(role, 'dashboard')) return '/dashboard';
  if (hasScreenAccess(role, 'entry')) return '/entry';
  return '/dashboard';
}

export function subscribeToPolicyChange(callback: (policy: Record<string, RoleAccessConfig>) => void): () => void {
  if (typeof window === 'undefined') return () => { };
  const handler = (e: Event) => {
    const custom = e as CustomEvent<Record<string, RoleAccessConfig>>;
    callback(custom.detail || getStoredPolicy());
  };
  window.addEventListener(POLICY_CHANGED_EVENT, handler);
  return () => window.removeEventListener(POLICY_CHANGED_EVENT, handler);
}
