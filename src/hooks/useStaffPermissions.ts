import { useMemo } from 'react';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'execute';

export type PermissionModule =
  | 'products'
  | 'orders'
  | 'customers'
  | 'categories'
  | 'inventory'
  | 'analytics'
  | 'settings'
  | 'staff';

export type PermissionFeature =
  | 'info'
  | 'pricing'
  | 'inventory'
  | 'variants'
  | 'media'
  | 'categories'
  | 'list'
  | 'details'
  | 'status'
  | 'fulfillment'
  | 'refunds'
  | 'cancellation'
  | 'contact'
  | 'orders'
  | 'block'
  | 'management'
  | 'permissions';

export interface StaffPermissions {
  [module: string]: {
    [feature: string]: PermissionAction[];
  };
}

export interface StaffUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  permissions: StaffPermissions;
  appId: number;
}

export interface UseStaffPermissionsReturn {
  permissions: StaffPermissions | null;
  role: string | null;
  hasPermission: (module: PermissionModule, action: PermissionAction, feature: PermissionFeature) => boolean;
  hasAnyPermission: (checks: Array<{ module: PermissionModule; action: PermissionAction; feature: PermissionFeature }>) => boolean;
  hasAllPermissions: (checks: Array<{ module: PermissionModule; action: PermissionAction; feature: PermissionFeature }>) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  isViewer: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageCustomers: boolean;
  canViewAnalytics: boolean;
}

export function useStaffPermissions(): UseStaffPermissionsReturn {
  // Get staff user from localStorage
  const staffUser = useMemo(() => {
    if (typeof window === 'undefined') return null;

    try {
      const staffAccessToken = localStorage.getItem('staff_access_token');
      if (!staffAccessToken) return null;

      // Decode JWT to get staff user info
      const payload = JSON.parse(atob(staffAccessToken.split('.')[1]));

      if (payload.type !== 'staff') return null;

      return {
        id: payload.staffId,
        email: payload.email || '',
        firstName: payload.firstName || '',
        lastName: payload.lastName || '',
        role: payload.role,
        permissions: payload.permissions || {},
        appId: payload.appId,
      } as StaffUser;
    } catch (error) {
      console.error('Failed to parse staff token:', error);
      return null;
    }
  }, []);

  const hasPermission = useMemo(
    () => (module: PermissionModule, action: PermissionAction, feature: PermissionFeature): boolean => {
      if (!staffUser?.permissions) return false;

      const modulePermissions = staffUser.permissions[module];
      if (!modulePermissions) return false;

      const featurePermissions = modulePermissions[feature];
      if (!featurePermissions) return false;

      return featurePermissions.includes(action);
    },
    [staffUser]
  );

  const hasAnyPermission = useMemo(
    () => (checks: Array<{ module: PermissionModule; action: PermissionAction; feature: PermissionFeature }>): boolean => {
      return checks.some((check) => hasPermission(check.module, check.action, check.feature));
    },
    [hasPermission]
  );

  const hasAllPermissions = useMemo(
    () => (checks: Array<{ module: PermissionModule; action: PermissionAction; feature: PermissionFeature }>): boolean => {
      return checks.every((check) => hasPermission(check.module, check.action, check.feature));
    },
    [hasPermission]
  );

  // Role-based helpers
  const isAdmin = staffUser?.role === 'admin';
  const isManager = staffUser?.role === 'manager';
  const isStaff = staffUser?.role === 'staff';
  const isViewer = staffUser?.role === 'viewer';

  // Common permission checks
  const canManageProducts = useMemo(
    () => hasPermission('products', 'edit', 'info') || hasPermission('products', 'create', 'info'),
    [hasPermission]
  );

  const canManageOrders = useMemo(
    () => hasPermission('orders', 'edit', 'status') || hasPermission('orders', 'edit', 'fulfillment'),
    [hasPermission]
  );

  const canManageCustomers = useMemo(
    () => hasPermission('customers', 'edit', 'contact') || hasPermission('customers', 'execute', 'block'),
    [hasPermission]
  );

  const canViewAnalytics = useMemo(
    () => hasPermission('analytics', 'view', 'list'),
    [hasPermission]
  );

  return {
    permissions: staffUser?.permissions || null,
    role: staffUser?.role || null,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManager,
    isStaff,
    isViewer,
    canManageProducts,
    canManageOrders,
    canManageCustomers,
    canViewAnalytics,
  };
}
