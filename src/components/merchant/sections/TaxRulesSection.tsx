'use client';

import { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMerchantAuth, useTaxRules, useTaxOptions, useCrudOperations } from '@/hooks';
import { Plus, AlertCircle, Search, Loader2, Receipt, X, Percent, Pencil, Trash2 } from 'lucide-react';
import { TaxRule, TaxRuleFormData } from '@/types/tax.types';
import { apiService } from '@/lib/api-service';

interface TaxRulesSectionProps {
  appId: number;
  apiKey: string;
  appSecretKey: string;
}

// Add/Edit Modal Component
const TaxRuleModal = ({ isOpen, onClose, onSuccess, rule, headers }: any) => {
  const [formData, setFormData] = useState<TaxRuleFormData>(
    rule || {
      name: '',
      description: '',
      taxCategoryId: null,
      countries: [],
      states: [],
      taxType: 'percentage',
      rate: 0,
      priority: 1,
      addressType: 'shipping',
      isEnabled: true,
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [taxCategoryDropdownOpen, setTaxCategoryDropdownOpen] = useState(false);
  const [taxTypeDropdownOpen, setTaxTypeDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [addressTypeDropdownOpen, setAddressTypeDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const taxCategoryDropdownRef = useRef<HTMLDivElement>(null);
  const taxTypeDropdownRef = useRef<HTMLDivElement>(null);
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const addressTypeDropdownRef = useRef<HTMLDivElement>(null);
  const addressTypeTriggerRef = useRef<HTMLButtonElement>(null);
  const [addressTypeDropdownPosition, setAddressTypeDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const { options } = useTaxOptions({ headers });


  const dropdownRefs = [countryDropdownRef, taxCategoryDropdownRef, taxTypeDropdownRef, stateDropdownRef, addressTypeDropdownRef];
  const anyDropdownOpen = countryDropdownOpen || taxCategoryDropdownOpen || taxTypeDropdownOpen || stateDropdownOpen || addressTypeDropdownOpen;

  const closeAllDropdowns = useCallback(() => {
    setCountryDropdownOpen(false);
    setTaxCategoryDropdownOpen(false);
    setTaxTypeDropdownOpen(false);
    setStateDropdownOpen(false);
    setAddressTypeDropdownOpen(false);
  }, []);

  // Close all dropdowns when modal closes
  useEffect(() => {
    if (!isOpen) closeAllDropdowns();
  }, [isOpen, closeAllDropdowns]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!anyDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (dropdownRefs.every((ref) => !ref.current?.contains(target))) {
        closeAllDropdowns();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [anyDropdownOpen, closeAllDropdowns]);

  // Update form data when rule prop changes (for edit mode)
  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        taxCategoryId: rule.taxCategoryId,
        countries: rule.countries || [],
        states: rule.states || [],
        taxType: rule.taxType || 'percentage',
        rate: rule.rate || 0,
        priority: rule.priority || 1,
        addressType: rule.addressType || 'shipping',
        isEnabled: rule.isEnabled !== false,
      });
    } else {
      // Reset to default values when opening "Add" modal
      setFormData({
        name: '',
        description: '',
        taxCategoryId: null,
        countries: [],
        states: [],
        taxType: 'percentage',
        rate: 0,
        priority: 1,
        addressType: 'shipping',
        isEnabled: true,
      });
    }
  }, [rule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Rule name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = rule
        ? await apiService.updateTaxRule(rule.id, formData)
        : await apiService.createTaxRule(formData);

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error(`Failed to ${rule ? 'update' : 'create'} tax rule`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${rule ? 'update' : 'create'} tax rule`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedCountry = formData.countries?.[0] || '';
  const statesForCountry = options?.states?.[selectedCountry] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Percent className="w-3.5 h-3.5 text-orange-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                {rule ? 'Edit' : 'Add'} Tax Rule


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


        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={2}
              />
            </div>

            <div ref={taxCategoryDropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Category</label>
              <button
                type="button"
                onClick={() => setTaxCategoryDropdownOpen((o) => !o)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left flex items-center justify-between bg-white"
              >
                <span className="truncate">
                  {formData.taxCategoryId != null
                    ? options?.categories?.find((c) => c.id === formData.taxCategoryId)?.name ?? ''
                    : 'All Categories'}
                </span>
                <svg className={`w-4 h-4 text-gray-500 shrink-0 ml-2 transition-transform ${taxCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {taxCategoryDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden" style={{ maxHeight: '280px' }}>
                  <div className="overflow-y-auto py-1" style={{ maxHeight: '276px' }}>
                    <button
                      type="button"
                      onClick={() => { setFormData({ ...formData, taxCategoryId: null }); setTaxCategoryDropdownOpen(false); }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${formData.taxCategoryId == null ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                    >
                      All Categories
                    </button>
                    {options?.categories?.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => { setFormData({ ...formData, taxCategoryId: cat.id }); setTaxCategoryDropdownOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${formData.taxCategoryId === cat.id ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div ref={countryDropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <button
                type="button"
                onClick={() => setCountryDropdownOpen((open) => !open)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left flex items-center justify-between bg-white"
              >
                <span className="truncate">
                  {selectedCountry
                    ? options?.countries?.find((c) => c.code === selectedCountry)?.name ?? selectedCountry
                    : 'All Countries'}
                </span>
                <svg className={`w-4 h-4 text-gray-500 shrink-0 ml-2 transition-transform ${countryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {countryDropdownOpen && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
                  style={{ maxHeight: '280px' }}
                >
                  <div className="overflow-y-auto py-1" style={{ maxHeight: '276px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, countries: [], states: [] });
                        setCountryDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${!selectedCountry ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                    >
                      All Countries
                    </button>
                    {options?.countries?.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, countries: [country.code], states: [] });
                          setCountryDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${selectedCountry === country.code ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                      >
                        {country.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedCountry && statesForCountry.length > 0 && (
              <div ref={stateDropdownRef} className="col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                <button
                  type="button"
                  onClick={() => setStateDropdownOpen((o) => !o)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left flex items-center justify-between bg-white"
                >
                  <span className="truncate">
                    {formData.states?.[0]
                      ? statesForCountry.find((s) => s.code === formData.states?.[0])?.name ?? formData.states?.[0]
                      : 'All States'}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 shrink-0 ml-2 transition-transform ${stateDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {stateDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden" style={{ maxHeight: '280px' }}>
                    <div className="overflow-y-auto py-1" style={{ maxHeight: '276px' }}>
                      <button
                        type="button"
                        onClick={() => { setFormData({ ...formData, states: [] }); setStateDropdownOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${!formData.states?.[0] ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                      >
                        All States
                      </button>
                      {statesForCountry.map((state) => (
                        <button
                          key={state.code}
                          type="button"
                          onClick={() => { setFormData({ ...formData, states: [state.code] }); setStateDropdownOpen(false); }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${formData.states?.[0] === state.code ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                        >
                          {state.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={taxTypeDropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
              <button
                type="button"
                onClick={() => setTaxTypeDropdownOpen((o) => !o)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left flex items-center justify-between bg-white"
              >
                <span className="truncate">
                  {formData.taxType === 'percentage' && 'Percentage'}
                  {formData.taxType === 'fixed' && 'Fixed Amount'}
                  {formData.taxType === 'compound' && 'Compound (tax on tax)'}
                </span>
                <svg className={`w-4 h-4 text-gray-500 shrink-0 ml-2 transition-transform ${taxTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {taxTypeDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden" style={{ maxHeight: '280px' }}>
                  <div className="overflow-y-auto py-1" style={{ maxHeight: '276px' }}>
                    {(['percentage', 'fixed', 'compound'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setFormData({ ...formData, taxType: value }); setTaxTypeDropdownOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${formData.taxType === value ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                      >
                        {value === 'percentage' && 'Percentage'}
                        {value === 'fixed' && 'Fixed Amount'}
                        {value === 'compound' && 'Compound (tax on tax)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate {formData.taxType === 'percentage' || formData.taxType === 'compound' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers = applied first (important for compound taxes)</p>
            </div>

            <div ref={addressTypeDropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
              <button
                ref={addressTypeTriggerRef}
                type="button"
                onClick={() => {
                  if (!addressTypeDropdownOpen && addressTypeTriggerRef.current) {
                    const rect = addressTypeTriggerRef.current.getBoundingClientRect();
                    setAddressTypeDropdownPosition({ top: rect.bottom + 2, left: rect.left, width: rect.width });
                  }
                  setAddressTypeDropdownOpen((o) => !o);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left flex items-center justify-between bg-white"
              >
                <span className="truncate">
                  {formData.addressType === 'shipping' && 'Shipping Address'}
                  {formData.addressType === 'billing' && 'Billing Address'}
                  {formData.addressType === 'either' && 'Either (prefer shipping)'}
                </span>
                <svg className={`w-4 h-4 text-gray-500 shrink-0 ml-2 transition-transform ${addressTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {addressTypeDropdownOpen &&
                typeof document !== 'undefined' &&
                createPortal(
                  <div
                    className="fixed z-[100] bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
                    style={{
                      top: addressTypeDropdownPosition.top,
                      left: addressTypeDropdownPosition.left,
                      width: addressTypeDropdownPosition.width,
                      maxHeight: '280px',
                    }}
                  >
                    <div className="overflow-y-auto py-1" style={{ maxHeight: '276px' }}>
                      {[
                        { value: 'shipping' as const, label: 'Shipping Address' },
                        { value: 'billing' as const, label: 'Billing Address' },
                        { value: 'either' as const, label: 'Either (prefer shipping)' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, addressType: value });
                            setAddressTypeDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${formData.addressType === value ? 'bg-orange-50 text-orange-700' : 'text-gray-700'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>,
                  document.body
                )}
            </div>

            <div className="col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isEnabled"
                  checked={formData.isEnabled !== false}
                  onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="isEnabled" className="ml-2 text-sm text-gray-700">Rule is active</label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? (rule ? 'Updating...' : 'Creating...') : (rule ? 'Update' : 'Create')} Rule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const TaxRulesSectionComponent = ({ appId, apiKey, appSecretKey }: TaxRulesSectionProps) => {
  const { headers } = useMerchantAuth(apiKey, appSecretKey);
  const { setError, setSuccessMessage } = useCrudOperations();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<TaxRule | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const { rules, isLoading, error, deleteRule, refetch } = useTaxRules();

  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) return rules;
    return rules.filter(rule =>
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rule.description && rule.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [rules, searchQuery]);

  const handleDeleteRule = useCallback(async (rule: TaxRule) => {
    if (!window.confirm(`Are you sure you want to delete "${rule.name}"?`)) return;

    setDeleteLoading(rule.id);
    try {
      await deleteRule(rule.id);
      setSuccessMessage('Tax rule deleted successfully');
      await refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete tax rule');
    } finally {
      setDeleteLoading(null);
    }
  }, [deleteRule, refetch, setError, setSuccessMessage]);

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tax Rules</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden min-w-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tax Rules</h2>
          <p className="text-gray-600 mt-1">Configure tax rates based on location and product category</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="w-5 h-5" />
          <span>Add Tax Rule</span>
        </button>
      </div>


      <div className="pt-4">
        <div className="relative ">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tax rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No tax rules found' : 'No tax rules yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Create your first tax rule to get started'}
            </p>
            {!searchQuery && (
              <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Add Tax Rule
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                      {rule.description && <div className="text-sm text-gray-500">{rule.description}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {rule.countries?.[0] ? `${rule.countries[0]}${rule.states?.[0] ? ` - ${rule.states[0]}` : ''}` : 'All'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {rule.rate}{rule.taxType === 'percentage' || rule.taxType === 'compound' ? '%' : ' $'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {rule.taxType === 'compound' && <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">Compound</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${rule.isEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.isEnabled ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => { setSelectedRule(rule); setIsEditModalOpen(true); }} className="text-gray-600 hover:text-orange-600">
                        <Pencil className="h-4 w-4" />

                      </button>
                      <button onClick={() => handleDeleteRule(rule)} disabled={deleteLoading === rule.id} className="text-red-600 hover:text-red-900 disabled:opacity-50">
                        {deleteLoading === rule.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <TaxRuleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => { setIsAddModalOpen(false); refetch(); setSuccessMessage('Tax rule created successfully'); }}
        headers={headers}
      />
      <TaxRuleModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setSelectedRule(null); }}
        onSuccess={() => { setIsEditModalOpen(false); setSelectedRule(null); refetch(); setSuccessMessage('Tax rule updated successfully'); }}
        rule={selectedRule}
        headers={headers}
      />
    </div>
  );
};

export default memo(TaxRulesSectionComponent);
