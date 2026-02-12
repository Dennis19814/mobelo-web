'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Package, Loader2, CheckSquare, Square, ChevronDown, ChevronRight } from 'lucide-react';
import { ProductForTaxCategory } from '@/types/tax.types';
import { apiService } from '@/lib/api-service';

interface ProductTaxSelectorProps {
  selectedProductIds: number[];
  onProductsChange: (ids: number[]) => void;
  applyToAll: boolean;
  onApplyToAllChange: (value: boolean) => void;
  categoryId?: number;
}

export default function ProductTaxSelector({
  selectedProductIds,
  onProductsChange,
  applyToAll,
  onApplyToAllChange,
  categoryId,
}: ProductTaxSelectorProps) {
  const [products, setProducts] = useState<ProductForTaxCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchProducts();
  }, [categoryId, applyToAll]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getProductsForTaxCategory(categoryId);
      if (response.ok && response.data) {
        setProducts(response.data);

        // Pre-select products already assigned to this category (for edit mode)
        // Skip if "applyToAll" is true - in that case, we don't track individual IDs
        if (categoryId && !applyToAll) {
          const assignedProductIds = response.data
            .filter((p: ProductForTaxCategory) => p.isAssignedToCategory)
            .map((p: ProductForTaxCategory) => p.id);

          if (assignedProductIds.length > 0) {
            onProductsChange(assignedProductIds);
          }
        }
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query)) ||
        p.variants?.some((v) => v.sku && v.sku.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  const handleProductToggle = (productId: number) => {
    if (applyToAll) return; // Can't select individual when "apply to all" is checked

    const newIds = selectedProductIds.includes(productId)
      ? selectedProductIds.filter((id) => id !== productId)
      : [...selectedProductIds, productId];

    onProductsChange(newIds);
  };

  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      // Deselect all
      onProductsChange([]);
    } else {
      // Select all visible products
      onProductsChange(filteredProducts.map((p) => p.id));
    }
  };

  const handleApplyToAllChange = (checked: boolean) => {
    console.log('[ProductTaxSelector] Apply to all changed:', checked);
    onApplyToAllChange(checked);
    if (checked) {
      // Clear individual selections when "apply to all" is enabled
      onProductsChange([]);
    }
  };

  const toggleProductExpansion = (productId: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const getVariantDisplay = (variant: NonNullable<ProductForTaxCategory['variants']>[0]) => {
    const parts: string[] = [];
    if (variant.option1Value) parts.push(variant.option1Value);
    if (variant.option2Value) parts.push(variant.option2Value);
    if (variant.option3Value) parts.push(variant.option3Value);
    return parts.join(' / ');
  };

  return (
    <div className="space-y-3">
      {/* Header with Apply to All checkbox - Always visible */}
      <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
        <label htmlFor="apply-to-all-checkbox" className="flex items-center cursor-pointer w-full">
          <input
            id="apply-to-all-checkbox"
            type="checkbox"
            checked={applyToAll}
            onChange={(e) => {
              console.log('[ProductTaxSelector] Checkbox onChange:', e.target.checked);
              handleApplyToAllChange(e.target.checked);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer pointer-events-auto flex-shrink-0"
          />
          <span className="ml-2 text-sm font-medium text-gray-900 select-none">
            Apply to all products (including future products)
          </span>
        </label>
      </div>

      {!applyToAll && isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          <span className="ml-2 text-sm text-gray-600">Loading products...</span>
        </div>
      )}

      {!applyToAll && error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-2 text-sm text-red-700 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {!applyToAll && !isLoading && !error && (
        <>
          {/* Search and Select All */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
              <span className="text-xs text-gray-500">
                {selectedProductIds.length} of {products.length} selected
              </span>
            </div>
          </div>

          {/* Products List */}
          <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900">
                  {searchQuery ? 'No products found' : 'No products available'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {searchQuery ? 'Try a different search term' : 'Create products first'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const hasVariants = product.variants && product.variants.length > 0;
                  const isExpanded = expandedProducts.has(product.id);

                  return (
                    <div key={product.id} className="hover:bg-gray-50 transition-colors">
                      {/* Main Product Row */}
                      <div className="flex items-center px-3 py-2">
                        <div
                          className="flex items-center flex-1 cursor-pointer"
                          onClick={() => handleProductToggle(product.id)}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}

                          {product.thumbnailUrl && (
                            <img
                              src={product.thumbnailUrl}
                              alt={product.name}
                              className="w-8 h-8 object-cover rounded ml-2 flex-shrink-0"
                            />
                          )}

                          <div className="ml-2 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.taxCategoryName && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                                  {product.taxCategoryName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {hasVariants && (
                          <button
                            type="button"
                            onClick={() => toggleProductExpansion(product.id)}
                            className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Variants List (if expanded) */}
                      {hasVariants && isExpanded && product.variants && (
                        <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Variants ({product.variants.length}):
                          </p>
                          <div className="space-y-1 pl-6">
                            {product.variants.map((variant) => (
                              <div key={variant.id} className="text-xs text-gray-600">
                                • {getVariantDisplay(variant)}
                                {variant.sku && <span className="ml-2 text-gray-400">({variant.sku})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {applyToAll && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>All products</strong> (current and future) will be assigned to this tax category.
          </p>
        </div>
      )}
    </div>
  );
}
