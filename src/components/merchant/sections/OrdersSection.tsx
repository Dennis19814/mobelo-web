'use client';

import { useState, useCallback, useMemo, useEffect, memo, lazy, Suspense } from 'react';
import { useMerchantAuth, useCrudOperations, useOrders } from '@/hooks';
import { useStaffPermissions } from '@/contexts/StaffUserContext';
import {
  ShoppingCart, Package, CheckCircle, Clock, X, Search, Filter,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, Eye, XCircle, Truck,
  CreditCard, PackageCheck, ChevronDown, X as ClearIcon
} from 'lucide-react';
import { Order, OrderFilters, OrderStatus, PaymentStatus, FulfillmentStatus } from '@/types/order.types';

// Lazy load modals
const OrderDetailModal = lazy(() => import('@/components/merchant/modals/OrderDetailModal'));
const CancelOrderModal = lazy(() => import('@/components/merchant/modals/CancelOrderModal'));
const UpdateDeliveryStatusModal = lazy(() => import('@/components/merchant/modals/UpdateDeliveryStatusModal'));

interface OrdersSectionProps {
  appId: number;
  apiKey?: string;
  appSecretKey?: string;
}

const OrdersSectionComponent = ({ appId, apiKey, appSecretKey }: OrdersSectionProps) => {
  const { headers } = useMerchantAuth(apiKey, appSecretKey);
  const { setError, setSuccessMessage } = useCrudOperations();

  // Staff permissions (returns default true if not staff user)
  const { canViewOrderDetails, canCancelOrders } = useStaffPermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize filters with last 7 days
  const today = new Date();
  const last7Days = new Date(today);
  last7Days.setDate(today.getDate() - 7);

  const [filters, setFilters] = useState<OrderFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    dateFrom: last7Days.toISOString().split('T')[0],
    dateTo: today.toISOString().split('T')[0],
  });

  // Modal states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);

  // Use orders hook
  const {
    orders,
    isLoading,
    error,
    stats,
    totalOrders,
    currentPage,
    totalPages,
    fetchOrders,
    refetch,
  } = useOrders();

  // Handle search
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setFilters((prev) => ({
        ...prev,
        search: query,
        page: 1,
      }));
    },
    []
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (key: keyof OrderFilters, value: any) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
        page: 1,
      }));
    },
    []
  );

  // Handle status filter (clears other status-related filters)
  const handleStatusFilter = useCallback((status: OrderStatus) => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      dateFrom: last7Days.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      status, // Only set this status
    });
    setSearchQuery('');
  }, []);

  // Handle payment status filter (clears other payment-related filters)
  const handlePaymentStatusFilter = useCallback((paymentStatus: PaymentStatus) => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      dateFrom: last7Days.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      paymentStatus, // Only set this payment status
    });
    setSearchQuery('');
  }, []);

  // Handle fulfillment status filter (clears other fulfillment-related filters)
  const handleFulfillmentStatusFilter = useCallback((fulfillmentStatus: FulfillmentStatus) => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      dateFrom: last7Days.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      fulfillmentStatus, // Only set this fulfillment status
    });
    setSearchQuery('');
  }, []);

  // Handle clear all filters
  const handleClearAllFilters = useCallback(() => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
      dateFrom: last7Days.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      status: undefined,
      paymentStatus: undefined,
      fulfillmentStatus: undefined,
    });
    setSearchQuery('');
    setShowFilters(false);
  }, []);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      setFilters((prev) => ({ ...prev, page }));
    },
    []
  );

  // Handle view order
  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  }, []);

  // Handle cancel order
  const handleCancelOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsCancelModalOpen(true);
  }, []);

  // Handle cancel success
  const handleCancelSuccess = useCallback(async () => {
    setIsCancelModalOpen(false);
    setSelectedOrder(null);
    setSuccessMessage('Order cancelled successfully');
    await refetch();
  }, [refetch, setSuccessMessage]);

  // Handle delivery status update
  const handleUpdateDelivery = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsDeliveryModalOpen(true);
  }, []);

  // Handle delivery update success
  const handleDeliveryUpdateSuccess = useCallback(async () => {
    setIsDeliveryModalOpen(false);
    setSelectedOrder(null);
    setSuccessMessage('Delivery status updated successfully');
    await refetch();
  }, [refetch, setSuccessMessage]);

  // Check if any filters are active (besides default last 7 days)
  const hasActiveFilters = useMemo(() => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    const defaultDateFrom = last7Days.toISOString().split('T')[0];
    const defaultDateTo = today.toISOString().split('T')[0];

    return (
      !!filters.status ||
      !!filters.paymentStatus ||
      !!filters.fulfillmentStatus ||
      (!!filters.dateFrom && filters.dateFrom !== defaultDateFrom) ||
      (!!filters.dateTo && filters.dateTo !== defaultDateTo) ||
      !!searchQuery
    );
  }, [filters, searchQuery]);

  // Refresh orders when filters change
  useEffect(() => {
    if (headers) {
      fetchOrders(filters);
    }
  }, [filters, headers, fetchOrders]);

  // Status badge color helper
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'authorized':
        return 'bg-yellow-100 text-yellow-800';
      case 'partially_paid':
      case 'partially_refunded':
        return 'bg-orange-100 text-orange-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFulfillmentStatusColor = (status: FulfillmentStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partially_fulfilled':
      case 'partially_shipped':
        return 'bg-orange-100 text-orange-800';
      case 'fulfilled':
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date helper
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format currency helper
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Orders</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Orders <span className="text-base font-normal text-gray-600">- Manage and track customer orders</span>
        </h1>
      </div>

      {/* Stats Cards - Grouped by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Order Status Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center mb-1.5">
            <div className="flex items-center space-x-1">
              <div className="p-1 bg-blue-100 rounded">
                <ShoppingCart className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <h3 className="text-[11px] font-semibold text-gray-900">ORDER STATUS</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            <button
              onClick={() => handleStatusFilter('pending')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.status === 'pending'
                  ? 'border-yellow-500 bg-yellow-50 shadow-sm'
                  : 'border-gray-200 hover:border-yellow-400 hover:bg-yellow-50'
              }`}
              title="Click to filter pending orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.pending || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-yellow-700 leading-tight">Pending</span>
            </button>

            <button
              onClick={() => handleStatusFilter('confirmed')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.status === 'confirmed'
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-orange-50'
              }`}
              title="Click to filter confirmed orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.confirmed || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-orange-700 leading-tight">Confirmed</span>
            </button>

            <button
              onClick={() => handleStatusFilter('processing')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.status === 'processing'
                  ? 'border-purple-500 bg-purple-50 shadow-sm'
                  : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50'
              }`}
              title="Click to filter processing orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.processing || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-purple-700 leading-tight">Processing</span>
            </button>

            <button
              onClick={() => handleStatusFilter('shipped')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.status === 'shipped'
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
              title="Click to filter shipped orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.shipped || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-indigo-700 leading-tight">Shipped</span>
            </button>

            <button
              onClick={() => handleStatusFilter('delivered')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.status === 'delivered'
                  ? 'border-green-500 bg-green-50 shadow-sm'
                  : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
              }`}
              title="Click to filter delivered orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.delivered || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-green-700 leading-tight">Delivered</span>
            </button>

            <button
              onClick={() => handleStatusFilter('cancelled')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.status === 'cancelled'
                  ? 'border-red-500 bg-red-50 shadow-sm'
                  : 'border-gray-200 hover:border-red-400 hover:bg-red-50'
              }`}
              title="Click to filter cancelled orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.cancelled || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-red-700 leading-tight">Cancelled</span>
            </button>

            <button
              onClick={() => handleStatusFilter('refunded')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.status === 'refunded'
                  ? 'border-gray-500 bg-gray-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
              title="Click to filter refunded orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.refunded || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-gray-700 leading-tight">Refunded</span>
            </button>
          </div>
        </div>

        {/* Payment Status Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center mb-1.5">
            <div className="flex items-center space-x-1">
              <div className="p-1 bg-green-100 rounded">
                <CreditCard className="w-3.5 h-3.5 text-green-600" />
              </div>
              <h3 className="text-[11px] font-semibold text-gray-900">PAYMENT STATUS</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
            <button
              onClick={() => handlePaymentStatusFilter('paid')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.paymentStatus === 'paid'
                  ? 'border-green-500 bg-green-50 shadow-sm'
                  : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
              }`}
              title="Click to filter paid orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.paymentPaid || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-green-700 leading-tight">Paid</span>
            </button>

            <button
              onClick={() => handlePaymentStatusFilter('pending')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.paymentStatus === 'pending'
                  ? 'border-yellow-500 bg-yellow-50 shadow-sm'
                  : 'border-gray-200 hover:border-yellow-400 hover:bg-yellow-50'
              }`}
              title="Click to filter pending payments"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.paymentPending || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-yellow-700">Pending</span>
            </button>

            <button
              onClick={() => handlePaymentStatusFilter('failed')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.paymentStatus === 'failed'
                  ? 'border-red-500 bg-red-50 shadow-sm'
                  : 'border-gray-200 hover:border-red-400 hover:bg-red-50'
              }`}
              title="Click to filter failed payments"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.paymentFailed || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-red-700">Failed</span>
            </button>

            <button
              onClick={() => handlePaymentStatusFilter('authorized')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.paymentStatus === 'authorized'
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-orange-50'
              }`}
              title="Click to filter authorized payments"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.paymentAuthorized || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-orange-700">Authorized</span>
            </button>

            <button
              onClick={() => handlePaymentStatusFilter('partially_paid')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.paymentStatus === 'partially_paid'
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50'
              }`}
              title="Click to filter partially paid orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.paymentPartiallyPaid || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-orange-700">Part Paid</span>
            </button>

            <button
              onClick={() => handlePaymentStatusFilter('refunded')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.paymentStatus === 'refunded'
                  ? 'border-gray-500 bg-gray-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
              title="Click to filter refunded payments"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.paymentRefunded || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-gray-700">Refunded</span>
            </button>

            <button
              onClick={() => handlePaymentStatusFilter('partially_refunded')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.paymentStatus === 'partially_refunded'
                  ? 'border-gray-500 bg-gray-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
              }`}
              title="Click to filter partially refunded payments"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.paymentPartiallyRefunded || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-gray-700 leading-tight">Part Ref</span>
            </button>
          </div>
        </div>

        {/* Fulfillment Status Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-2">
          <div className="flex items-center mb-1.5">
            <div className="flex items-center space-x-1">
              <div className="p-1 bg-purple-100 rounded">
                <PackageCheck className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <h3 className="text-[11px] font-semibold text-gray-900">FULFILLMENT STATUS</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-1.5">
            <button
              onClick={() => handleFulfillmentStatusFilter('pending')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.fulfillmentStatus === 'pending'
                  ? 'border-yellow-500 bg-yellow-50 shadow-sm'
                  : 'border-gray-200 hover:border-yellow-400 hover:bg-yellow-50'
              }`}
              title="Click to filter pending fulfillment"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.fulfillmentPending || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-yellow-700">Pending</span>
            </button>

            <button
              onClick={() => handleFulfillmentStatusFilter('fulfilled')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.fulfillmentStatus === 'fulfilled'
                  ? 'border-green-500 bg-green-50 shadow-sm'
                  : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
              }`}
              title="Click to filter fulfilled orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.fulfillmentFulfilled || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-green-700">Fulfilled</span>
            </button>

            <button
              onClick={() => handleFulfillmentStatusFilter('shipped')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.fulfillmentStatus === 'shipped'
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
              }`}
              title="Click to filter shipped orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.fulfillmentShipped || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-indigo-700">Shipped</span>
            </button>

            <button
              onClick={() => handleFulfillmentStatusFilter('delivered')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.fulfillmentStatus === 'delivered'
                  ? 'border-green-600 bg-green-50 shadow-sm'
                  : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
              }`}
              title="Click to filter delivered orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.fulfillmentDelivered || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-green-700">Delivered</span>
            </button>

            <button
              onClick={() => handleFulfillmentStatusFilter('partially_fulfilled')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.fulfillmentStatus === 'partially_fulfilled'
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50'
              }`}
              title="Click to filter partially fulfilled orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.fulfillmentPartiallyFulfilled || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-orange-700">Part Fulfilled</span>
            </button>

            <button
              onClick={() => handleFulfillmentStatusFilter('partially_shipped')}
              className={`group flex flex-col items-center p-1.5 rounded border transition-all ${
                filters.fulfillmentStatus === 'partially_shipped'
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50'
              }`}
              title="Click to filter partially shipped orders"
            >
              <div className="flex items-center space-x-0.5 mb-0.5">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                <span className="text-sm font-bold text-gray-900">{stats?.fulfillmentPartiallyShipped || 0}</span>
              </div>
              <span className="text-[9px] text-gray-600 group-hover:text-orange-700">Part Shipped</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Toggle */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by order number, customer name, or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-2 md:px-3 py-2 border rounded-lg transition-colors whitespace-nowrap text-sm ${
            showFilters ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="flex items-center gap-1.5 px-2 md:px-3 py-2 border border-red-300 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap text-sm"
            title="Clear all filters"
          >
            <ClearIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-orange-50 rounded border border-orange-500 p-2 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col lg:flex-row flex-wrap items-stretch lg:items-end gap-2">
            {/* Status Filters */}
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[140px]"
            >
              <option value="">Order Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={filters.paymentStatus || ''}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value || undefined)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[140px]"
            >
              <option value="">Payment Status</option>
              <option value="pending">Pending</option>
              <option value="authorized">Authorized</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="partially_refunded">Partially Refunded</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={filters.fulfillmentStatus || ''}
              onChange={(e) => handleFilterChange('fulfillmentStatus', e.target.value || undefined)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[140px]"
            >
              <option value="">Fulfillment Status</option>
              <option value="pending">Pending</option>
              <option value="partially_fulfilled">Partially Fulfilled</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="partially_shipped">Partially Shipped</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>

            {/* Divider */}
            <div className="hidden lg:block h-8 w-px bg-gray-300"></div>

            {/* Date Range */}
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
              placeholder="From"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[130px]"
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
              placeholder="To"
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[130px]"
            />

            {/* Quick Date Presets */}
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setFilters(prev => ({ ...prev, dateFrom: today, dateTo: today, page: 1 }));
              }}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Today
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const last7Days = new Date(today);
                last7Days.setDate(today.getDate() - 7);
                setFilters(prev => ({
                  ...prev,
                  dateFrom: last7Days.toISOString().split('T')[0],
                  dateTo: today.toISOString().split('T')[0],
                  page: 1
                }));
              }}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              7d
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const last30Days = new Date(today);
                last30Days.setDate(today.getDate() - 30);
                setFilters(prev => ({
                  ...prev,
                  dateFrom: last30Days.toISOString().split('T')[0],
                  dateTo: today.toISOString().split('T')[0],
                  page: 1
                }));
              }}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              30d
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                setFilters(prev => ({
                  ...prev,
                  dateFrom: firstDay.toISOString().split('T')[0],
                  dateTo: today.toISOString().split('T')[0],
                  page: 1
                }));
              }}
              className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Month
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filters.status || filters.paymentStatus || filters.fulfillmentStatus
              ? 'No orders found'
              : 'No orders yet'}
          </h3>
          <p className="text-gray-600">
            {searchQuery || filters.status || filters.paymentStatus || filters.fulfillmentStatus
              ? 'Try adjusting your search or filters'
              : 'When customers place orders, they will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="hidden sm:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden lg:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="hidden xl:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fulfillment
                  </th>
                  <th className="hidden md:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-2 sm:px-3 py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 sm:py-4 whitespace-nowrap">
                      {canViewOrderDetails ? (
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="text-xs sm:text-sm font-medium text-orange-600 hover:text-slate-900"
                        >
                          {order.orderNumber}
                        </button>
                      ) : (
                        <span className="text-xs sm:text-sm font-medium text-gray-900">{order.orderNumber}</span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-3 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">
                        {order.mobileUser ?
                          `${order.mobileUser.firstName || ''} ${order.mobileUser.lastName || ''}`.trim() || order.mobileUser.email || 'Guest'
                          : 'Guest'}
                      </div>
                      {order.mobileUser?.email && (
                        <div className="hidden sm:block text-xs text-gray-500">{order.mobileUser.email}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 inline-flex text-[10px] sm:text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell px-3 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell px-3 py-3 sm:py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getFulfillmentStatusColor(
                          order.fulfillmentStatus
                        )}`}
                      >
                        {order.fulfillmentStatus}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-3 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-900">{order.items?.length || 0}</div>
                    </td>
                    <td className="px-3 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {formatCurrency(Number(order.total), order.currency)}
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canViewOrderDetails && (
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-orange-600 hover:text-slate-900 inline-flex items-center p-1"
                            title="View Order"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {canViewOrderDetails && order.status !== 'cancelled' && order.status !== 'refunded' && (
                          <button
                            onClick={() => handleUpdateDelivery(order)}
                            className={`inline-flex items-center p-1 ${
                              order.fulfillmentStatus === 'delivered'
                                ? 'text-green-600 hover:text-green-900'
                                : order.fulfillmentStatus === 'shipped'
                                ? 'text-orange-600 hover:text-slate-900'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            title="Update Delivery Status"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {canCancelOrders && order.status !== 'cancelled' && order.status !== 'refunded' && (
                          <button
                            onClick={() => handleCancelOrder(order)}
                            className="text-red-600 hover:text-red-900 inline-flex items-center p-1"
                            title="Cancel Order"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg border border-gray-200">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{(currentPage - 1) * (filters.limit || 20) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * (filters.limit || 20), totalOrders)}
                </span>{' '}
                of <span className="font-medium">{totalOrders}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        {isDetailModalOpen && selectedOrder && (
          <OrderDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => {
              setIsDetailModalOpen(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
            onRefresh={refetch}
            headers={headers || undefined}
          />
        )}
        {isCancelModalOpen && selectedOrder && (
          <CancelOrderModal
            isOpen={isCancelModalOpen}
            onClose={() => {
              setIsCancelModalOpen(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
            onSuccess={handleCancelSuccess}
            headers={headers || undefined}
          />
        )}

      {/* Update Delivery Status Modal */}
      {selectedOrder && (
        <Suspense fallback={null}>
          <UpdateDeliveryStatusModal
            isOpen={isDeliveryModalOpen}
            onClose={() => {
              setIsDeliveryModalOpen(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
            onSuccess={handleDeliveryUpdateSuccess}
          />
        </Suspense>
      )}
      </Suspense>
    </div>
  );
};

export default memo(OrdersSectionComponent);
