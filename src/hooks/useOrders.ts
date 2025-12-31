'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api-service';
import {
  Order,
  OrderFilters,
  OrdersListResponse,
  OrderStats,
  CancelOrderData,
  RefundOrderData,
  UpdateOrderStatusData,
  UpdatePaymentStatusData,
  UpdateFulfillmentStatusData,
} from '@/types/order.types';

export interface UseOrdersOptions {
  autoFetch?: boolean;
}

export interface UseOrdersReturn {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  stats: OrderStats | null;
  totalOrders: number;
  currentPage: number;
  totalPages: number;
  fetchOrders: (filters?: OrderFilters) => Promise<void>;
  fetchOrderDetails: (orderNumber: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: number, status: string) => Promise<boolean>;
  updatePaymentStatus: (orderId: number, paymentStatus: string) => Promise<boolean>;
  updateFulfillmentStatus: (orderId: number, fulfillmentStatus: string) => Promise<boolean>;
  cancelOrder: (orderId: number, data: CancelOrderData) => Promise<boolean>;
  refundOrder: (orderId: number, data: RefundOrderData) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useOrders(options: UseOrdersOptions = {}): UseOrdersReturn {
  const { autoFetch = true } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentFilters, setCurrentFilters] = useState<OrderFilters>({});

  // Calculate stats from orders
  const calculateStats = useCallback((ordersList: Order[]): OrderStats => {
    const stats: OrderStats = {
      // Order Status
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,

      // Payment Status
      paymentPending: 0,
      paymentAuthorized: 0,
      paymentPaid: 0,
      paymentPartiallyPaid: 0,
      paymentPartiallyRefunded: 0,
      paymentRefunded: 0,
      paymentFailed: 0,

      // Fulfillment Status
      fulfillmentPending: 0,
      fulfillmentPartiallyFulfilled: 0,
      fulfillmentFulfilled: 0,
      fulfillmentPartiallyShipped: 0,
      fulfillmentShipped: 0,
      fulfillmentDelivered: 0,

      total: ordersList.length,
    };

    ordersList.forEach((order) => {
      // Order Status
      switch (order.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'confirmed':
          stats.confirmed++;
          break;
        case 'processing':
          stats.processing++;
          break;
        case 'shipped':
          stats.shipped++;
          break;
        case 'delivered':
          stats.delivered++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
        case 'refunded':
          stats.refunded++;
          break;
      }

      // Payment Status
      switch (order.paymentStatus) {
        case 'pending':
          stats.paymentPending++;
          break;
        case 'authorized':
          stats.paymentAuthorized++;
          break;
        case 'paid':
          stats.paymentPaid++;
          break;
        case 'partially_paid':
          stats.paymentPartiallyPaid++;
          break;
        case 'partially_refunded':
          stats.paymentPartiallyRefunded++;
          break;
        case 'refunded':
          stats.paymentRefunded++;
          break;
        case 'failed':
          stats.paymentFailed++;
          break;
      }

      // Fulfillment Status
      switch (order.fulfillmentStatus) {
        case 'pending':
          stats.fulfillmentPending++;
          break;
        case 'partially_fulfilled':
          stats.fulfillmentPartiallyFulfilled++;
          break;
        case 'fulfilled':
          stats.fulfillmentFulfilled++;
          break;
        case 'partially_shipped':
          stats.fulfillmentPartiallyShipped++;
          break;
        case 'shipped':
          stats.fulfillmentShipped++;
          break;
        case 'delivered':
          stats.fulfillmentDelivered++;
          break;
      }
    });

    return stats;
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(
    async (filters: OrderFilters = {}) => {
      try {
        setIsLoading(true);
        setError(null);
        setCurrentFilters(filters);

        // Fetch filtered orders
        const response = await apiService.getOrders(filters);

        if (response.ok && response.data) {
          let ordersList: Order[] = [];

          // Handle paginated response
          if (response.data.data) {
            ordersList = response.data.data;
            setTotalOrders(response.data.meta?.total || 0);
            setCurrentPage(response.data.meta?.page || 1);
            setTotalPages(response.data.meta?.totalPages || 1);
          } else if (Array.isArray(response.data)) {
            // Handle array response
            ordersList = response.data;
            setTotalOrders(response.data.length);
            setCurrentPage(1);
            setTotalPages(1);
          }

          setOrders(ordersList);

          // Fetch all orders with ONLY date filters for accurate stats
          const statsFilters: OrderFilters = {
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            limit: 10000, // High limit to get all orders for stats
          };

          const statsResponse = await apiService.getOrders(statsFilters);

          if (statsResponse.ok && statsResponse.data) {
            let allOrders: Order[] = [];

            if (statsResponse.data.data) {
              allOrders = statsResponse.data.data;
            } else if (Array.isArray(statsResponse.data)) {
              allOrders = statsResponse.data;
            }

            // Calculate stats from ALL orders in the date range
            setStats(calculateStats(allOrders));
          } else {
            // Fallback to filtered orders if stats fetch fails
            setStats(calculateStats(ordersList));
          }
        } else {
          throw new Error(response.data?.message || 'Failed to fetch orders');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        setOrders([]);
        setStats(null);
      } finally {
        setIsLoading(false);
      }
    },
    [calculateStats]
  );

  // Fetch order details
  const fetchOrderDetails = useCallback(
    async (orderNumber: string): Promise<Order | null> => {
      try {
        setError(null);

        const response = await apiService.getOrderByNumber(orderNumber);

        if (response.ok && response.data) {
          return response.data;
        } else {
          throw new Error(response.data?.message || 'Failed to fetch order details');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch order details';
        setError(errorMessage);
        return null;
      }
    },
    []
  );

  // Update order status
  const updateOrderStatus = useCallback(
    async (orderId: number, status: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await apiService.updateOrderStatus(orderId, status);

        if (response.ok) {
          // Optimistically update local state
          setOrders((prev) =>
            prev.map((order) =>
              order.id === orderId ? { ...order, status: status as any } : order
            )
          );
          return true;
        } else {
          throw new Error(response.data?.message || 'Failed to update order status');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  // Update payment status
  const updatePaymentStatus = useCallback(
    async (orderId: number, paymentStatus: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await apiService.updatePaymentStatus(orderId, paymentStatus);

        if (response.ok) {
          // Optimistically update local state
          setOrders((prev) =>
            prev.map((order) =>
              order.id === orderId ? { ...order, paymentStatus: paymentStatus as any } : order
            )
          );
          return true;
        } else {
          throw new Error(response.data?.message || 'Failed to update payment status');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update payment status';
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  // Update fulfillment status
  const updateFulfillmentStatus = useCallback(
    async (orderId: number, fulfillmentStatus: string): Promise<boolean> => {
      try {
        setError(null);

        const response = await apiService.updateFulfillmentStatus(orderId, fulfillmentStatus);

        if (response.ok) {
          // Optimistically update local state
          setOrders((prev) =>
            prev.map((order) =>
              order.id === orderId
                ? { ...order, fulfillmentStatus: fulfillmentStatus as any }
                : order
            )
          );
          return true;
        } else {
          throw new Error(response.data?.message || 'Failed to update fulfillment status');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update fulfillment status';
        setError(errorMessage);
        return false;
      }
    },
    []
  );

  // Cancel order
  const cancelOrder = useCallback(
    async (orderId: number, data: CancelOrderData): Promise<boolean> => {
      try {
        setError(null);

        const response = await apiService.cancelOrder(orderId, data.reason);

        if (response.ok) {
          // Refresh orders to get updated list
          await fetchOrders(currentFilters);
          return true;
        } else {
          throw new Error(response.data?.message || 'Failed to cancel order');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order';
        setError(errorMessage);
        return false;
      }
    },
    [fetchOrders, currentFilters]
  );

  // Refund order
  const refundOrder = useCallback(
    async (orderId: number, data: RefundOrderData): Promise<boolean> => {
      try {
        setError(null);

        const response = await apiService.refundOrder(orderId, data);

        if (response.ok) {
          // Refresh orders to get updated refund data
          await fetchOrders(currentFilters);
          return true;
        } else {
          throw new Error(response.data?.message || 'Failed to process refund');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process refund';
        setError(errorMessage);
        return false;
      }
    },
    [fetchOrders, currentFilters]
  );

  // Refetch with current filters
  const refetch = useCallback(async () => {
    await fetchOrders(currentFilters);
  }, [fetchOrders, currentFilters]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [autoFetch, fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    stats,
    totalOrders,
    currentPage,
    totalPages,
    fetchOrders,
    fetchOrderDetails,
    updateOrderStatus,
    updatePaymentStatus,
    updateFulfillmentStatus,
    cancelOrder,
    refundOrder,
    refetch,
  };
}
