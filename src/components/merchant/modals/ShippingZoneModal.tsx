'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, MapPin, Plus, Trash2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { COUNTRIES, getCountryName } from '@/constants/countries';
import { ALL_STATES, getStateName, COUNTRIES_WITH_STATES } from '@/lib/constants/geo-data';

const ZONE_TYPE_OPTIONS: { value: 'domestic' | 'regional' | 'international' | 'custom'; label: string }[] = [
  { value: 'custom', label: 'Custom' },
  { value: 'domestic', label: 'Domestic (Same country as store)' },
  { value: 'regional', label: 'Regional (Nearby countries)' },
  { value: 'international', label: 'International (Rest of world)' },
];

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
  const [zoneTypeDropdownOpen, setZoneTypeDropdownOpen] = useState(false);
  const [countriesDropdownOpen, setCountriesDropdownOpen] = useState(false);
  const zoneTypeDropdownRef = useRef<HTMLDivElement>(null);
  const countriesDropdownRef = useRef<HTMLDivElement>(null);
  const zoneTypeTriggerRef = useRef<HTMLButtonElement>(null);
  const countriesTriggerRef = useRef<HTMLButtonElement>(null);
  const [zoneTypeDropdownPosition, setZoneTypeDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });
  const [countriesDropdownPosition, setCountriesDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 240 });
  const zoneTypePortalRef = useRef<HTMLDivElement>(null);
  const countriesPortalRef = useRef<HTMLDivElement>(null);

  const closeZoneTypeDropdown = useCallback(() => setZoneTypeDropdownOpen(false), []);
  const closeCountriesDropdown = useCallback(() => setCountriesDropdownOpen(false), []);

  useEffect(() => {
    if (!isOpen) {
      closeZoneTypeDropdown();
      closeCountriesDropdown();
    }
  }, [isOpen, closeZoneTypeDropdown, closeCountriesDropdown]);

  useEffect(() => {
    if (!zoneTypeDropdownOpen && !countriesDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        zoneTypeDropdownRef.current?.contains(target) ||
        countriesDropdownRef.current?.contains(target) ||
        zoneTypeTriggerRef.current?.contains(target) ||
        countriesTriggerRef.current?.contains(target) ||
        zoneTypePortalRef.current?.contains(target) ||
        countriesPortalRef.current?.contains(target)
      ) return;
      closeZoneTypeDropdown();
      closeCountriesDropdown();
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [zoneTypeDropdownOpen, countriesDropdownOpen, closeZoneTypeDropdown, closeCountriesDropdown]);

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
        {/* Header - match Edit Tax Category modal */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                {zone ? 'Edit Shipping Zone' : 'Create Shipping Zone'}
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

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Zone Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Domestic, International, Europe"
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
              placeholder="Optional description"
            />
          </div>

          {/* Zone Type - custom dropdown (same design as Edit Tax Rule / Edit Shipping Rate) */}
          <div ref={zoneTypeDropdownRef} className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Zone Type
            </label>
            <button
              ref={zoneTypeTriggerRef}
              type="button"
              onClick={() => {
                if (!zoneTypeDropdownOpen && zoneTypeTriggerRef.current) {
                  const rect = zoneTypeTriggerRef.current.getBoundingClientRect();
                  const availableHeight = window.innerHeight - rect.bottom - 8; // 8px for margin
                  const maxHeight = Math.min(240, Math.max(120, availableHeight)); // Show ~6 items (240px) but respect viewport
                  setZoneTypeDropdownPosition({ top: rect.bottom + 2, left: rect.left, width: rect.width, maxHeight });
                }
                setZoneTypeDropdownOpen((o) => !o);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left flex items-center justify-between bg-white text-sm"
            >
              <span className="truncate">
                {ZONE_TYPE_OPTIONS.find((o) => o.value === formData.type)?.label ?? formData.type}
              </span>
              <svg className={`w-4 h-4 text-gray-500 shrink-0 ml-2 transition-transform ${zoneTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {zoneTypeDropdownOpen &&
              typeof document !== 'undefined' &&
              createPortal(
                <div
                  ref={zoneTypePortalRef}
                  className="fixed z-[100] bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
                  style={{
                    top: zoneTypeDropdownPosition.top,
                    left: zoneTypeDropdownPosition.left,
                    width: zoneTypeDropdownPosition.width,
                    maxHeight: `${zoneTypeDropdownPosition.maxHeight}px`,
                  }}
                >
                  <div className="overflow-y-auto py-1" style={{ maxHeight: `${zoneTypeDropdownPosition.maxHeight - 4}px` }}>
                    {ZONE_TYPE_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, type: value });
                          setZoneTypeDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${formData.type === value ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>,
                document.body
              )}
            <p className="text-xs text-gray-500 mt-0.5">
              {formData.type === 'domestic' && 'For shipping within your store\'s home country'}
              {formData.type === 'regional' && 'For shipping to nearby/regional countries'}
              {formData.type === 'international' && 'For shipping to international destinations'}
              {formData.type === 'custom' && 'User-defined zone with specific criteria'}
            </p>
          </div>

          {/* Countries - custom dropdown (same design as Edit Tax Rule / Edit Shipping Rate) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Countries
            </label>
            <p className="text-xs text-gray-500 mb-1">
              Leave empty for "Rest of World" (catches all unmatched addresses)
            </p>
            <div className="flex gap-2 mb-2" ref={countriesDropdownRef}>
              <div className="relative flex-1">
                <button
                  ref={countriesTriggerRef}
                  type="button"
                  onClick={() => {
                    if (!countriesDropdownOpen && countriesTriggerRef.current) {
                      const rect = countriesTriggerRef.current.getBoundingClientRect();
                      const availableHeight = window.innerHeight - rect.bottom - 8; // 8px for margin
                      const maxHeight = Math.min(240, Math.max(120, availableHeight)); // Show ~6 items (240px) but respect viewport
                      setCountriesDropdownPosition({ top: rect.bottom + 2, left: rect.left, width: rect.width, maxHeight });
                    }
                    setCountriesDropdownOpen((o) => !o);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left flex items-center justify-between bg-white text-sm"
                >
                  <span className={`truncate ${selectedCountry ? 'text-gray-700' : 'text-gray-500'}`}>
                    {selectedCountry
                      ? `${COUNTRIES.find((c) => c.code === selectedCountry)?.name ?? selectedCountry} (${selectedCountry})`
                      : 'Select a country...'}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 shrink-0 ml-2 transition-transform ${countriesDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {countriesDropdownOpen &&
                  typeof document !== 'undefined' &&
                  createPortal(
                    <div
                      ref={countriesPortalRef}
                      className="fixed z-[100] bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
                      style={{
                        top: countriesDropdownPosition.top,
                        left: countriesDropdownPosition.left,
                        width: countriesDropdownPosition.width,
                        maxHeight: `${countriesDropdownPosition.maxHeight}px`,
                      }}
                    >
                      <div className="overflow-y-auto py-1" style={{ maxHeight: `${countriesDropdownPosition.maxHeight - 4}px` }}>
                        {COUNTRIES.filter((c) => !formData.countries.includes(c.code)).length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">No more countries to add</div>
                        ) : (
                          COUNTRIES.filter((c) => !formData.countries.includes(c.code)).map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country.code);
                                setCountriesDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${selectedCountry === country.code ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                            >
                              {country.name} ({country.code})
                            </button>
                          ))
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
              </div>
              <button
                type="button"
                onClick={handleAddCountry}
                disabled={!selectedCountry}
                className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
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
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              States/Provinces (optional)
            </label>
            <p className="text-xs text-gray-500 mb-1">
              {formData.countries.length > 0
                ? 'Use for specific state-level shipping within the selected countries'
                : 'Select countries above first to see states/provinces'}
            </p>
            <div className="flex gap-2 mb-2">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                disabled={selectedCountriesWithStates.length === 0}
                className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
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
                    className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
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

          {/* Priority Order */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Priority Order
            </label>
            <p className="text-xs text-gray-500 mb-0.5">
              Lower numbers = higher priority for address matching
            </p>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              <span>{zone ? 'Update Zone' : 'Create Zone'}</span>
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
