'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface PermissionMatrixProps {
  permissions: Record<string, any>;
  onChange?: (permissions: Record<string, any>) => void;
  readOnly?: boolean;
}

/**
 * PermissionMatrix Component
 *
 * Displays a visual grid of permissions organized by module and feature.
 * Allows toggling individual permission actions when not in read-only mode.
 *
 * Permission Structure:
 * {
 *   "products": {
 *     "info": ["view", "edit", "create", "delete"],
 *     "pricing": ["view", "edit"]
 *   }
 * }
 */
export function PermissionMatrix({ permissions, onChange, readOnly = false }: PermissionMatrixProps) {
  const allActions = ['view', 'edit', 'create', 'delete', 'execute', 'upload'];

  const togglePermission = (module: string, feature: string, action: string) => {
    if (readOnly || !onChange) return;

    const newPermissions = { ...permissions };

    if (!newPermissions[module]) {
      newPermissions[module] = {};
    }

    if (!newPermissions[module][feature]) {
      newPermissions[module][feature] = [];
    }

    const featurePermissions = [...newPermissions[module][feature]];
    const index = featurePermissions.indexOf(action);

    if (index > -1) {
      // Remove permission
      featurePermissions.splice(index, 1);
    } else {
      // Add permission
      featurePermissions.push(action);
    }

    newPermissions[module][feature] = featurePermissions;
    onChange(newPermissions);
  };

  const hasPermission = (module: string, feature: string, action: string): boolean => {
    return permissions[module]?.[feature]?.includes(action) || false;
  };

  const modules = Object.keys(permissions).length > 0
    ? Object.keys(permissions)
    : ['products', 'orders', 'customers', 'settings', 'staff'];

  return (
    <div className="space-y-6">
      {modules.map((module) => {
        const modulePermissions = permissions[module] || {};
        const features = Object.keys(modulePermissions).length > 0
          ? Object.keys(modulePermissions)
          : getDefaultFeatures(module);

        return (
          <div key={module} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Module Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 capitalize">
                {module}
              </h3>
            </div>

            {/* Features Grid */}
            <div className="divide-y divide-gray-200">
              {features.map((feature) => (
                <div key={feature} className="grid grid-cols-[200px_1fr] divide-x divide-gray-200">
                  {/* Feature Name */}
                  <div className="bg-gray-50 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {feature}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-6 divide-x divide-gray-200">
                    {allActions.map((action) => {
                      const checked = hasPermission(module, feature, action);
                      const isClickable = !readOnly;

                      return (
                        <div
                          key={action}
                          className={`flex items-center justify-center px-4 py-3 ${
                            isClickable ? 'cursor-pointer hover:bg-gray-50' : ''
                          }`}
                          onClick={() => isClickable && togglePermission(module, feature, action)}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                checked
                                  ? 'bg-orange-600 border-orange-600'
                                  : 'border-gray-300'
                              }`}
                            >
                              {checked && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <span className="text-xs text-gray-600 capitalize">
                              {action}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Get default features for a module when permissions are empty
 */
function getDefaultFeatures(module: string): string[] {
  const defaults: Record<string, string[]> = {
    products: ['info', 'pricing', 'inventory', 'variants', 'media', 'seo', 'categories'],
    orders: ['list', 'details', 'status', 'payment', 'refund', 'cancel', 'shipping', 'notes'],
    customers: ['profile', 'contact', 'orders', 'addresses', 'payments', 'block', 'notes'],
    settings: ['general', 'payment', 'email', 'sms', 'taxes', 'shipping'],
    staff: ['view', 'invite', 'edit', 'remove'],
  };

  return defaults[module] || ['view', 'edit'];
}
