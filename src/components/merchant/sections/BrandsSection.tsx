'use client';
import { logger } from '@/lib/logger'

import { useState, useCallback, useMemo, memo, lazy, Suspense } from 'react';
import { useBrands, type Brand } from '@/hooks';
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
import { Plus, Search, Loader2, Building2 } from 'lucide-react';
import DraggableBrandRow from '../DraggableBrandRow';

// Lazy load modals
const BrandModal = lazy(() => import('../BrandModal'));
const DeleteConfirmationModal = lazy(() => import('@/components/modals/DeleteConfirmationModal'));

interface BrandsSectionProps {
  appId: number;
  apiKey: string;
  appSecretKey: string;
}

const BrandsSectionComponent = ({ appId, apiKey, appSecretKey }: BrandsSectionProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const {
    brands,
    total: totalCount,
    isLoading: loading,
    error,
    deleteBrand: deleteBrandFromHook,
    reorderBrands: reorderBrandsFromHook,
    refetch: fetchBrands,
  } = useBrands({
    search: searchQuery,
    page,
    limit,
  });

  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [reorderLoading, setReorderLoading] = useState(false);

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

  const saveReorder = useCallback(async (updates: Array<{ id: number; displayOrder: number }>) => {
    setReorderLoading(true);
    try {
      logger.debug('BrandsSection.saveReorder - Sending reorder request:', {
        appId,
        updates: updates.length,
      });

      const success = await reorderBrandsFromHook(updates);

      if (!success) {
        throw new Error('Failed to save order');
      }

      logger.debug('BrandsSection.saveReorder - Reorder successful');
    } catch (error) {
      logger.error('BrandsSection.saveReorder - Error:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      alert('Failed to save brand order. Refreshing...');
    } finally {
      setReorderLoading(false);
    }
  }, [appId, reorderBrandsFromHook]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setIsDragging(false);
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = brands.findIndex(b => b.id === active.id);
    const newIndex = brands.findIndex(b => b.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Note: useBrands hook will handle optimistic update internally
    // Prepare the update payload with new display orders
    const newOrder = arrayMove(brands, oldIndex, newIndex);
    const updates = newOrder.map((brand, index) => ({
      id: brand.id,
      displayOrder: index,
    }));

    // Send the reorder request to the API
    await saveReorder(updates);
  }, [brands, saveReorder]);

  const handleCreate = useCallback(() => {
    setSelectedBrand(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((brand: Brand) => {
    setSelectedBrand(brand);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback((brand: Brand) => {
    setBrandToDelete(brand);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!brandToDelete) return;

    setDeleteLoading(brandToDelete.id);

    try {
      const success = await deleteBrandFromHook(brandToDelete.id);

      if (success) {
        setIsDeleteModalOpen(false);
        setBrandToDelete(null);
        // Hook will auto-refresh the brands list
      } else {
        alert('Failed to delete brand');
      }
    } catch (error) {
      logger.error('BrandsSection.handleConfirmDelete - Error:', {
        error: error instanceof Error ? error.message : String(error)
      });
      alert('Failed to delete brand');
    } finally {
      setDeleteLoading(null);
    }
  }, [brandToDelete, deleteBrandFromHook]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedBrand(null);
  }, []);

  const handleModalSave = useCallback(() => {
    fetchBrands();
  }, [fetchBrands]);

  const totalPages = useMemo(() => Math.ceil(totalCount / limit), [totalCount, limit]);

  // Disable drag and drop when searching or when there's only one brand
  const isDragDisabled = useMemo(
    () => !!searchQuery || brands.length <= 1 || reorderLoading,
    [searchQuery, brands.length, reorderLoading]
  );

  return (
    <div className="overflow-x-hidden min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Brands</h2>
          <p className="text-gray-600">
            Manage your product brands and manufacturers
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center px-3 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap text-sm md:text-base"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No brands found
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first brand'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Brand
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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 w-12"></th>
                    <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">
                      Display Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <SortableContext
                    items={brands.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {brands.map((brand, index) => (
                      <DraggableBrandRow
                        key={brand.id}
                        brand={brand}
                        index={index}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        deleteLoading={deleteLoading}
                        isDragDisabled={isDragDisabled}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </div>
          </DndContext>
        )}

        {brands.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-700">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} brands
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
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

      <Suspense fallback={null}>
        <BrandModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          brand={selectedBrand}
          appId={appId}
          apiKey={apiKey}
          appSecretKey={appSecretKey}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setBrandToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Brand"
          message={`Are you sure you want to delete "${brandToDelete?.name}"? This action cannot be undone.`}
          confirmButtonText="Delete Brand"
        />
      </Suspense>
    </div>
  );
};

export default memo(BrandsSectionComponent);