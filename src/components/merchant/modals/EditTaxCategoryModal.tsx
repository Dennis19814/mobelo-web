'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Percent } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { TaxCategory, TaxCategoryFormData } from '@/types/tax.types';
import ProductTaxSelector from '../ProductTaxSelector';

interface EditTaxCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: TaxCategory;
  headers?: Record<string, string>;
}

export default function EditTaxCategoryModal({ isOpen, onClose, onSuccess, category, headers }: EditTaxCategoryModalProps) {
  const [formData, setFormData] = useState<TaxCategoryFormData>({
    name: category.name,
    description: category.description,
    isDefault: category.isDefault,
    displayOrder: category.displayOrder,
    productIds: [],
    applyToAllProducts: category.applyToAllProducts || false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      name: category.name,
      description: category.description,
      isDefault: category.isDefault,
      displayOrder: category.displayOrder,
      productIds: [],
      applyToAllProducts: category.applyToAllProducts || false,
    });
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log('[EditTaxCategoryModal] Submitting formData:', JSON.stringify(formData, null, 2));

    try {
      const response = await apiService.updateTaxCategory(category.id, formData);

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error('Failed to update tax category');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tax category');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        {/* Header */}
           <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Percent className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
         Edit Tax Category
 

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
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Clothing, Electronics"
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
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Optional description"
            />
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Display Order
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
          </div>

          {/* Is Default */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault || false}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
              Set as default category
            </label>
          </div>

          {/* Product Assignment Section */}
          <div className="border-t border-gray-200 pt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Products
            </label>
            <ProductTaxSelector
              selectedProductIds={formData.productIds || []}
              onProductsChange={(ids) => setFormData(prev => ({ ...prev, productIds: ids }))}
              applyToAll={formData.applyToAllProducts || false}
              onApplyToAllChange={(value) => {
                console.log('[EditTaxCategoryModal] onApplyToAllChange:', value);
                setFormData(prev => ({ ...prev, applyToAllProducts: value }));
              }}
              categoryId={category.id}
            />
          </div>

          {/* Actions */}
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
              className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isLoading ? 'Updating...' : 'Update Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
