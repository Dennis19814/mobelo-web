'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Truck, Info, DollarSign, Weight, Percent, Package } from 'lucide-react';
import { apiService } from '@/lib/api-service';

const METHOD_OPTIONS: { value: 'flat_rate' | 'weight_based' | 'price_based' | 'free' | 'pickup'; label: string }[] = [
  { value: 'flat_rate', label: 'Flat Rate - Fixed price' },
  { value: 'weight_based', label: 'Weight Based - Base + price per kg' },
  { value: 'price_based', label: 'Price Based - Percentage of order total' },
  { value: 'free', label: 'Free Shipping' },
  { value: 'pickup', label: 'Local Pickup' },
];

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
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const methodDropdownRef = useRef<HTMLDivElement>(null);

  const closeMethodDropdown = useCallback(() => setMethodDropdownOpen(false), []);

  useEffect(() => {
    if (!isOpen) closeMethodDropdown();
  }, [isOpen, closeMethodDropdown]);

  useEffect(() => {
    if (!methodDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(target)) {
        closeMethodDropdown();
      }
    };
    // Use capture so we run before any other handlers (e.g. overlay); works with portal
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [methodDropdownOpen, closeMethodDropdown]);

  useEffect(() => {
    if (rate) {
      // Normalize condition fields: treat null, undefined, or invalid numbers as undefined so inputs show empty
      const toNum = (v: number | null | undefined): number | undefined => {
        if (v == null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
      };
      setFormData({
        name: rate.name || '',
        description: rate.description || '',
        method: rate.method || 'flat_rate',
        baseRate: rate.baseRate ?? 0,
        pricePerKg: rate.pricePerKg ?? 0,
        percentageOfTotal: rate.percentageOfTotal ?? 0,
        minOrderAmount: toNum(rate.minOrderAmount),
        maxOrderAmount: toNum(rate.maxOrderAmount),
        freeShippingThreshold: toNum(rate.freeShippingThreshold),
        minWeight: toNum(rate.minWeight),
        maxWeight: toNum(rate.maxWeight),
        deliveryMinDays: rate.deliveryMinDays ?? 3,
        deliveryMaxDays: rate.deliveryMaxDays ?? 5,
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
      // Send undefined for cleared condition fields
      const optNum = (v: number | undefined): number | undefined => (v != null && Number.isFinite(v) ? v : undefined);
      const payload = {
        zoneId,
        ...formData,
        minOrderAmount: optNum(formData.minOrderAmount),
        maxOrderAmount: optNum(formData.maxOrderAmount),
        freeShippingThreshold: optNum(formData.freeShippingThreshold),
        minWeight: optNum(formData.minWeight),
        maxWeight: optNum(formData.maxWeight),
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

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={(e) => {
        if (methodDropdownOpen && e.target === e.currentTarget) closeMethodDropdown();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - match Edit Tax Category modal */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Truck className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                {rate ? 'Edit Shipping Rate' : 'Create Shipping Rate'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
            >
              <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-2">
          {/* Error Message */}
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h3>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Rate Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Standard Shipping, Express Delivery"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={2}
                placeholder="Optional description shown to customers"
              />
            </div>

            {/* Method - custom dropdown (same design as Edit Tax Rule modal) */}
            <div ref={methodDropdownRef} className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Calculation Method <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setMethodDropdownOpen((o) => !o)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left flex items-center justify-between bg-white text-sm"
              >
                <span className="truncate">
                  {METHOD_OPTIONS.find((o) => o.value === formData.method)?.label ?? formData.method}
                </span>
                <svg className={`w-4 h-4 text-gray-500 shrink-0 ml-2 transition-transform ${methodDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {methodDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden" style={{ maxHeight: '280px' }}>
                  <div className="overflow-y-auto py-1" style={{ maxHeight: '276px' }}>
                    {METHOD_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, method: value });
                          setMethodDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${formData.method === value ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Configuration */}
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pricing Configuration
            </h3>

            {/* Flat Rate */}
            {formData.method === 'flat_rate' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Base Rate <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.baseRate}
                    onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="10.00"
                  />
                </div>
              </div>
            )}

            {/* Weight Based */}
            {formData.method === 'weight_based' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Base Rate</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.baseRate}
                      onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="5.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Price per kg <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricePerKg}
                      onChange={(e) => setFormData({ ...formData, pricePerKg: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Base Rate</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.baseRate}
                      onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">Percentage of Total <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.percentageOfTotal}
                      onChange={(e) => setFormData({ ...formData, percentageOfTotal: parseFloat(e.target.value) || 0 })}
                      className="w-full pr-6 pl-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="10"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Free Shipping Threshold */}
            {formData.method !== 'free' && formData.method !== 'pickup' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Free Shipping Threshold (optional)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.freeShippingThreshold || ''}
                    onChange={(e) => setFormData({ ...formData, freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="100.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Make shipping free when order exceeds this amount</p>
              </div>
            )}
          </div>

          {/* Conditions */}
          <div className="space-y-2 bg-blue-50 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Conditions (optional)
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Min Order Amount</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minOrderAmount || ''}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Max Order Amount</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxOrderAmount || ''}
                    onChange={(e) => setFormData({ ...formData, maxOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="No limit"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Min Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minWeight || ''}
                  onChange={(e) => setFormData({ ...formData, minWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Max Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxWeight || ''}
                  onChange={(e) => setFormData({ ...formData, maxWeight: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>

          {/* Delivery Time */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Delivery Time</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Min Delivery Days</label>
                <input
                  type="number"
                  min="0"
                  value={formData.deliveryMinDays}
                  onChange={(e) => setFormData({ ...formData, deliveryMinDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">Max Delivery Days</label>
                <input
                  type="number"
                  min="0"
                  value={formData.deliveryMaxDays}
                  onChange={(e) => setFormData({ ...formData, deliveryMaxDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
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

          {/* Actions - match Edit Tax Category */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{rate ? 'Update Rate' : 'Create Rate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
