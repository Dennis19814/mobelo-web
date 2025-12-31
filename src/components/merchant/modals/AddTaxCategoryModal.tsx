'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api-service';
import { TaxCategoryFormData } from '@/types/tax.types';

interface AddTaxCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  headers?: Record<string, string>;
}

export default function AddTaxCategoryModal({ isOpen, onClose, onSuccess, headers }: AddTaxCategoryModalProps) {
  const [formData, setFormData] = useState<TaxCategoryFormData>({
    name: '',
    description: '',
    isDefault: false,
    displayOrder: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.createTaxCategory(formData);

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error('Failed to create tax category');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tax category');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Tax Category</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
              <span>{isLoading ? 'Creating...' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
