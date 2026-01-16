'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, ShieldCheck } from 'lucide-react';
import { EditRolePermissionsModal } from '../EditRolePermissionsModal';
import { apiService } from '@/lib/api-service';

interface Role {
  role: string;
  permissions: Record<string, any>;
}

/**
 * RolesSection Component
 *
 * Displays all staff roles with their permission configurations.
 * Allows editing role permissions through the EditRolePermissionsModal.
 *
 * Features:
 * - List all available roles (system + custom)
 * - Visual permission summary
 * - Edit role permissions (opens modal with PermissionMatrix)
 * - Distinguishes system roles from custom roles
 */
export function RolesSection() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getStaffRoles();

      if (response.ok) {
        setRoles(response.data);
      } else {
        setError('Failed to load roles');
      }
    } catch (err) {
      console.error('Error loading roles:', err);
      setError('An error occurred while loading roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRole(null);
  };

  const handleEditSuccess = () => {
    loadRoles(); // Reload roles after successful update
  };

  const countPermissions = (permissions: Record<string, any>): number => {
    let count = 0;
    Object.values(permissions).forEach((module: any) => {
      if (typeof module === 'object') {
        Object.values(module).forEach((feature: any) => {
          if (Array.isArray(feature)) {
            count += feature.length;
          }
        });
      }
    });
    return count;
  };

  const getPermissionSummary = (permissions: Record<string, any>): string => {
    const modules = Object.keys(permissions);
    const permissionCount = countPermissions(permissions);
    return `${modules.length} modules, ${permissionCount} permissions`;
  };

  const isSystemRole = (roleName: string): boolean => {
    return ['admin', 'manager', 'staff', 'viewer'].includes(roleName);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={loadRoles}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Team Roles & Permissions</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure role-based permissions for your team members
        </p>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <div
            key={role.role}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            {/* Role Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <ShieldCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 capitalize">
                    {role.role}
                  </h3>
                  {isSystemRole(role.role) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      System Role
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleEditRole(role)}
                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                title="Edit permissions"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </div>

            {/* Permission Summary */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {getPermissionSummary(role.permissions)}
              </p>

              {/* Module Pills */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(role.permissions).map((module) => (
                  <span
                    key={module}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 capitalize"
                  >
                    {module}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {roles.length === 0 && (
        <div className="text-center py-12">
          <ShieldCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No roles configured yet</p>
        </div>
      )}

      {/* Edit Modal */}
      <EditRolePermissionsModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        role={editingRole}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

export default RolesSection;
