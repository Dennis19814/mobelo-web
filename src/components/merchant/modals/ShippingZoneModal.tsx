'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { COUNTRIES, getCountryName } from '@/constants/countries';
import { ALL_STATES, getStateName, COUNTRIES_WITH_STATES } from '@/lib/constants/geo-data';

/** Group state options by country for the dropdown */
function groupStatesByCountry(states: { code: string; name: string; country: string }[]) {
  const byCountry = new Map<string, { code: string; name: string }[]>();
  for (const s of states) {
    const list = byCountry.get(s.country) ?? [];
    list.push({ code: s.code, name: s.name });
    byCountry.set(s.country, list);
  }
  return byCountry;
}

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
    type?: 'domestic' | 'regional' | 'international' | 'custom';
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
    type: 'custom' as 'domestic' | 'regional' | 'international' | 'custom',
    isActive: true,
    displayOrder: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name || '',
        description: zone.description || '',
        countries: zone.countries || [],
        states: zone.states || [],
        type: zone.type || 'custom',
        isActive: zone.isActive ?? true,
        displayOrder: zone.displayOrder || 0,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        countries: [],
        states: [],
        type: 'custom',
        isActive: true,
        displayOrder: 0,
      });
    }
  }, [zone]);

  // Clear state selection when selected countries change and current selection is no longer valid
  useEffect(() => {
    if (selectedState && formData.countries.length > 0) {
      const stillValid = ALL_STATES.some(
        s => s.code === selectedState && formData.countries.includes(s.country)
      );
      if (!stillValid) setSelectedState('');
    } else if (formData.countries.length === 0) {
      setSelectedState('');
    }
  }, [formData.countries, selectedState]);

  const handleAddCountry = () => {
    if (selectedCountry && !formData.countries.includes(selectedCountry)) {
      setFormData({ ...formData, countries: [...formData.countries, selectedCountry] });
      setSelectedCountry('');
    }
  };

  const handleRemoveCountry = (country: string) => {
    setFormData({
      ...formData,
      countries: formData.countries.filter(c => c !== country)
    });
    setSelectedState('');
  };

  // Selected countries that have no state/province data → show "All" (whole country), cannot deselect
  const selectedCountriesWithNoStates = formData.countries.filter(
    c => !COUNTRIES_WITH_STATES.includes(c)
  );
  // Countries that have state data → show dropdown for specific states
  const selectedCountriesWithStates = formData.countries.filter(c =>
    COUNTRIES_WITH_STATES.includes(c)
  );

  // States/provinces for selected countries that have state data
  const availableStates =
    selectedCountriesWithStates.length > 0
      ? ALL_STATES.filter(s => selectedCountriesWithStates.includes(s.country))
      : [];
  const stateOptions = availableStates.filter(s => !formData.states.includes(s.code));
  const stateOptionsByCountry = groupStatesByCountry(stateOptions);

  const handleAddState = () => {
    if (selectedState && !formData.states.includes(selectedState)) {
      setFormData({ ...formData, states: [...formData.states, selectedState] });
      setSelectedState('');
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

  const modalContent = (
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

          {/* Zone Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zone Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'domestic' | 'regional' | 'international' | 'custom' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="custom">Custom</option>
              <option value="domestic">Domestic (Same country as store)</option>
              <option value="regional">Regional (Nearby countries)</option>
              <option value="international">International (Rest of world)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.type === 'domestic' && 'For shipping within your store\'s home country'}
              {formData.type === 'regional' && 'For shipping to nearby/regional countries'}
              {formData.type === 'international' && 'For shipping to international destinations'}
              {formData.type === 'custom' && 'User-defined zone with specific criteria'}
            </p>
          </div>

          {/* Countries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Countries
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Leave empty for "Rest of World" (catches all unmatched addresses)
            </p>
            <div className="flex gap-2 mb-2">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select a country...</option>
                {COUNTRIES.filter(c => !formData.countries.includes(c.code)).map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCountry}
                disabled={!selectedCountry}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    {getCountryName(country)} ({country})
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
              {formData.countries.length > 0
                ? 'Use for specific state-level shipping within the selected countries'
                : 'Select countries above first to see states/provinces'}
            </p>
            <div className="flex gap-2 mb-2">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                disabled={selectedCountriesWithStates.length === 0}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {formData.countries.length === 0
                    ? 'Select countries above first...'
                    : selectedCountriesWithStates.length === 0
                      ? 'No state-level options for selected countries'
                      : stateOptions.length === 0
                        ? 'No more states/provinces to add'
                        : 'Select a state/province...'}
                </option>
                {selectedCountriesWithStates.map((countryCode) => {
                  const states = stateOptionsByCountry.get(countryCode);
                  if (!states?.length) return null;
                  return (
                    <optgroup key={countryCode} label={getCountryName(countryCode)}>
                      {states.map((state) => (
                        <option key={`${countryCode}-${state.code}`} value={state.code}>
                          {state.name} ({state.code})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={handleAddState}
                disabled={!selectedState || selectedCountriesWithStates.length === 0}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {(selectedCountriesWithNoStates.length > 0 || formData.states.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {selectedCountriesWithNoStates.map((countryCode) => (
                  <span
                    key={`all-${countryCode}`}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    All ({getCountryName(countryCode)})
                    <button
                      type="button"
                      onClick={() => handleRemoveCountry(countryCode)}
                      className="ml-2 hover:text-purple-900"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {formData.states.map((state) => (
                  <span
                    key={state}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {getStateName(state)} ({state})
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

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : null;
}
