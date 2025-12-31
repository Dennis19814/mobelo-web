'use client';
import { logger } from '@/lib/logger'
import { httpClient } from '@/lib/http-client';

import { useState, useEffect, useCallback } from 'react';
import { UserList } from '@/components/merchant/UserList';
import { UserDetailModal } from '@/components/merchant/UserDetailModal';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isBlocked: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  blockedAt?: string;
  blockReason?: string;
  notes?: string;
}

interface UsersPageProps {
  params: {
    appId: string;
  };
}

export default function UsersPage({ params }: UsersPageProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [sortBy, setSortBy] = useState<'firstName' | 'email' | 'createdAt' | 'lastLoginAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await httpClient.get(`/v1/merchant/users?${searchParams}`);

      if (!response.ok) {
        throw new Error(response.data?.error || `HTTP ${response.status}`);
      }

      setUsers(response.data.data || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });
    } catch (err) {
      logger.error('Error fetching users:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, searchTerm, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleCloseUserDetail = () => {
    setShowUserDetail(false);
    setSelectedUser(null);
  };

  const handleUserUpdate = () => {
    fetchUsers(); // Refresh the list
    handleCloseUserDetail();
  };

  const handleBlockUser = async (userId: number, reason: string) => {
    try {
      const response = await httpClient.post(`/v1/merchant/users/${userId}/block`, { reason });

      if (!response.ok) {
        throw new Error(response.data?.error || `HTTP ${response.status}`);
      }

      fetchUsers(); // Refresh the list
    } catch (err) {
      logger.error('Error blocking user:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
      setError(err instanceof Error ? err.message : 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      const response = await httpClient.post(`/v1/merchant/users/${userId}/unblock`);

      if (!response.ok) {
        throw new Error(response.data?.error || `HTTP ${response.status}`);
      }

      fetchUsers(); // Refresh the list
    } catch (err) {
      logger.error('Error unblocking user:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
      setError(err instanceof Error ? err.message : 'Failed to unblock user');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage your app users, view details, and control access</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <UserList
        users={users}
        loading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        pagination={pagination}
        onPageChange={setPage}
        onUserClick={handleUserClick}
        onBlockUser={handleBlockUser}
        onUnblockUser={handleUnblockUser}
      />

      {showUserDetail && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={handleCloseUserDetail}
          onUserUpdate={handleUserUpdate}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
        />
      )}
    </div>
  );
}