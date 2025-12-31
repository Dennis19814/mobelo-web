'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StaffUser {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  permissions: FeaturePermissions;
}

interface StaffApp {
  id: number;
  app_name: string;
}

interface FeaturePermissions {
  products?: {
    info?: string[];
    pricing?: string[];
    inventory?: string[];
    variants?: string[];
    media?: string[];
    seo?: string[];
    categories?: string[];
  };
  orders?: {
    list?: string[];
    details?: string[];
    status?: string[];
    payment?: string[];
    refund?: string[];
    cancel?: string[];
    shipping?: string[];
    notes?: string[];
  };
  customers?: {
    profile?: string[];
    contact?: string[];
    orders?: string[];
    addresses?: string[];
    payments?: string[];
    block?: string[];
    notes?: string[];
  };
  settings?: {
    general?: string[];
    payment?: string[];
    email?: string[];
    sms?: string[];
    taxes?: string[];
    shipping?: string[];
  };
  staff?: string[];
}

interface StaffUserContextType {
  staffUser: StaffUser | null;
  staffApp: StaffApp | null;
  isStaffAuthenticated: boolean;
  hasPermission: (module: string, action: string, feature?: string) => boolean;
  logout: () => void;
  refreshStaffUser: () => void;
}

const StaffUserContext = createContext<StaffUserContextType | undefined>(undefined);

interface StaffUserProviderProps {
  children: ReactNode;
}

export function StaffUserProvider({ children }: StaffUserProviderProps) {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(null);
  const [staffApp, setStaffApp] = useState<StaffApp | null>(null);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState(false);

  /**
   * Load staff user from localStorage on mount
   */
  useEffect(() => {
    refreshStaffUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Refresh staff user data from localStorage
   */
  const refreshStaffUser = () => {
    // If owner session is present, do not consider staff session active
    const ownerAccessToken = localStorage.getItem('access_token');
    if (ownerAccessToken) {
      setIsStaffAuthenticated(false);
      setStaffUser(null);
      setStaffApp(null);
      return;
    }

    const staffAccessToken = localStorage.getItem('staff_access_token');
    const staffUserData = localStorage.getItem('staff_user');
    const staffAppData = localStorage.getItem('staff_app');

    if (staffAccessToken && staffUserData && staffAppData) {
      try {
        setStaffUser(JSON.parse(staffUserData));
        setStaffApp(JSON.parse(staffAppData));
        setIsStaffAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse staff user data:', error);
        logout();
      }
    } else {
      setIsStaffAuthenticated(false);
      setStaffUser(null);
      setStaffApp(null);
    }
  };

  /**
   * Check if staff user has specific permission
   * @param module - Module name (e.g., 'products', 'orders', 'customers')
   * @param action - Action name (e.g., 'view', 'edit', 'create', 'delete')
   * @param feature - Optional feature name within module (e.g., 'pricing', 'inventory')
   */
  const hasPermission = (module: string, action: string, feature?: string): boolean => {
    // Platform owners (non-staff users) have full access to merchant features
    if (!isStaffAuthenticated) {
      return true;
    }

    if (!staffUser || !staffUser.permissions) {
      return false;
    }

    const modulePerms = staffUser.permissions[module as keyof FeaturePermissions];

    if (!modulePerms) {
      return false;
    }

    // For staff module (no nested features)
    if (module === 'staff' && Array.isArray(modulePerms)) {
      return modulePerms.includes(action);
    }

    // For modules with nested features
    if (feature && typeof modulePerms === 'object' && !Array.isArray(modulePerms)) {
      const featurePerms = (modulePerms as Record<string, any>)[feature];
      return Array.isArray(featurePerms) && featurePerms.includes(action);
    }

    // Check if any feature has the action (for general module-level checks)
    if (typeof modulePerms === 'object') {
      return Object.values(modulePerms).some(
        (perms) => Array.isArray(perms) && perms.includes(action)
      );
    }

    return false;
  };

  /**
   * Logout staff user
   */
  const logout = () => {
    localStorage.removeItem('staff_access_token');
    localStorage.removeItem('staff_refresh_token');
    localStorage.removeItem('staff_user');
    localStorage.removeItem('staff_app');
    setStaffUser(null);
    setStaffApp(null);
    setIsStaffAuthenticated(false);
  };

  const value: StaffUserContextType = {
    staffUser,
    staffApp,
    isStaffAuthenticated,
    hasPermission,
    logout,
    refreshStaffUser,
  };

  return (
    <StaffUserContext.Provider value={value}>
      {children}
    </StaffUserContext.Provider>
  );
}

/**
 * Hook to use staff user context
 */
export function useStaffUser() {
  const context = useContext(StaffUserContext);
  if (context === undefined) {
    throw new Error('useStaffUser must be used within a StaffUserProvider');
  }
  return context;
}

/**
 * Hook to check staff permissions
 * Convenience hook that returns common permission checks
 */
export function useStaffPermissions() {
  const { hasPermission, staffUser } = useStaffUser();

  return {
    // Staff role
    role: staffUser?.role || 'viewer',
    isAdmin: staffUser?.role === 'admin',
    isManager: staffUser?.role === 'manager',

    // Products
    canViewProducts: hasPermission('products', 'view'),
    canEditProducts: hasPermission('products', 'edit', 'info'),
    canCreateProducts: hasPermission('products', 'create', 'info'),
    canDeleteProducts: hasPermission('products', 'delete', 'info'),
    canEditPricing: hasPermission('products', 'edit', 'pricing'),
    canViewPricing: hasPermission('products', 'view', 'pricing'),
    canEditInventory: hasPermission('products', 'edit', 'inventory'),
    canViewInventory: hasPermission('products', 'view', 'inventory'),

    // Orders
    canViewOrders: hasPermission('orders', 'view', 'list'),
    canViewOrderDetails: hasPermission('orders', 'view', 'details'),
    canEditOrderStatus: hasPermission('orders', 'edit', 'status'),
    canRefundOrders: hasPermission('orders', 'execute', 'refund'),
    canCancelOrders: hasPermission('orders', 'execute', 'cancel'),

    // Customers
    canViewCustomers: hasPermission('customers', 'view', 'profile'),
    canEditCustomers: hasPermission('customers', 'edit', 'profile'),
    canViewCustomerContact: hasPermission('customers', 'view', 'contact'),
    canEditCustomerContact: hasPermission('customers', 'edit', 'contact'),
    canViewCustomerPayments: hasPermission('customers', 'view', 'payments'),
    canBlockCustomers: hasPermission('customers', 'execute', 'block'),

    // Settings
    canViewSettings: hasPermission('settings', 'view'),
    canEditSettings: hasPermission('settings', 'edit'),
    canEditPaymentSettings: hasPermission('settings', 'edit', 'payment'),
    canEditEmailSettings: hasPermission('settings', 'edit', 'email'),

    // Staff Management
    canViewStaff: hasPermission('staff', 'view'),
    canInviteStaff: hasPermission('staff', 'invite'),
    canEditStaff: hasPermission('staff', 'edit'),
    canRemoveStaff: hasPermission('staff', 'remove'),

    // Generic permission checker
    hasPermission,
  };
}
