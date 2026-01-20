'use client';
import { logger } from '@/lib/logger'

import { useState, useMemo, useCallback, useEffect, useRef, memo, lazy, Suspense } from 'react';
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
  const hasInitializedExpansion = useRef(false);
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(false);
  const hasStartedLoading = useRef(false);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [isInitialMount, setIsInitialMount] = useState(true);

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

  useEffect(() => {
    setHasCompletedInitialLoad(false);
    hasStartedLoading.current = false;
    setIsInitialMount(true);
  }, [appId]);

  // Track initial mount to show spinner immediately
  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      setIsInitialMount(false);
    } else if (!isLoading && hasStartedLoading.current) {
      setIsInitialMount(false);
    }
  }, [isLoading, categories.length]);

  useEffect(() => {
    if (categories.length > 0) {
      setHasCompletedInitialLoad(true);
      return;
    }

    if (isLoading) {
      hasStartedLoading.current = true;
    }

    if (!isLoading && hasStartedLoading.current) {
      setHasCompletedInitialLoad(true);
    }
  }, [categories.length, isLoading]);

  // Flatten nested categories structure (if API returns nested with children)
  const flattenCategories = useCallback((cats: Category[]): Category[] => {
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
  }, []);

  useEffect(() => {
    setLocalCategories(flattenCategories(categories));
  }, [categories, flattenCategories]);

  const flattenedCategoriesBase = useMemo((): Category[] => {
    return localCategories;
  }, [localCategories]);

  // Fetch products to calculate product counts per category
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});
  const [isLoadingProductCounts, setIsLoadingProductCounts] = useState(false);

  useEffect(() => {
    const fetchProductCounts = async () => {
      if (!headers || flattenedCategoriesBase.length === 0) return;
      
      setIsLoadingProductCounts(true);
      try {
        // Initialize counts for all categories
        const counts: Record<number, number> = {};
        flattenedCategoriesBase.forEach(cat => {
          counts[cat.id] = cat.productCount ?? 0; // Use API value as fallback
        });
        
        // Fetch all products with a high limit to get accurate counts
        const response = await apiService.getProducts({ limit: 10000 });
        
        if (response.ok && response.data) {
          // Handle different response structures
          let products: any[] = [];
          if (Array.isArray(response.data)) {
            products = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            products = response.data.data;
          } else if (response.data.products && Array.isArray(response.data.products)) {
            products = response.data.products;
          }
          
          // Count products per category
          products.forEach((product: any) => {
            if (product.categories && Array.isArray(product.categories)) {
              product.categories.forEach((cat: any) => {
                const categoryId = typeof cat === 'object' && cat !== null ? (cat.id || cat.categoryId) : cat;
                if (categoryId && typeof categoryId === 'number' && counts.hasOwnProperty(categoryId)) {
                  counts[categoryId]++;
                }
              });
            }
            // Also check for categoryIds array (alternative format)
            if (product.categoryIds && Array.isArray(product.categoryIds)) {
              product.categoryIds.forEach((categoryId: number) => {
                if (categoryId && counts.hasOwnProperty(categoryId)) {
                  counts[categoryId]++;
                }
              });
            }
          });
          
          setProductCounts(counts);
        }
      } catch (err) {
        logger.error('Failed to fetch product counts', { error: err });
        // On error, keep the counts from API (if any)
        const fallbackCounts: Record<number, number> = {};
        flattenedCategoriesBase.forEach(cat => {
          fallbackCounts[cat.id] = cat.productCount ?? 0;
        });
        setProductCounts(fallbackCounts);
      } finally {
        setIsLoadingProductCounts(false);
      }
    };

    fetchProductCounts();
  }, [headers, flattenedCategoriesBase.length, appId, flattenedCategoriesBase]);

  // Track if we're still processing categories (fetching or processing product counts)
  // Show spinner while fetching categories OR while fetching product counts for categories
  const isProcessingCategories = isLoading || (categories.length > 0 && isLoadingProductCounts);

  // Enhance flattened categories with product counts
  const flattenedCategories = useMemo((): Category[] => {
    return flattenedCategoriesBase.map(cat => ({
      ...cat,
      productCount: productCounts[cat.id] !== undefined ? productCounts[cat.id] : (cat.productCount ?? 0),
    }));
  }, [flattenedCategoriesBase, productCounts]);

  // Auto-expand all categories with children when categories are first loaded
  useEffect(() => {
    if (flattenedCategories.length > 0 && !hasInitializedExpansion.current) {
      const categoriesWithChildren = new Set<number>();
      flattenedCategories.forEach(cat => {
        const hasChildren = flattenedCategories.some(c => c.parentId === cat.id);
        if (hasChildren) {
          categoriesWithChildren.add(cat.id);
        }
      });
      if (categoriesWithChildren.size > 0) {
        setExpandedCategories(categoriesWithChildren);
        hasInitializedExpansion.current = true;
      }
    }
  }, [flattenedCategories]);


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

        const categoryWithHierarchy: CategoryWithHierarchy = {
          ...cat,
          level,
          path: level > 0 ? currentPath : undefined,
          hierarchicalDisplayOrder,
          siblingPosition: index,
          hasChildren,
          isExpanded: expandedCategories.has(cat.id),
        };

        const children = hasChildren && expandedCategories.has(cat.id)
          ? buildHierarchy(cats, cat.id, level + 1, hierarchicalDisplayOrder)
          : [];

        return [categoryWithHierarchy, ...children];
      }).flat();
    };

    return buildHierarchy(flattenedCategories);
  }, [flattenedCategories, expandedCategories]);

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

  const isDescendant = useCallback((childId: number, ancestorId: number) => {
    let current = flattenedCategories.find(cat => cat.id === childId);
    while (current && current.parentId != null) {
      if (current.parentId === ancestorId) return true;
      current = flattenedCategories.find(cat => cat.id === current!.parentId);
    }
    return false;
  }, [flattenedCategories]);

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

    // Prevent moving a category under its own descendants
    if (isDescendant(overCategory.id, activeCategory.id)) {
      logger.warn('Cannot move a category under its own descendant');
      return;
    }

    // Same parent: reorder within the level
    if (activeCategory.parentId === overCategory.parentId) {
      const sameLevelCategories = filteredCategories
        .filter(c => c.parentId === activeCategory.parentId)
        .sort((a, b) => a.displayOrder - b.displayOrder);
      const oldIndex = sameLevelCategories.findIndex(c => c.id === active.id);
      const newIndex = sameLevelCategories.findIndex(c => c.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newOrder = arrayMove(sameLevelCategories, oldIndex, newIndex);
      const reorderData = newOrder.map((cat, index) => ({
        id: cat.id,
        displayOrder: index,
      }));

      setLocalCategories(prev =>
        prev.map(cat => {
          if (cat.parentId !== activeCategory.parentId) return cat;
          const newIndexForCat = reorderData.findIndex(item => item.id === cat.id);
          return newIndexForCat !== -1
            ? { ...cat, displayOrder: newIndexForCat }
            : cat;
        })
      );

      await saveReorder(reorderData, activeCategory.parentId);
      return;
    }

    // Cross-parent move: allow moving subcategories to another parent
    if (activeCategory.parentId == null) {
      logger.warn('Cannot move top-level categories under another category');
      return;
    }

    const targetParentId = overCategory.level === 0 ? overCategory.id : overCategory.parentId;
    if (targetParentId == null) {
      return;
    }

    const oldParentId = activeCategory.parentId;
    const oldParentSiblings = filteredCategories
      .filter(c => c.parentId === oldParentId && c.id !== activeCategory.id)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const newParentSiblings = filteredCategories
      .filter(c => c.parentId === targetParentId)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const newDisplayOrder = newParentSiblings.length;

    const oldParentReorder = oldParentSiblings.map((cat, index) => ({
      id: cat.id,
      displayOrder: index,
    }));

    const newParentOrderIds = [...newParentSiblings.map(cat => cat.id), activeCategory.id];
    const newParentReorder = newParentOrderIds.map((id, index) => ({
      id,
      displayOrder: index,
    }));

    const oldParentReorderMap = new Map(oldParentReorder.map(item => [item.id, item.displayOrder]));
    const newParentReorderMap = new Map(newParentReorder.map(item => [item.id, item.displayOrder]));

    setLocalCategories(prev =>
      prev.map(cat => {
        if (cat.id === activeCategory.id) {
          return { ...cat, parentId: targetParentId, displayOrder: newDisplayOrder };
        }
        if (cat.parentId === oldParentId && cat.id !== activeCategory.id) {
          const nextOrder = oldParentReorderMap.get(cat.id);
          return nextOrder !== undefined ? { ...cat, displayOrder: nextOrder } : cat;
        }
        if (cat.parentId === targetParentId) {
          const nextOrder = newParentReorderMap.get(cat.id);
          return nextOrder !== undefined ? { ...cat, displayOrder: nextOrder } : cat;
        }
        return cat;
      })
    );

    const updatedCategory = await updateCategory(activeCategory.id, {
      parentId: targetParentId,
      displayOrder: newDisplayOrder,
    });

    if (!updatedCategory) {
      return;
    }

    if (oldParentSiblings.length > 0) {
      await saveReorder(oldParentReorder, oldParentId ?? undefined);
    }

    await saveReorder(newParentReorder, targetParentId);
  }, [filteredCategories, saveReorder, isDescendant, updateCategory]);

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
    <div className="w-full max-w-full overflow-x-hidden min-w-0">
      <div className="mb-8 w-full max-w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Categories</h1>
            <p className="text-gray-600">Organize your products into categories</p>
          </div>
          <button
            onClick={handleAddCategory}
            className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap text-sm md:text-base shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 w-full max-w-full min-w-0">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div className="min-w-0 flex-1">
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
      <div className="bg-white rounded-lg shadow-sm -mt-4 w-full max-w-full overflow-hidden min-w-0">
        <div className="p-4 border-b border-gray-200 min-w-0">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-w-0"
            />
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop is disabled while searching
            </p>
          )}
        </div>

        {((isLoading || isInitialMount || (isLoadingProductCounts && categories.length > 0)) && !reorderLoading) ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredCategories.length === 0 && searchQuery ? (
          <div className="text-center py-12">
            <FolderTree className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No categories found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search
            </p>
          </div>
        ) : filteredCategories.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="w-full overflow-x-auto overflow-y-visible min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full min-w-[640px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-2 md:px-4 py-4 w-8 md:w-12"></th>
                    <th className="hidden lg:table-cell px-2 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20 md:w-24">
                      Products
                    </th>
                    <th className="hidden md:table-cell px-3 md:px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-2 md:px-4 lg:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
        ) : null}

        {reorderLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <span className="text-sm text-white">Saving order...</span>
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