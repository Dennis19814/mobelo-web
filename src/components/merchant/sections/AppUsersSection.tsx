'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { useMerchantAuth, useCrudOperations } from '@/hooks';
import {
  Search,
  Loader2,
  Users,
  Filter,
  Eye,
  ShieldBan,
  ShieldCheck,
  ShieldOff,
  ChevronDown,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Package,
  MapPin,
  CreditCard,
  User,
  Home
} from 'lucide-react';
import {
  MobileUserSummary,
  UsersResponse,
  UserFilterStatus,
  UserSortBy,
  UserSortOrder,
  UserDetailsResponse,
  BlockUserRequest,
  UnblockUserRequest
} from '@/types/user.types';

interface AppUsersSectionProps {
  appId: number;
  apiKey: string;
  appSecretKey: string;
}

interface FilterState {
  status: UserFilterStatus;
  isVerified?: boolean;
}

const AppUsersSectionComponent = ({ appId, apiKey, appSecretKey }: AppUsersSectionProps) => {
  const { headers } = useMerchantAuth(apiKey, appSecretKey);
  const {
    loading: crudLoading,
    error: crudError,
    successMessage,
    executeOperation,
    setSuccessMessage,
    setError: setCrudError
  } = useCrudOperations();

  const [users, setUsers] = useState<MobileUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetailsResponse | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [blockingUserId, setBlockingUserId] = useState<number | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [unblockNote, setUnblockNote] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<UserSortBy | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<UserSortOrder | undefined>(undefined);
  const [filters, setFilters] = useState<FilterState>({
    status: UserFilterStatus.ALL,
  });
  const [showBlockForm, setShowBlockForm] = useState<number | null>(null);
  const [showUnblockForm, setShowUnblockForm] = useState<number | null>(null);
  const [blockFormReason, setBlockFormReason] = useState('');
  const [unblockFormNote, setUnblockFormNote] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'payment' | 'addresses'>('basic');
  const [showModalBlockForm, setShowModalBlockForm] = useState(false);
  const [modalBlockReason, setModalBlockReason] = useState('');
  const [showModalUnblockForm, setShowModalUnblockForm] = useState(false);
  const [modalUnblockNote, setModalUnblockNote] = useState('');

  const limit = 20;

  const fetchUsers = useCallback(async () => {
    // Support owner (dual-key) or staff JWT
    const staffToken = typeof window !== 'undefined' ? localStorage.getItem('staff_access_token') : null
    if (!headers && !staffToken) return

    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
        ...(searchQuery && { search: searchQuery }),
      });

      // Add status filter
      if (filters.status !== UserFilterStatus.ALL) {
        queryParams.append('status', filters.status);
      }

      // Map isVerified to verification parameter
      if (filters.isVerified !== undefined) {
        queryParams.append('verification', filters.isVerified ? 'verified' : 'unverified');
      }

      const authHeaders: Record<string, string> = headers || (staffToken ? { authorization: `Bearer ${staffToken}` } : {})
      const response = await fetch(`/api/proxy/v1/merchant/users?${queryParams}`, {
        headers: authHeaders,
      });

      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.data);
        setTotalCount(data.pagination.total);
      } else {
        if (response.status === 403) {
          setError('You do not have permissions to access this feature');
        } else {
          logger.error('Failed to fetch users');
          try {
            const errData = await response.json();
            setError(errData?.message || 'Failed to fetch users');
          } catch {
            setError('Failed to fetch users');
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if ((error as any)?.status === 403) {
        setError('You do not have permissions to access this feature')
      } else {
        logger.error('Error fetching users:', { error: msg, stack: error instanceof Error ? error.stack : undefined });
        setError(msg)
      }
    } finally {
      setLoading(false);
    }
  }, [headers, page, searchQuery, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUserDetails = useCallback(async (userId: number) => {
    const staffToken = typeof window !== 'undefined' ? localStorage.getItem('staff_access_token') : null
    if (!headers && !staffToken) return;

    try {
      const authHeaders: Record<string, string> = headers || (staffToken ? { authorization: `Bearer ${staffToken}` } : {})
      const response = await fetch(`/api/proxy/v1/merchant/users/${userId}`, {
        headers: authHeaders,
      });

      if (response.ok) {
        const data: UserDetailsResponse = await response.json();
        setSelectedUser(data);
        setIsUserDetailsOpen(true);
      } else {
        if (response.status === 403) {
          setError('You do not have permissions to access this feature');
        } else {
          logger.error('Failed to fetch user details');
        }
      }
    } catch (error) {
      if ((error as any)?.status === 403) {
        setError('You do not have permissions to access this feature');
      } else {
        logger.error('Error fetching user details:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      }
    }
  }, [headers]);

  const handleBlockUser = useCallback(async (userId: number, reason: string) => {
    const staffToken = typeof window !== 'undefined' ? localStorage.getItem('staff_access_token') : null
    const hasAuth = headers || staffToken
    if (!hasAuth) return;
    setBlockingUserId(userId);
    try {
      const blockData: BlockUserRequest = { reason };
      const authHeaders: Record<string, string> = headers || (staffToken ? { authorization: `Bearer ${staffToken}` } : {})
      const response = await fetch(`/api/proxy/v1/merchant/users/${userId}/block`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blockData),
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
        setBlockReason('');
        if (selectedUser?.id === userId) {
          await fetchUserDetails(userId); // Refresh details if viewing this user
        }
      } else {
        if (response.status === 403) {
          setError('You do not have permissions to access this feature');
        } else {
          const error = await response.json();
          alert(error.message || 'Failed to block user');
        }
      }
    } catch (error) {
      if ((error as any)?.status === 403) {
        setError('You do not have permissions to access this feature');
      } else {
        logger.error('Error blocking user:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        alert('Failed to block user');
      }
    } finally {
      setBlockingUserId(null);
    }
  }, [headers, fetchUsers, fetchUserDetails, selectedUser]);

  const handleUnblockUser = useCallback(async (userId: number, note?: string) => {
    const staffToken = typeof window !== 'undefined' ? localStorage.getItem('staff_access_token') : null
    const hasAuth = headers || staffToken
    if (!hasAuth) return;
    setBlockingUserId(userId);
    try {
      const unblockData: UnblockUserRequest = note ? { note } : {};
      const authHeaders: Record<string, string> = headers || (staffToken ? { authorization: `Bearer ${staffToken}` } : {})
      const response = await fetch(`/api/proxy/v1/merchant/users/${userId}/unblock`, {
        method: 'PATCH',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unblockData),
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
        setUnblockNote('');
        if (selectedUser?.id === userId) {
          await fetchUserDetails(userId); // Refresh details if viewing this user
        }
      } else {
        if (response.status === 403) {
          setError('You do not have permissions to access this feature');
        } else {
          const error = await response.json();
          alert(error.message || 'Failed to unblock user');
        }
      }
    } catch (error) {
      if ((error as any)?.status === 403) {
        setError('You do not have permissions to access this feature');
      } else {
        logger.error('Error unblocking user:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        alert('Failed to unblock user');
      }
    } finally {
      setBlockingUserId(null);
    }
  }, [headers, fetchUsers, fetchUserDetails, selectedUser]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (user: MobileUserSummary) => {
    if (user.isBlocked) {
      return (
        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-800">
          Blocked
        </span>
      );
    }
    if (!user.isActive) {
      return (
        <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-800">
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-800">
        Active
      </span>
    );
  };

  const getVerificationBadge = (user: MobileUserSummary) => {
    const isVerified = user.isPhoneVerified || user.isEmailVerified;
    return isVerified ? (
      <div title="Verified">
        <CheckCircle className="h-3 w-3 text-green-500" />
      </div>
    ) : (
      <div title="Not verified">
        <XCircle className="h-3 w-3 text-red-500" />
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">App Users</h2>
          <p className="text-gray-600">
            Manage and monitor your mobile app users
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {totalCount} users
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange({ status: e.target.value as UserFilterStatus })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value={UserFilterStatus.ALL}>All Users</option>
                        <option value={UserFilterStatus.ACTIVE}>Active</option>
                        <option value={UserFilterStatus.BLOCKED}>Blocked</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification
                      </label>
                      <select
                        value={filters.isVerified === undefined ? 'all' : filters.isVerified.toString()}
                        onChange={(e) => {
                          const value = e.target.value === 'all' ? undefined : e.target.value === 'true';
                          handleFilterChange({ isVerified: value });
                        }}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      >
                        <option value="all">All Users</option>
                        <option value="true">Verified</option>
                        <option value="false">Not Verified</option>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setFilters({ status: UserFilterStatus.ALL });
                          setIsFilterOpen(false);
                        }}
                        className="w-full text-sm text-gray-600 hover:text-gray-800"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setSortBy(value ? value as UserSortBy : undefined);
                  // If sorting is selected and no order is set, default to DESC
                  if (value && !sortOrder) {
                    setSortOrder(UserSortOrder.DESC);
                  }
                  // If sorting is removed, also remove order
                  if (!value) {
                    setSortOrder(undefined);
                  }
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">No sorting</option>
                <option value={UserSortBy.CREATED_AT}>Created Date</option>
                <option value={UserSortBy.NAME}>Name</option>
                <option value={UserSortBy.EMAIL}>Email</option>
                <option value={UserSortBy.LAST_LOGIN}>Last Login</option>
                <option value={UserSortBy.TOTAL_ORDERS}>Total Orders</option>
                <option value={UserSortBy.TOTAL_SPENT}>Total Spent</option>
              </select>
              {sortBy && (
                <select
                  value={sortOrder || UserSortOrder.DESC}
                  onChange={(e) => setSortOrder(e.target.value as UserSortOrder)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value={UserSortOrder.DESC}>Descending</option>
                  <option value={UserSortOrder.ASC}>Ascending</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No users found
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search or filters' : 'No users have registered for your app yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                          <Users className="h-4 w-4 text-gray-400" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.firstName || user.lastName || 'No name'
                            }
                          </div>
                          <div className="text-[10px] text-gray-500">
                            ID: {user.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-0.5">
                        {user.email && (
                          <div className="flex items-center text-xs text-gray-900">
                            <Mail className="h-3 w-3 mr-1 text-gray-400" />
                            {user.email}
                          </div>
                        )}
                        <div className="flex items-center text-xs text-gray-900">
                          <Phone className="h-3 w-3 mr-1 text-gray-400" />
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          {getStatusBadge(user)}
                          {getVerificationBadge(user)}
                        </div>
                        {user.isBlocked && user.blockReason && (
                          <div className="text-[10px] text-red-600">
                            {user.blockReason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          Joined {formatDate(user.createdAt)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Last login: {formatDate(user.lastLoginAt)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-900">
                        <div className="flex items-center">
                          <Package className="h-3 w-3 mr-1 text-gray-400" />
                          {user.totalOrders} orders
                        </div>
                        <div className="flex items-center text-[10px] text-gray-500 mt-0.5">
                          <DollarSign className="h-2.5 w-2.5 mr-0.5" />
                          {formatCurrency(user.totalSpent)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {showBlockForm === user.id || showUnblockForm === user.id ? (
                        <div className="flex items-center justify-end gap-1">
                          {showBlockForm === user.id ? (
                            <>
                              <input
                                type="text"
                                placeholder="Reason"
                                value={blockFormReason}
                                onChange={(e) => setBlockFormReason(e.target.value)}
                                className="w-24 px-1.5 py-0.5 text-[10px] border border-gray-300 rounded"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  if (blockFormReason.trim()) {
                                    handleBlockUser(user.id, blockFormReason);
                                    setShowBlockForm(null);
                                    setBlockFormReason('');
                                  }
                                }}
                                className="text-[10px] px-1.5 py-0.5 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Block
                              </button>
                              <button
                                onClick={() => {
                                  setShowBlockForm(null);
                                  setBlockFormReason('');
                                }}
                                className="text-[10px] px-1.5 py-0.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <input
                                type="text"
                                placeholder="Note (optional)"
                                value={unblockFormNote}
                                onChange={(e) => setUnblockFormNote(e.target.value)}
                                className="w-24 px-1.5 py-0.5 text-[10px] border border-gray-300 rounded"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  handleUnblockUser(user.id, unblockFormNote || undefined);
                                  setShowUnblockForm(null);
                                  setUnblockFormNote('');
                                }}
                                className="text-[10px] px-1.5 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Unblock
                              </button>
                              <button
                                onClick={() => {
                                  setShowUnblockForm(null);
                                  setUnblockFormNote('');
                                }}
                                className="text-[10px] px-1.5 py-0.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex justify-end space-x-1">
                          <button
                            onClick={() => fetchUserDetails(user.id)}
                            className="text-gray-600 hover:text-orange-600 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {user.isBlocked ? (
                            <button
                              onClick={() => {
                                setShowUnblockForm(user.id);
                                setUnblockFormNote('');
                              }}
                              disabled={blockingUserId === user.id}
                              className="text-gray-600 hover:text-green-600 transition-colors disabled:opacity-50"
                              title="Unblock user"
                            >
                              {blockingUserId === user.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShieldCheck className="h-3.5 w-3.5" />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setShowBlockForm(user.id);
                                setBlockFormReason('');
                              }}
                              disabled={blockingUserId === user.id}
                              className="text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Block user"
                            >
                              {blockingUserId === user.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShieldBan className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal with Tabs */}
      {isUserDetailsOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col my-8">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedUser.email || selectedUser.phone}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsUserDetailsOpen(false);
                    setActiveTab('basic'); // Reset tab on close
                    setShowModalBlockForm(false); // Reset block form
                    setModalBlockReason('');
                    setShowModalUnblockForm(false); // Reset unblock form
                    setModalUnblockNote('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'basic'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="h-4 w-4" />
                  Basic Information
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'payment'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Payment Methods
                  {selectedUser.paymentMethodCount > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'payment' ? 'bg-blue-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedUser.paymentMethodCount || 0}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'addresses'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  Delivery Addresses
                  {selectedUser.addressCount > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === 'addresses' ? 'bg-blue-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {selectedUser.addressCount || 0}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Basic Information Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        Personal Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Full Name</span>
                          <span className="text-sm font-medium text-gray-900">
                            {selectedUser.firstName} {selectedUser.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Email</span>
                          <span className="text-sm font-medium text-gray-900">
                            {selectedUser.email || 'Not provided'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Phone</span>
                          <span className="text-sm font-medium text-gray-900">{selectedUser.phone}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Country Code</span>
                          <span className="text-sm font-medium text-gray-900">{selectedUser.countryCode}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-500">Status</span>
                          <div>{getStatusBadge(selectedUser)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Account Statistics */}
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                        Account Statistics
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Total Orders</span>
                          <span className="text-sm font-medium text-gray-900">{selectedUser.totalOrders}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Total Spent</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(selectedUser.totalSpent)}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Saved Addresses</span>
                          <span className="text-sm font-medium text-gray-900">{selectedUser.addressCount}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-500">Payment Methods</span>
                          <span className="text-sm font-medium text-gray-900">
                            {selectedUser.paymentMethodCount}
                          </span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-sm text-gray-500">Member Since</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(selectedUser.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  {selectedUser.recentOrders && selectedUser.recentOrders.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-5">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                        <Package className="h-4 w-4 mr-2 text-gray-400" />
                        Recent Orders
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-y border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedUser.recentOrders.map((order) => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{order.orderNumber}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    order.status === 'completed'
                                      ? 'bg-green-100 text-green-800'
                                      : order.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(order.total)}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* User Actions */}
                  <div className="bg-white border border-gray-200 rounded-lg p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">User Actions</h3>

                    {showModalBlockForm ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for blocking this user
                          </label>
                          <textarea
                            value={modalBlockReason}
                            onChange={(e) => setModalBlockReason(e.target.value)}
                            placeholder="Enter the reason for blocking..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px]"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              if (modalBlockReason.trim()) {
                                handleBlockUser(selectedUser.id, modalBlockReason);
                                setShowModalBlockForm(false);
                                setModalBlockReason('');
                              }
                            }}
                            disabled={!modalBlockReason.trim() || blockingUserId === selectedUser.id}
                            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {blockingUserId === selectedUser.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ShieldOff className="h-4 w-4 mr-2" />
                            )}
                            Confirm Block
                          </button>
                          <button
                            onClick={() => {
                              setShowModalBlockForm(false);
                              setModalBlockReason('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : showModalUnblockForm ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Optional note for unblocking (optional)
                          </label>
                          <textarea
                            value={modalUnblockNote}
                            onChange={(e) => setModalUnblockNote(e.target.value)}
                            placeholder="Enter an optional note..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[100px]"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              handleUnblockUser(selectedUser.id, modalUnblockNote || undefined);
                              setShowModalUnblockForm(false);
                              setModalUnblockNote('');
                            }}
                            disabled={blockingUserId === selectedUser.id}
                            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {blockingUserId === selectedUser.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-4 w-4 mr-2" />
                            )}
                            Confirm Unblock
                          </button>
                          <button
                            onClick={() => {
                              setShowModalUnblockForm(false);
                              setModalUnblockNote('');
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        {selectedUser.isBlocked ? (
                          <button
                            onClick={() => setShowModalUnblockForm(true)}
                            disabled={blockingUserId === selectedUser.id}
                            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Unblock User
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowModalBlockForm(true)}
                            disabled={blockingUserId === selectedUser.id}
                            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {blockingUserId === selectedUser.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ShieldOff className="h-4 w-4 mr-2" />
                            )}
                            Block User
                          </button>
                        )}
                      </div>
                    )}

                    {selectedUser.isBlocked && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm text-red-800">
                          <div className="font-medium">User is currently blocked</div>
                          <div className="mt-1">Reason: {selectedUser.blockReason}</div>
                          <div className="mt-1">Blocked on: {formatDate(selectedUser.blockedAt)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Methods Tab */}
              {activeTab === 'payment' && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Saved payment methods for this user
                    </p>
                  </div>

                  {selectedUser.paymentMethods && selectedUser.paymentMethods.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.paymentMethods.map((pm) => (
                        <div key={pm.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <CreditCard className="h-8 w-8 text-gray-400 mr-3" />
                              <div>
                                <div className="text-base font-medium text-gray-900">
                                  {pm.brand} •••• {pm.last4}
                                </div>
                                <div className="text-sm text-gray-500 capitalize">{pm.type}</div>
                              </div>
                            </div>
                            {pm.isDefault && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                          </div>
                          {pm.expiryMonth && pm.expiryYear && (
                            <div className="text-sm text-gray-500 mt-2">
                              Expires: {String(pm.expiryMonth).padStart(2, '0')}/{pm.expiryYear}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No payment methods saved</p>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Addresses Tab */}
              {activeTab === 'addresses' && (
                <div className="space-y-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Delivery Addresses</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Saved delivery addresses for this user
                    </p>
                  </div>

                  {selectedUser.addresses && selectedUser.addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.addresses.map((address) => (
                        <div key={address.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <Home className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-base font-medium text-gray-900 capitalize">
                                {address.addressType || 'Address'}
                              </span>
                            </div>
                            {address.isDefault && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="font-medium text-gray-900">{address.fullName}</div>

                            {address.houseNumber && address.streetName && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1.5 text-gray-400" />
                                {address.houseNumber} {address.streetName}
                              </div>
                            )}

                            <div>{address.addressLine1}</div>
                            {address.addressLine2 && <div>{address.addressLine2}</div>}

                            {address.landmark && (
                              <div className="text-xs text-gray-500 italic">
                                Near: {address.landmark}
                              </div>
                            )}

                            <div className="flex items-center">
                              <span>{address.city}</span>
                              {address.state && <span>, {address.state}</span>}
                              <span className="ml-1">{address.postalCode}</span>
                            </div>

                            <div className="text-gray-700">{address.country}</div>

                            {address.deliveryNotes && (
                              <div className="pt-2 mt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-500">Delivery Notes:</span>
                                <div className="text-xs text-gray-600 mt-1">{address.deliveryNotes}</div>
                              </div>
                            )}

                            {address.usageCount && address.usageCount > 0 && (
                              <div className="text-xs text-gray-400 pt-2">
                                Used {address.usageCount} time{address.usageCount > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No delivery addresses saved</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AppUsersSectionComponent);
