'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Truck, Info, DollarSign, Weight, Percent, Package } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface ShippingRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zoneId: number;
  rate?: {
    id: number;
    name: string;
    description?: string;
    method: 'flat_rate' | 'weight_based' | 'price_based' | 'free' | 'pickup';
    baseRate?: number;
    pricePerKg?: number;
    percentageOfTotal?: number;
    minOrderAmount?: number;
    maxOrderAmount?: number;
    freeShippingThreshold?: number;
    minWeight?: number;
    maxWeight?: number;
    deliveryMinDays?: number;
    deliveryMaxDays?: number;
    isActive: boolean;
    isTaxable: boolean;
  } | null;
}

export default function ShippingRateModal({ isOpen, onClose, onSuccess, zoneId, rate }: ShippingRateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    method: 'flat_rate' as 'flat_rate' | 'weight_based' | 'price_based' | 'free' | 'pickup',
    baseRate: 0,
    pricePerKg: 0,
    percentageOfTotal: 0,
    minOrderAmount: undefined as number | undefined,
    maxOrderAmount: undefined as number | undefined,
    freeShippingThreshold: undefined as number | undefined,
    minWeight: undefined as number | undefined,
    maxWeight: undefined as number | undefined,
    deliveryMinDays: 3,
    deliveryMaxDays: 5,
    isActive: true,
    isTaxable: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rate) {
      setFormData({
        name: rate.name || '',
        description: rate.description || '',
        method: rate.method || 'flat_rate',
        baseRate: rate.baseRate || 0,
        pricePerKg: rate.pricePerKg || 0,
        percentageOfTotal: rate.percentageOfTotal || 0,
        minOrderAmount: rate.minOrderAmount,
        maxOrderAmount: rate.maxOrderAmount,
        freeShippingThreshold: rate.freeShippingThreshold,
        minWeight: rate.minWeight,
        maxWeight: rate.maxWeight,
        deliveryMinDays: rate.deliveryMinDays || 3,
        deliveryMaxDays: rate.deliveryMaxDays || 5,
        isActive: rate.isActive ?? true,
        isTaxable: rate.isTaxable ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        method: 'flat_rate',
        baseRate: 10,
        pricePerKg: 0,
        percentageOfTotal: 0,
        minOrderAmount: undefined,
        maxOrderAmount: undefined,
        freeShippingThreshold: undefined,
        minWeight: undefined,
        maxWeight: undefined,
        deliveryMinDays: 3,
        deliveryMaxDays: 5,
        isActive: true,
        isTaxable: true,
      });
    }
  }, [rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Rate name is required');
      return;
    }

    // Validation based on method
    if (formData.method === 'weight_based' && (!formData.pricePerKg || formData.pricePerKg <= 0)) {
      setError('Price per kg is required for weight-based shipping');
      return;
    }

    if (formData.method === 'price_based' && (!formData.percentageOfTotal || formData.percentageOfTotal <= 0)) {
      setError('Percentage of total is required for price-based shipping');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        zoneId,
        ...formData,
        // Clean up undefined values
        minOrderAmount: formData.minOrderAmount || undefined,
        maxOrderAmount: formData.maxOrderAmount || undefined,
        freeShippingThreshold: formData.freeShippingThreshold || undefined,
        minWeight: formData.minWeight || undefined,
        maxWeight: formData.maxWeight || undefined,
      };

      const response = rate
        ? await apiService.updateShippingRate(rate.id, payload)
        : await apiService.createShippingRate(payload);

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error(response.data?.message || `Failed to ${rate ? 'update' : 'create'} rate`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${rate ? 'update' : 'create'} rate`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {rate ? 'Edit Shipping Rate' : 'Create Shipping Rate'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Standard Shipping, Express Delivery"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={2}
                placeholder="Optional description shown to customers"
              />
            </div>

            {/* Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Calculation Method <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="flat_rate">Flat Rate - Fixed price</option>
                <option value="weight_based">Weight Based - Base + price per kg</option>
                <option value="price_based">Price Based - Percentage of order total</option>
                <option value="free">Free Shipping</option>
                <option value="pickup">Local Pickup</option>
              </select>
            </div>
          </div>

          {/* Pricing Configuration */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing Configuration
            </h3>

            {/* Flat Rate */}
            {formData.method === 'flat_rate' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Rate <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.baseRate}
                    onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="10.00"
                  />
                </div>
              </div>
            )}

            {/* Weight Based */}
            {formData.method === 'weight_based' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.baseRate}
                      onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="5.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per kg <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricePerKg}
                      onChange={(e) => setFormData({ ...formData, pricePerKg: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="2.50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Price Based */}
            {formData.method === 'price_based' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.baseRate}
                      onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Percentage of Total <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.percentageOfTotal}
                      onChange={(e) => setFormData({ ...formData, percentageOfTotal: parseFloat(e.target.value) || 0 })}
                      className="w-full pr-7 pl-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Free Shipping Threshold */}
            {formData.method !== 'free' && formData.method !== 'pickup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Free Shipping Threshold (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.freeShippingThreshold || ''}
                    onChange={(e) => setFormData({ ...formData, freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="100.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Make shipping free when order exceeds this amount</p>
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Conditions (optional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Order Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minOrderAmount || ''}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Order Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxOrderAmount || ''}
                    onChange={(e) => setFormData({ ...formData, maxOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="No limit"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minWeight || ''}
                  onChange={(e) => setFormData({ ...formData, minWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxWeight || ''}
                  onChange={(e) => setFormData({ ...formData, maxWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>

          {/* Delivery Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Delivery Time</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Delivery Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.deliveryMinDays}
                  onChange={(e) => setFormData({ ...formData, deliveryMinDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Delivery Days
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.deliveryMaxDays}
                  onChange={(e) => setFormData({ ...formData, deliveryMaxDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active (available for customers)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isTaxable"
                checked={formData.isTaxable}
                onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="isTaxable" className="ml-2 text-sm text-gray-700">
                Taxable (apply tax to shipping cost)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {rate ? 'Update Rate' : 'Create Rate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
