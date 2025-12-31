'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Order } from '@/types/order.types';
import { apiService } from '@/lib/api-service';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
  headers?: Record<string, string>;
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  order,
  onSuccess,
  headers,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.cancelOrder(order.id, reason);

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error(response.data?.message || 'Failed to cancel order');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel order';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Cancel Order</h2>
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
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This action will cancel order{' '}
              <span className="font-mono font-semibold">{order.orderNumber}</span>.
              This cannot be undone.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cancellation Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="">Select a reason...</option>
              <option value="Customer requested cancellation">Customer requested cancellation</option>
              <option value="Item out of stock">Item out of stock</option>
              <option value="Payment failed">Payment failed</option>
              <option value="Duplicate order">Duplicate order</option>
              <option value="Fraudulent order">Fraudulent order</option>
              <option value="Unable to fulfill">Unable to fulfill</option>
              <option value="Other">Other</option>
            </select>
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
            onClick={handleCancel}
            disabled={isLoading || !reason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
            <span>{isLoading ? 'Cancelling...' : 'Cancel Order'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
