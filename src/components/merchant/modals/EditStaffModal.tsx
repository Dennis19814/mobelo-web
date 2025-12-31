'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface StaffMember {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  notes?: string;
}

interface EditStaffModalProps {
  staff: StaffMember;
  onClose: () => void;
  onSuccess: () => void;
}

interface StaffRole {
  role: string;
  permissions: any;
}

export default function EditStaffModal({ staff, onClose, onSuccess }: EditStaffModalProps) {
  const [formData, setFormData] = useState({
    firstName: staff.firstName,
    lastName: staff.lastName,
    role: staff.role,
    notes: staff.notes || '',
  });

  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingRoles, setLoadingRoles] = useState(true);

  /**
   * Load available roles
   */
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await apiService.getStaffRoles();
        if (response.ok) {
          setRoles(response.data);
        }
      } catch (err) {
        console.error('Failed to load roles:', err);
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoles();
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.updateStaffMember(staff.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        notes: formData.notes || undefined,
      });

      if (response.ok) {
        onSuccess();
      } else {
        setError(response.data?.message || 'Failed to update staff member');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update staff member');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get role description
   */
  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Full access to all features including team management';
      case 'manager':
        return 'Access to most features with limited sensitive data';
      case 'staff':
        return 'Basic access to products, orders, and customers';
      case 'viewer':
        return 'Read-only access to view data without editing';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Staff Member</h2>
            <p className="text-sm text-gray-600 mt-1">
              {staff.email || staff.phone}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact Information (Read-Only) */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Contact information cannot be changed
              </p>
              {staff.email && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Email: </span>
                  <span className="text-sm text-gray-900">{staff.email}</span>
                </div>
              )}
              {staff.phone && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Phone: </span>
                  <span className="text-sm text-gray-900">{staff.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Role & Permissions</h3>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              {loadingRoles ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {roles.map((roleOption) => (
                    <option key={roleOption.role} value={roleOption.role}>
                      {roleOption.role.charAt(0).toUpperCase() + roleOption.role.slice(1)}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-sm text-gray-600 mt-1">
                {getRoleDescription(formData.role)}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes about this staff member..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Display */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Current Status</p>
                <p className="text-xs text-gray-500 mt-1">Use action buttons in the table to change status</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                staff.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
