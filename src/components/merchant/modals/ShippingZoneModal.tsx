'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface ShippingZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zone?: {
    id: number;
    name: string;
    description?: string;
    countries?: string[];
    states?: string[];
    isActive: boolean;
    displayOrder: number;
  } | null;
}

export default function ShippingZoneModal({ isOpen, onClose, onSuccess, zone }: ShippingZoneModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    countries: [] as string[],
    states: [] as string[],
    isActive: true,
    displayOrder: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryInput, setCountryInput] = useState('');
  const [stateInput, setStateInput] = useState('');

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name || '',
        description: zone.description || '',
        countries: zone.countries || [],
        states: zone.states || [],
        isActive: zone.isActive ?? true,
        displayOrder: zone.displayOrder || 0,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        countries: [],
        states: [],
        isActive: true,
        displayOrder: 0,
      });
    }
  }, [zone]);

  const handleAddCountry = () => {
    const country = countryInput.trim().toUpperCase();
    if (country && !formData.countries.includes(country)) {
      setFormData({ ...formData, countries: [...formData.countries, country] });
      setCountryInput('');
    }
  };

  const handleRemoveCountry = (country: string) => {
    setFormData({
      ...formData,
      countries: formData.countries.filter(c => c !== country)
    });
  };

  const handleAddState = () => {
    const state = stateInput.trim().toUpperCase();
    if (state && !formData.states.includes(state)) {
      setFormData({ ...formData, states: [...formData.states, state] });
      setStateInput('');
    }
  };

  const handleRemoveState = (state: string) => {
    setFormData({
      ...formData,
      states: formData.states.filter(s => s !== state)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Zone name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = zone
        ? await apiService.updateShippingZone(zone.id, formData)
        : await apiService.createShippingZone(formData);

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error(response.data?.message || `Failed to ${zone ? 'update' : 'create'} zone`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${zone ? 'update' : 'create'} zone`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {zone ? 'Edit Shipping Zone' : 'Create Shipping Zone'}
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

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zone Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Domestic, International, Europe"
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
              rows={3}
              placeholder="Optional description"
            />
          </div>

          {/* Countries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Countries (ISO codes)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Leave empty for "Rest of World" (catches all unmatched addresses)
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={countryInput}
                onChange={(e) => setCountryInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCountry())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., US, CA, MX"
                maxLength={2}
              />
              <button
                type="button"
                onClick={handleAddCountry}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {formData.countries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.countries.map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {country}
                    <button
                      type="button"
                      onClick={() => handleRemoveCountry(country)}
                      className="ml-2 hover:text-blue-900"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* States */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              States/Provinces (optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Use for specific state-level shipping (e.g., CA, NY, TX)
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={stateInput}
                onChange={(e) => setStateInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddState())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., CA, NY, TX"
                maxLength={2}
              />
              <button
                type="button"
                onClick={handleAddState}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {formData.states.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.states.map((state) => (
                  <span
                    key={state}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {state}
                    <button
                      type="button"
                      onClick={() => handleRemoveState(state)}
                      className="ml-2 hover:text-purple-900"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Order
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Lower numbers = higher priority for address matching
            </p>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              min="0"
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active (zone can be used for shipping)
            </label>
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
              {zone ? 'Update Zone' : 'Create Zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
