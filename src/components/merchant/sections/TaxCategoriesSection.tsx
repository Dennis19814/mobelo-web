'use client';

import { useState, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { useMerchantAuth } from '@/hooks';
import { Plus, AlertCircle, Search, Loader2, FolderTree, Pencil, Trash2 } from 'lucide-react';
import { TaxCategory } from '@/types/tax.types';
import { useTaxCategories } from '@/hooks/useTaxCategories';
import { useCrudOperations } from '@/hooks/useCrudOperations';

// Lazy load modals
const AddTaxCategoryModal = lazy(() => import('@/components/merchant/modals/AddTaxCategoryModal'));
const EditTaxCategoryModal = lazy(() => import('@/components/merchant/modals/EditTaxCategoryModal'));

interface TaxCategoriesSectionProps {
  appId: number;
  apiKey: string;
  appSecretKey: string;
}

const TaxCategoriesSectionComponent = ({ appId, apiKey, appSecretKey }: TaxCategoriesSectionProps) => {
  const { headers } = useMerchantAuth(apiKey, appSecretKey);
  const { setError, setSuccessMessage } = useCrudOperations();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TaxCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: refreshCategories
  } = useTaxCategories({ headers: headers || undefined });

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    return categories.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [categories, searchQuery]);

  const handleAddCategory = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: TaxCategory) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteCategory = useCallback(async (category: TaxCategory) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    setDeleteLoading(category.id);
    try {
      await deleteCategory(category.id);
      setSuccessMessage('Tax category deleted successfully');
      await refreshCategories();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete tax category');
    } finally {
      setDeleteLoading(null);
    }
  }, [deleteCategory, refreshCategories, setError, setSuccessMessage]);

  const handleAddSuccess = useCallback(async () => {
    setIsAddModalOpen(false);
    await refreshCategories();
    setSuccessMessage('Tax category created successfully');
  }, [refreshCategories, setSuccessMessage]);

  const handleEditSuccess = useCallback(async () => {
    setIsEditModalOpen(false);
    setSelectedCategory(null);
    await refreshCategories();
    setSuccessMessage('Tax category updated successfully');
  }, [refreshCategories, setSuccessMessage]);

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tax Categories</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => refreshCategories()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tax Categories</h2>
          <p className="text-gray-600 mt-1">Manage tax categories for your products</p>
        </div>
        <button
          onClick={handleAddCategory}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Tax Category</span>
        </button>
      </div>

      {/* Search */}
      <div >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search tax categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Categories List */}

      <div className="pt-6">

 
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No tax categories found' : 'No tax categories yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Create your first tax category to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Add Tax Category
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{category.description || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.isDefault && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{category.displayOrder}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-gray-600 hover:text-orange-600 transition-colors"
                    >
                                                    <Pencil className="h-4 w-4" />

                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      disabled={deleteLoading === category.id}
                      className="text-gray-600 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleteLoading === category.id ? (
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
      {/* Modals */}
      <Suspense fallback={null}>
        {isAddModalOpen && (
          <AddTaxCategoryModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={handleAddSuccess}
            headers={headers || undefined}
          />
        )}
        {isEditModalOpen && selectedCategory && (
          <EditTaxCategoryModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedCategory(null);
            }}
            onSuccess={handleEditSuccess}
            category={selectedCategory}
            headers={headers || undefined}
          />
        )}
      </Suspense>
      </div>

    </div>
  );
};

export default memo(TaxCategoriesSectionComponent);
