'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Plus, Edit2, Trash2, Ban, CheckCircle, Search, Filter } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import InviteStaffModal from '../modals/InviteStaffModal';
import EditStaffModal from '../modals/EditStaffModal';
import { Pagination } from '../common';

interface StaffMember {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

interface TeamSectionProps {
  appId: number;
}

export default function TeamSection({ appId }: TeamSectionProps) {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timeoutId, setTimeoutId] = useState<any>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  // Check if user is owner (has full access) or staff (needs permissions)
  // Memoized to prevent infinite re-renders
  const hasAccessToTeam = useMemo(() => {
    try {
      if (typeof window === 'undefined') return true; // SSR safety

      // Check if user is owner (has owner access token)
      const ownerToken = localStorage.getItem('access_token');
      if (ownerToken) {
        // Owners have full access to team management
        return true;
      }

      // Check if user is staff with permission
      const staffToken = localStorage.getItem('staff_access_token');
      if (!staffToken) return false;

      const parts = staffToken.split('.');
      if (parts.length < 2) return false;
      const json = JSON.parse(atob(parts[1]));
      const perms = json?.permissions || {};
      const modulePerms = perms['staff'];
      if (!modulePerms) return false;
      if (Array.isArray(modulePerms)) {
        return modulePerms.includes('view');
      }
      return false;
    } catch (_) {
      return false;
    }
  }, []); // Empty dependency array - only compute once on mount

  /**
   * Load staff members
   */
  const loadStaffMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiService.getStaffMembers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        page,
        limit,
      });

      if (response.ok) {
        // Handle paginated response
        if (response.data.data) {
          setStaffMembers(response.data.data);
          setTotal(response.data.total || response.data.meta?.total || 0);
        } else if (Array.isArray(response.data)) {
          // Handle array response (non-paginated)
          setStaffMembers(response.data);
          setTotal(response.data.length);
        } else {
          setStaffMembers([]);
          setTotal(0);
        }
      } else {
        setError(response.status === 403
          ? 'You do not have permissions to access this feature'
          : (response.data?.message || 'Failed to load staff members'));
      }
    } catch (err: any) {
      const msg = err?.message?.toLowerCase?.() || ''
      const code = err?.code
      // Ignore expected cancellation from single-flight requests
      if (code === 'REQUEST_CANCELLED' || msg.includes('cancelled') || msg.includes('canceled')) {
        return
      }
      setError(err?.status === 403
        ? 'You do not have permissions to access this feature'
        : (err.message || 'Failed to load staff members'));
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, searchTerm, page, limit]);

  useEffect(() => {
    // Permission pre-check: Check if user is owner or has staff permissions
    if (!hasAccessToTeam) {
      setError('You do not have permissions to access this feature');
      setLoading(false);
      return;
    }

    loadStaffMembers();
    // Rely on httpClient timeout to avoid double-cancellation and false negatives
  }, [hasAccessToTeam, loadStaffMembers]);

  /**
   * Handle search
   */
  const handleSearch = () => {
    setPage(1); // Reset to first page on search
    loadStaffMembers();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  };

  /**
   * Handle suspend staff member
   */
  const handleSuspend = async (id: number) => {
    if (!confirm('Are you sure you want to suspend this staff member?')) return;

    try {
      const response = await apiService.suspendStaffMember(id);
      if (response.ok) {
        setSuccessMessage('Staff member suspended successfully');
        loadStaffMembers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.data?.message || 'Failed to suspend staff member');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to suspend staff member');
    }
  };

  /**
   * Handle reactivate staff member
   */
  const handleReactivate = async (id: number) => {
    try {
      const response = await apiService.reactivateStaffMember(id);
      if (response.ok) {
        setSuccessMessage('Staff member reactivated successfully');
        loadStaffMembers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.data?.message || 'Failed to reactivate staff member');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate staff member');
    }
  };

  /**
   * Handle remove staff member
   */
  const handleRemove = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff member? This action cannot be undone.')) return;

    try {
      const response = await apiService.removeStaffMember(id);
      if (response.ok) {
        setSuccessMessage('Staff member removed successfully');
        loadStaffMembers();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.data?.message || 'Failed to remove staff member');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove staff member');
    }
  };

  /**
   * Handle edit staff member
   */
  const handleEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setShowEditModal(true);
  };

  /**
   * Get role badge color
   */
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  /**
   * Get status badge
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>;
      case 'suspended':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Ban className="w-3 h-3 mr-1" />
          Suspended
        </span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>;
    }
  };

  return (
    <div className="overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Team Management
          </h2>
          <p className="text-gray-600 mt-1">Manage staff members and their permissions</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Staff</span>
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="pt-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition duration-200"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>
  </div>
      {/* Staff Table */}
            <div className="pt-6">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : staffMembers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No staff members found</p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
            >
              Invite your first staff member
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffMembers.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {staff.firstName} {staff.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {staff.email || staff.phone || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(staff.role)}`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(staff.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(staff)}
                        className="text-orange-600 hover:text-slate-900"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {staff.status === 'active' ? (
                        <button
                          onClick={() => handleSuspend(staff.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Suspend"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(staff.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Reactivate"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(staff.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {staffMembers.length > 0 && (
        <div className="mt-4">
          <Pagination
            totalItems={total}
            currentPage={page}
            totalPages={totalPages}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleLimitChange}
            itemLabel="team members"
            selectId="team-per-page-select"
          />
        </div>
      )}
</div>
      {/* Modals */}
      {showInviteModal && (
        <InviteStaffModal
          appId={appId}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadStaffMembers();
            setSuccessMessage('Staff member invited successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
        />
      )}

      {showEditModal && selectedStaff && (
        <EditStaffModal
          staff={selectedStaff}
          onClose={() => {
            setShowEditModal(false);
            setSelectedStaff(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedStaff(null);
            loadStaffMembers();
            setSuccessMessage('Staff member updated successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
        />
      )}
    </div>
  );
}
