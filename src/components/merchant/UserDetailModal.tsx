'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback } from 'react';

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

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onUserUpdate: () => void;
  onBlockUser: (userId: number, reason: string) => void;
  onUnblockUser: (userId: number) => void;
}

export function UserDetailModal({
  user,
  onClose,
  onUserUpdate,
  onBlockUser,
  onUnblockUser
}: UserDetailModalProps) {
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(user.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userApiKey = localStorage.getItem('userApiKey') || '';
      const appSecretKey = localStorage.getItem('appSecretKey') || '';

      const response = await fetch(`/api/proxy/merchant/users/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': userApiKey,
          'x-app-secret': appSecretKey
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setUserDetails(data);
      setNotes(data.notes || '');
    } catch (err) {
      logger.error('Error fetching user details:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      setError(null);

      const userApiKey = localStorage.getItem('userApiKey') || '';
      const appSecretKey = localStorage.getItem('appSecretKey') || '';

      const response = await fetch(`/api/proxy/merchant/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': userApiKey,
          'x-app-secret': appSecretKey
        },
        body: JSON.stringify({ notes })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      onUserUpdate();
    } catch (err) {
      logger.error('Error saving notes:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined });
      setError(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleBlockUser = () => {
    if (blockReason.trim()) {
      onBlockUser(user.id, blockReason.trim());
      setShowBlockModal(false);
      setBlockReason('');
      onClose();
    }
  };

  const handleUnblockUser = () => {
    onUnblockUser(user.id);
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (user: User) => {
    if (user.isBlocked) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          Blocked
        </span>
      );
    }
    if (user.isActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
        Inactive
      </span>
    );
  };

  const displayUser = userDetails || user;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-0 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {displayUser.firstName} {displayUser.lastName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{displayUser.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(displayUser)}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading user details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{displayUser.email}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      <p className="text-sm text-gray-900">{displayUser.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Account Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-500">Member since</label>
                      <p className="text-sm text-gray-900">{formatDate(displayUser.createdAt)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Last login</label>
                      <p className="text-sm text-gray-900">{formatDate(displayUser.lastLoginAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blocking Information */}
              {displayUser.isBlocked && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-900 mb-2">Blocking Information</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-red-600">Blocked on</label>
                      <p className="text-sm text-red-800">{formatDate(displayUser.blockedAt)}</p>
                    </div>
                    {displayUser.blockReason && (
                      <div>
                        <label className="text-xs text-red-600">Reason</label>
                        <p className="text-sm text-red-800">{displayUser.blockReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Internal Notes</h4>
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes about this user..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes || notes === (displayUser.notes || '')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">User Actions</h4>
                <div className="flex gap-3">
                  {displayUser.isBlocked ? (
                    <button
                      onClick={handleUnblockUser}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Unblock User
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowBlockModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Block User
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-60">
          <div className="relative top-1/2 transform -translate-y-1/2 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Block User: {displayUser.firstName} {displayUser.lastName}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for blocking:
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Enter reason for blocking this user..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleBlockUser}
                  disabled={!blockReason.trim()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Block User
                </button>
                <button
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockReason('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}