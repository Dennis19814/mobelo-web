'use client';
import { logger } from '@/lib/logger'

import { useState, useMemo, useCallback, useEffect, memo, lazy, Suspense } from 'react';
import { useMerchantAuth } from '@/hooks';
import { apiService } from '@/lib/api-service';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, AlertCircle, Search, Loader2, FolderTree } from 'lucide-react';
import { Category } from '@/types/category';
import { CategoryWithHierarchy } from '@/types/category.types';
import { useCategories } from '@/hooks/useCategories';
import DraggableHierarchicalCategoryRow from '@/components/merchant/DraggableHierarchicalCategoryRow';

// Lazy load modals
const AddCategoryModal = lazy(() => import('@/components/merchant/modals/AddCategoryModal').then(m => ({ default: m.AddCategoryModal })));
const EditCategoryModal = lazy(() => import('@/components/merchant/modals/EditCategoryModal').then(m => ({ default: m.EditCategoryModal })));
const DeleteCategoryModal = lazy(() => import('@/components/merchant/modals/DeleteCategoryModal').then(m => ({ default: m.DeleteCategoryModal })));

interface CategoriesSectionProps {
  appId: number;
  apiKey: string;
  appSecretKey: string;
}

const CategoriesSectionComponent = ({ appId, apiKey, appSecretKey }: CategoriesSectionProps) => {
  const { headers } = useMerchantAuth(apiKey, appSecretKey);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithHierarchy | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [productCounts, setProductCounts] = useState<Map<number, number>>(new Map());

  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refetch: refreshCategories
  } = useCategories({ appId, headers: headers || undefined });

  // Flatten nested categories structure (if API returns nested with children)
  const flattenedCategories = useMemo((): Category[] => {
    const flatten = (cats: Category[]): Category[] => {
      const result: Category[] = [];
      const processCategory = (cat: Category) => {
        // Add the category itself (without children property)
        const { children, ...categoryWithoutChildren } = cat;
        result.push(categoryWithoutChildren as Category);
        // Recursively process children if they exist
        if (children && children.length > 0) {
          children.forEach(child => processCategory(child));
        }
      };
      cats.forEach(cat => processCategory(cat));
      return result;
    };
    return flatten(categories);
  }, [categories]);

  // Fetch products and calculate product counts per category
  useEffect(() => {
    const fetchProductCounts = async () => {
      try {
        const response = await apiService.getProducts({ appId, limit: 10000 }); // Fetch all products
        if (response.ok && response.data) {
          const products = response.data.data || response.data;
          if (Array.isArray(products)) {
            // Count products per category
            const counts = new Map<number, number>();
            
            products.forEach((product: any) => {
              // Products can have multiple categories via categoryIds array or categories array
              const categoryIds: number[] = [];
              
              if (product.categoryIds && Array.isArray(product.categoryIds)) {
                categoryIds.push(...product.categoryIds);
              } else if (product.categories && Array.isArray(product.categories)) {
                product.categories.forEach((cat: any) => {
                  if (cat.id) categoryIds.push(cat.id);
                });
              }
              
              categoryIds.forEach(categoryId => {
                counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
              });
            });
            
            setProductCounts(counts);
          }
        }
      } catch (error) {
        logger.error('Failed to fetch product counts:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    if (appId && flattenedCategories.length > 0) {
      fetchProductCounts();
    }
  }, [appId, flattenedCategories.length]);

  // Categories start collapsed - user can expand them manually
  // Removed auto-expand functionality


  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Transform categories to hierarchical structure with display order
  const categoriesWithHierarchy = useMemo((): CategoryWithHierarchy[] => {
    // Helper to recursively get all descendant category IDs
    const getAllDescendantIds = (categoryId: number, allCats: Category[]): number[] => {
      const children = allCats.filter(c => c.parentId === categoryId);
      const descendantIds = children.map(c => c.id);
      // Recursively get descendants of each child
      children.forEach(child => {
        descendantIds.push(...getAllDescendantIds(child.id, allCats));
      });
      return descendantIds;
    };

    // Calculate total product count for a category including all its descendants
    const getTotalProductCount = (category: Category, allCats: Category[]): number => {
      // Use the actual product count from our fetched data, or fall back to API's productCount
      const directCount = productCounts.get(category.id) ?? category.productCount ?? 0;
      const descendantIds = getAllDescendantIds(category.id, allCats);
      const descendantCount = descendantIds.reduce((sum, id) => {
        // Use the actual product count from our fetched data, or fall back to API's productCount
        const desc = allCats.find(c => c.id === id);
        const descCount = desc ? (productCounts.get(desc.id) ?? desc.productCount ?? 0) : 0;
        return sum + descCount;
      }, 0);
      return directCount + descendantCount;
    };

    const buildHierarchy = (cats: Category[], parentId?: number, level = 0, parentPath = ''): CategoryWithHierarchy[] => {
      // Handle both null and undefined for root categories
      const filtered = cats
        .filter(cat => {
          // For root level, match both null and undefined
          if (parentId === undefined || parentId === null) {
            return cat.parentId == null; // This matches both null and undefined
          }
          // For non-root level, match exact parentId
          return cat.parentId === parentId;
        })
        .sort((a, b) => a.displayOrder - b.displayOrder);

      return filtered.map((cat, index) => {
        const currentPath = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
        const hasChildren = cats.some(c => c.parentId === cat.id);
        // Fix: Generate proper hierarchical display order to avoid duplicates
        const hierarchicalDisplayOrder = level === 0
          ? `${index + 1}`
          : `${parentPath}.${index + 1}`;

        // Calculate total product count including all descendants
        const totalProductCount = getTotalProductCount(cat, flattenedCategories);

        const categoryWithHierarchy: CategoryWithHierarchy = {
          ...cat,
          level,
          path: level > 0 ? currentPath : undefined,
          hierarchicalDisplayOrder,
          siblingPosition: index,
          hasChildren,
          isExpanded: expandedCategories.has(cat.id),
          productCount: totalProductCount, // Total including all descendants
        };

        const children = hasChildren && expandedCategories.has(cat.id)
          ? buildHierarchy(cats, cat.id, level + 1, hierarchicalDisplayOrder)
          : [];

        return [categoryWithHierarchy, ...children];
      }).flat();
    };

    return buildHierarchy(flattenedCategories);
  }, [flattenedCategories, expandedCategories, productCounts]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoriesWithHierarchy;

    return categoriesWithHierarchy.filter(cat =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [categoriesWithHierarchy, searchQuery]);

  const handleAddCategory = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const handleEditCategory = useCallback((category: CategoryWithHierarchy) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteCategory = useCallback((category: CategoryWithHierarchy) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  }, []);

  const handleToggleExpand = useCallback((category: CategoryWithHierarchy) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category.id)) {
        newSet.delete(category.id);
      } else {
        newSet.add(category.id);
      }
      return newSet;
    });
  }, []);

  const saveReorder = useCallback(async (updates: Array<{ id: number; displayOrder: number }>, parentId?: number) => {
    if (!headers) return;
    setReorderLoading(true);
    try {
      logger.debug('CategoriesSection.saveReorder - Sending reorder request:', {
        appId,
        parentId,
        updates: updates.length,
      });

      const response = await apiService.reorderCategories(appId, updates);

      if (!response.ok) {
        throw new Error('Failed to save category order');
      }

      logger.debug('CategoriesSection.saveReorder - Reorder successful');
      await refreshCategories();
    } catch (error) {
      logger.error('CategoriesSection.saveReorder - Error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save category order: ${errorMessage}. Refreshing...`);

      await refreshCategories();
    } finally {
      setReorderLoading(false);
    }
  }, [headers, appId, refreshCategories]);

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeCategory = filteredCategories.find(c => c.id === active.id);
    const overCategory = filteredCategories.find(c => c.id === over.id);

    if (!activeCategory || !overCategory) {
      return;
    }

    // Validate same parent level (critical for hierarchy integrity)
    if (activeCategory.parentId !== overCategory.parentId) {
      logger.warn('Cannot reorder categories across different parent levels');
      return;
    }

    // Get all categories at the same level
    const sameLevelCategories = filteredCategories.filter(c => c.parentId === activeCategory.parentId);
    const oldIndex = sameLevelCategories.findIndex(c => c.id === active.id);
    const newIndex = sameLevelCategories.findIndex(c => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder within the same level
    const newOrder = arrayMove(sameLevelCategories, oldIndex, newIndex);

    // Prepare reorder data
    const reorderData = newOrder.map((cat, index) => ({
      id: cat.id,
      displayOrder: index,
    }));

    await saveReorder(reorderData, activeCategory.parentId);
  }, [filteredCategories, saveReorder]);

  const handleAddSuccess = useCallback((category: Category) => {
    setIsAddModalOpen(false);
    // Refresh the categories list to get the latest data
    refreshCategories();
  }, [refreshCategories]);

  const handleEditSuccess = useCallback((category: Category) => {
    console.log('[DEBUG] handleEditSuccess called with category:', {
      id: category.id,
      name: category.name,
      iconUrl: category.iconUrl,
      imageUrl: category.imageUrl,
      displayType: category.displayType
    });
    setIsEditModalOpen(false);
    setSelectedCategory(null);
    // Refresh the categories list to get the updated data (including cleared icon/emoji fields)
    console.log('[DEBUG] Calling refreshCategories()...');
    refreshCategories();
  }, [refreshCategories]);

  const handleDeleteConfirm = useCallback(async (categoryId: number) => {
    setDeleteLoading(categoryId);
    try {
      await deleteCategory(categoryId);
      setIsDeleteModalOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      logger.error('Error deleting category:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    } finally {
      setDeleteLoading(null);
    }
  }, [deleteCategory]);

  const closeModals = useCallback(() => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedCategory(null);
  }, []);

  // Get categories that can be parents (exclude the current category being edited)
  const parentCategories = useMemo(() => flattenedCategories.filter(cat =>
    cat.id !== selectedCategory?.id &&
    cat.parentId !== selectedCategory?.id
  ), [flattenedCategories, selectedCategory?.id]);

  // Check if a category has child categories
  const hasChildCategories = useCallback((categoryId: number) =>
    flattenedCategories.some(cat => cat.parentId === categoryId),
    [flattenedCategories]
  );

  // Check if a category has products (assuming productCount is available)
  const hasProducts = useCallback((category: Category) =>
    (category.productCount || 0) > 0,
    []
  );

  return (
    <div className="overflow-hidden -mt-3 md:-mt-4 lg:-mt-9">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Categories</h1>
            <p className="text-gray-600">Organize your products into categories</p>
          </div>
          <button
            onClick={handleAddCategory}
            className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap text-sm md:text-base"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load categories</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={refreshCategories}
                className="text-sm text-red-600 underline hover:text-red-700 mt-2"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Table with Hierarchical Drag & Drop */}
      <div className="bg-white rounded-lg shadow-sm -mt-4">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop is disabled while searching
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No categories found
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first category'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddCategory}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Category
              </button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-2 md:px-4 py-3 w-8 md:w-12"></th>
                    <th className="hidden lg:table-cell px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Display Order
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="hidden md:table-cell px-3 md:px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <SortableContext
                    items={filteredCategories.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredCategories.map((category, index) => (
                      <DraggableHierarchicalCategoryRow
                        key={category.id}
                        category={category}
                        index={index}
                        onEdit={handleEditCategory}
                        onDelete={handleDeleteCategory}
                        onToggleExpand={handleToggleExpand}
                        deleteLoading={deleteLoading}
                        isDragDisabled={!!searchQuery || filteredCategories.length <= 1 || reorderLoading}
                        showHierarchy={true}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </div>
          </DndContext>
        )}

        {reorderLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
              <span className="text-sm text-gray-600">Saving order...</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals - Lazy loaded */}
      <Suspense fallback={null}>
        <AddCategoryModal
          isOpen={isAddModalOpen}
          onClose={closeModals}
          appId={appId}
          parentCategories={parentCategories}
          onSuccess={handleAddSuccess}
          onSubmit={createCategory}
        />

        <EditCategoryModal
          isOpen={isEditModalOpen}
          onClose={closeModals}
          appId={appId}
          category={selectedCategory}
          parentCategories={parentCategories}
          onSuccess={handleEditSuccess}
          onSubmit={(data) => updateCategory(selectedCategory!.id, data)}
        />

        <DeleteCategoryModal
          isOpen={isDeleteModalOpen}
          onClose={closeModals}
          category={selectedCategory}
          onConfirm={handleDeleteConfirm}
          hasChildCategories={selectedCategory ? hasChildCategories(selectedCategory.id) : false}
          hasProducts={selectedCategory ? hasProducts(selectedCategory) : false}
        />
      </Suspense>
    </div>
  );
};

export default memo(CategoriesSectionComponent);