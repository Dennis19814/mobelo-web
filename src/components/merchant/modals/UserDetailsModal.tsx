'use client';
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback } from 'react';
import {
  X, User, Mail, Phone, MapPin, CreditCard, ShoppingCart,
  Clock, Edit2, Save, XCircle as Cancel, CheckCircle, XCircle, AlertCircle,
  Calendar, DollarSign, Package, Shield, ShieldBan, ShieldCheck
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { UserDetailsResponse } from '@/types/user.types';

interface UserDetailsModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
  appSecretKey?: string;
  onRefresh: () => void;
}

export function UserDetailsModal({
  user,
  isOpen,
  onClose,
  apiKey,
  appSecretKey,
  onRefresh
}: UserDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('profile');
  const [userDetails, setUserDetails] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'payments', label: 'Payment Methods', icon: CreditCard },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'activity', label: 'Activity', icon: Clock },
  ];

  const fetchUserDetails = useCallback(async () => {
    if (!apiKey || !appSecretKey) {
      logger.error('Missing API keys for user details fetch');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/proxy/merchant/users/${user.id}`, {
        headers: {
          'x-api-key': apiKey,
          'x-app-secret': appSecretKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
      } else {
        logger.error('Failed to fetch user details');
      }
    } catch (error) {
      logger.error('Error fetching user details:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    } finally {
      setLoading(false);
    }
  }, [apiKey, appSecretKey, user.id]);

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails();
      setNotes(user.notes || '');
      setEditingNotes(false);
    }
  }, [isOpen, user, fetchUserDetails]);

  const saveNotes = async () => {
    if (!apiKey || !appSecretKey) {
      logger.error('Missing API keys for notes update');
      return;
    }

    try {
      setSavingNotes(true);
      const response = await fetch(`/api/proxy/merchant/users/${user.id}/notes`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-app-secret': appSecretKey
        },
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        setEditingNotes(false);
        onRefresh();
        if (userDetails) {
          setUserDetails({ ...userDetails, notes });
        }
      } else {
        logger.error('Failed to save notes');
      }
    } catch (error) {
      logger.error('Error saving notes:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    } finally {
      setSavingNotes(false);
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (user: any) => {
    if (user.isBlocked) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <ShieldBan className="w-3 h-3 mr-1" />
          Blocked
        </span>
      );
    }
    if (!user.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  const getVerificationBadge = (user: any) => {
    const phoneVerified = user.isPhoneVerified;
    const emailVerified = user.isEmailVerified;

    if (phoneVerified && emailVerified) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Fully Verified
        </span>
      );
    } else if (phoneVerified || emailVerified) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Partially Verified
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Not Verified
        </span>
      );
    }
  };

  const renderTabContent = () => {
    if (loading || !userDetails) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Name:</span>
                    <span className="text-gray-900 font-medium">
                      {userDetails.firstName && userDetails.lastName
                        ? `${userDetails.firstName} ${userDetails.lastName}`
                        : userDetails.firstName || userDetails.lastName || 'No name provided'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Email:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900">{userDetails.email || 'Not provided'}</span>
                      {userDetails.email && (
                        userDetails.isEmailVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Phone:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900">{userDetails.countryCode} {userDetails.phone}</span>
                      {userDetails.isPhoneVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(userDetails)}
                      {getVerificationBadge(userDetails)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Login Method:</span>
                    <span className="text-gray-900 capitalize">{userDetails.loginMethod || 'OTP'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Orders:</span>
                    <span className="text-gray-900 font-medium">{userDetails.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Spent:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(userDetails.totalSpent)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Addresses:</span>
                    <span className="text-gray-900 font-medium">{userDetails.addressCount || userDetails.addresses?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Payment Methods:</span>
                    <span className="text-gray-900 font-medium">{userDetails.paymentMethodCount || userDetails.paymentMethods?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Joined:</span>
                    <span className="text-gray-900">{formatDate(userDetails.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Last Login:</span>
                    <span className="text-gray-900">{formatDate(userDetails.lastLoginAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Merchant Notes</h3>
                {!editingNotes && (
                  <button
                    onClick={() => setEditingNotes(true)}
                    className="flex items-center px-3 py-1 text-sm text-orange-600 hover:text-blue-800 transition-colors"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                )}
              </div>

              {editingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this user..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    rows={4}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingNotes(false);
                        setNotes(userDetails?.notes || '');
                      }}
                      className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <Cancel className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                    <button
                      onClick={saveNotes}
                      disabled={savingNotes}
                      className="flex items-center px-3 py-1 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      {savingNotes ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600">
                  {userDetails?.notes || 'No notes added yet.'}
                </div>
              )}
            </div>

            {/* Blocking Information */}
            {userDetails.isBlocked && (
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <ShieldBan className="h-5 w-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-medium text-red-900">User is Blocked</h3>
                  </div>
                  <div className="space-y-2 text-sm text-red-800">
                    <div><strong>Reason:</strong> {userDetails.blockReason}</div>
                    <div><strong>Blocked on:</strong> {formatDate(userDetails.blockedAt)}</div>
                    {userDetails.blockedByUserId && (
                      <div><strong>Blocked by:</strong> User ID {userDetails.blockedByUserId}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'addresses':
        return (
          <div className="space-y-4">
            {userDetails.addresses && userDetails.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userDetails.addresses.map((address) => (
                  <div key={address.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {address.addressType}
                      </span>
                      {address.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="font-medium">{address.fullName}</div>
                      <div>{address.addressLine1}</div>
                      {address.addressLine2 && <div>{address.addressLine2}</div>}
                      <div>
                        {address.city}, {address.state} {address.postalCode}
                      </div>
                      <div>{address.country}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No addresses</h3>
                <p className="text-gray-600">This user hasn't added any addresses yet.</p>
              </div>
            )}
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-4">
            {userDetails.paymentMethods && userDetails.paymentMethods.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userDetails.paymentMethods.map((pm) => (
                  <div key={pm.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">
                        {pm.brand} •••• {pm.last4}
                      </span>
                      {pm.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Type: {pm.type}</div>
                      {pm.expiryMonth && pm.expiryYear && (
                        <div>Expires: {pm.expiryMonth.toString().padStart(2, '0')}/{pm.expiryYear}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No payment methods</h3>
                <p className="text-gray-600">This user hasn't added any payment methods yet.</p>
              </div>
            )}
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-4">
            {userDetails.recentOrders && userDetails.recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
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
                  <tbody className="divide-y divide-gray-200">
                    {userDetails.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="capitalize">{order.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(order.total)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No orders</h3>
                <p className="text-gray-600">This user hasn't placed any orders yet.</p>
              </div>
            )}
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-4">
            {userDetails.sessions && userDetails.sessions.length > 0 ? (
              <div className="space-y-3">
                {userDetails.sessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${session.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-sm font-medium text-gray-900">
                          {session.deviceType || 'Unknown Device'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {session.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {session.deviceModel && <div>Model: {session.deviceModel}</div>}
                      {session.osVersion && <div>OS: {session.osVersion}</div>}
                      {session.appVersion && <div>App: v{session.appVersion}</div>}
                      <div>Last active: {formatDate(session.lastActiveAt)}</div>
                      <div>Session started: {formatDate(session.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No activity</h3>
                <p className="text-gray-600">No session activity recorded for this user.</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="bg-white rounded-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              User Details: {user?.firstName} {user?.lastName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-6">
          {renderTabContent()}
        </div>
      </div>
    </Modal>
  );
}