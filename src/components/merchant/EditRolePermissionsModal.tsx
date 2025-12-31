'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PermissionMatrix } from './PermissionMatrix';
import { apiService } from '@/lib/api-service';

interface EditRolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: {
    role: string;
    permissions: Record<string, any>;
  } | null;
  onSuccess?: () => void;
}

/**
 * EditRolePermissionsModal Component
 *
 * Modal for editing role permissions using the PermissionMatrix component.
 * Allows visual permission configuration with save/cancel actions.
 */
export function EditRolePermissionsModal({
  isOpen,
  onClose,
  role,
  onSuccess,
}: EditRolePermissionsModalProps) {
  const [permissions, setPermissions] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSystemRole = role && ['admin', 'manager', 'staff', 'viewer'].includes(role.role);

  useEffect(() => {
    if (role) {
      setPermissions(role.permissions || {});
    }
  }, [role]);

  const handleSave = async () => {
    if (!role) return;

    setSaving(true);
    setError(null);

    try {
      const response = await apiService.updateStaffRolePermissions(role.role, permissions);

      if (response.ok) {
        onSuccess?.();
        onClose();
      } else {
        setError(response.data?.message || 'Failed to update role permissions');
      }
    } catch (err) {
      console.error('Error updating role permissions:', err);
      setError('An error occurred while updating role permissions');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Role Permissions: {role.role}
              </h2>
              {isSystemRole && (
                <p className="mt-1 text-sm text-amber-600">
                  ⚠️ This is a system role. Changes will affect all staff members with this role.
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <PermissionMatrix
              permissions={permissions}
              onChange={setPermissions}
              readOnly={false}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
