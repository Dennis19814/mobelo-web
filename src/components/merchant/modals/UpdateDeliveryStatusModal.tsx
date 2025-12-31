'use client';

import { useState, useEffect } from 'react';
import { X, Truck } from 'lucide-react';
import { Order, FulfillmentStatus } from '@/types/order.types';
import { apiService } from '@/lib/api-service';

interface UpdateDeliveryStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

export default function UpdateDeliveryStatusModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: UpdateDeliveryStatusModalProps) {
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus>(order.fulfillmentStatus);
  const [estimatedDate, setEstimatedDate] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize estimated date/time from order if exists
  useEffect(() => {
    if (order.estimatedDeliveryAt) {
      const date = new Date(order.estimatedDeliveryAt);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = date.toTimeString().slice(0, 5); // HH:MM
      setEstimatedDate(dateStr);
      setEstimatedTime(timeStr);
    }
  }, [order.estimatedDeliveryAt]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Combine date and time if provided
      let estimatedDeliveryAt: string | undefined;
      if (estimatedDate) {
        // If only date is provided, use midnight; if both provided, combine them
        const timeStr = estimatedTime || '00:00';
        estimatedDeliveryAt = new Date(`${estimatedDate}T${timeStr}`).toISOString();
      }

      const response = await apiService.updateDeliveryStatus(order.id, {
        fulfillmentStatus,
        trackingNumber: trackingNumber || undefined,
        trackingUrl: trackingUrl || undefined,
        estimatedDeliveryAt,
      });

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error(response.data?.message || 'Failed to update delivery status');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update delivery status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getFulfillmentLabel = (status: FulfillmentStatus): string => {
    const labels: Record<FulfillmentStatus, string> = {
      pending: 'Pending',
      prepared: 'Prepared',
      partially_fulfilled: 'Partially Fulfilled',
      fulfilled: 'Fulfilled',
      partially_shipped: 'Partially Shipped',
      shipped: 'Out for Delivery',
      delivered: 'Delivered',
    };
    return labels[status];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Update Delivery Status</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Order <span className="font-mono font-semibold text-gray-900">{order.orderNumber}</span>
            </p>
          </div>

          {/* Fulfillment Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Status <span className="text-red-500">*</span>
            </label>
            <select
              value={fulfillmentStatus}
              onChange={(e) => {
                setFulfillmentStatus(e.target.value as FulfillmentStatus);
                setError(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="pending">{getFulfillmentLabel('pending')}</option>
              <option value="prepared">{getFulfillmentLabel('prepared')}</option>
              <option value="shipped">{getFulfillmentLabel('shipped')}</option>
              <option value="delivered">{getFulfillmentLabel('delivered')}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Note: &quot;Delivered&quot; status will mark the order as completed
            </p>
          </div>

          {/* Estimated Delivery Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Delivery Date
              </label>
              <input
                type="date"
                value={estimatedDate}
                onChange={(e) => setEstimatedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Delivery Time
              </label>
              <input
                type="time"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Tracking Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Number (Optional)
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g., 1Z999AA10123456784"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tracking URL (Optional)
              </label>
              <input
                type="url"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                placeholder="https://track.carrier.com/tracking/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Updating...' : 'Update Status'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
