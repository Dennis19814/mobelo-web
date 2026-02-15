'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
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
  const { options } = useTaxOptions({ headers });

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Category</label>
              <select
                value={formData.taxCategoryId || ''}
                onChange={(e) => setFormData({ ...formData, taxCategoryId: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {options?.categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <select
                value={formData.countries?.[0] || ''}
                onChange={(e) => setFormData({ ...formData, countries: e.target.value ? [e.target.value] : [], states: [] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Countries</option>
                {options?.countries?.map((country) => (
                  <option key={country.code} value={country.code}>{country.name}</option>
                ))}
              </select>
            </div>

            {selectedCountry && statesForCountry.length > 0 && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                <select
                  value={formData.states?.[0] || ''}
                  onChange={(e) => setFormData({ ...formData, states: e.target.value ? [e.target.value] : [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All States</option>
                  {statesForCountry.map((state) => (
                    <option key={state.code} value={state.code}>{state.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
              <select
                value={formData.taxType}
                onChange={(e) => setFormData({ ...formData, taxType: e.target.value as 'percentage' | 'fixed' | 'compound' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="compound">Compound (tax on tax)</option>
              </select>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
              <select
                value={formData.addressType}
                onChange={(e) => setFormData({ ...formData, addressType: e.target.value as 'shipping' | 'billing' | 'either' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="shipping">Shipping Address</option>
                <option value="billing">Billing Address</option>
                <option value="either">Either (prefer shipping)</option>
              </select>
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
