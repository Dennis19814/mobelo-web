'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api-service';
import { Category, CreateCategoryData, UpdateCategoryData, CategoryReorderData } from '@/types/category';
import { logger } from '@/lib/logger';

export interface UseCategoriesOptions {
  appId: number;
  hierarchy?: boolean;
  rootOnly?: boolean;
  headers?: Record<string, string>;
}

export interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  createCategory: (data: CreateCategoryData) => Promise<Category | null>;
  updateCategory: (id: number, data: UpdateCategoryData) => Promise<Category | null>;
  deleteCategory: (id: number) => Promise<boolean>;
  reorderCategories: (orders: CategoryReorderData[]) => Promise<boolean>;
  refreshCategory: (id: number) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useCategories(options: UseCategoriesOptions): UseCategoriesReturn {
  const { appId, hierarchy = true, rootOnly = false, headers } = options;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a stable reference for headers using individual key/value pairs
  const apiKey = headers?.['x-api-key'];
  const appSecretKey = headers?.['x-app-secret'];

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[DEBUG] fetchCategories called - fetching from API...');
      const response = await apiService.getCategories({
        hierarchy,
        rootOnly,
      });

      logger.debug('Categories fetched', { response: response.ok, dataLength: response.data?.length });
      console.log('[DEBUG] Categories fetched from API:', {
        count: response.data?.length,
        firstCategory: response.data?.[0] ? {
          id: response.data[0].id,
          name: response.data[0].name,
          iconUrl: response.data[0].iconUrl,
          imageUrl: response.data[0].imageUrl,
          displayType: response.data[0].displayType
        } : null
      });

      if (response.ok) {
        setCategories(response.data || []);
        console.log('[DEBUG] Categories state updated');
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      // Silently ignore cancelled requests (normal in dev mode with React Strict Mode)
      if (err instanceof Error && (err.name === 'AbortError' || err.message === 'Request was cancelled')) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to fetch categories', {
        message: errorMessage,
        appId,
        hasApiKey: !!apiKey,
        hasAppSecret: !!appSecretKey
      });
    } finally {
      setIsLoading(false);
    }
  }, [appId, hierarchy, rootOnly, apiKey, appSecretKey]);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Create category
  const createCategory = useCallback(async (data: CreateCategoryData): Promise<Category | null> => {
    try {
      setError(null);

      const response = await apiService.createCategory(data);

      if (response.ok && response.data) {
        const newCategory = response.data;

        // Optimistic update
        setCategories(prev => [...prev, newCategory]);

        // Refetch to ensure hierarchy is correct
        await fetchCategories();

        return newCategory;
      } else {
        throw new Error('Failed to create category');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      setError(errorMessage);
      logger.error('Failed to create category', {
        message: errorMessage,
        hasApiKey: !!apiKey,
        hasAppSecret: !!appSecretKey
      });
      return null;
    }
  }, [apiKey, appSecretKey, fetchCategories]);

  // Update category
  const updateCategory = useCallback(async (id: number, data: UpdateCategoryData): Promise<Category | null> => {
    try {
      setError(null);

      const response = await apiService.updateCategory(id, data, appId);

      if (response.ok && response.data) {
        const updatedCategory = response.data;

        // Optimistic update
        setCategories(prev =>
          prev.map(cat => cat.id === id ? updatedCategory : cat)
        );

        return updatedCategory;
      } else {
        throw new Error('Failed to update category');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      setError(errorMessage);
      logger.error('Failed to update category', {
        message: errorMessage,
        categoryId: id,
        hasApiKey: !!apiKey,
        hasAppSecret: !!appSecretKey
      });

      // Revert optimistic update by refetching
      await fetchCategories();
      return null;
    }
  }, [appId, apiKey, appSecretKey, fetchCategories]);

  // Delete category
  const deleteCategory = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);

      const response = await apiService.deleteCategory(id, appId);

      if (response.ok) {
        // Optimistic update
        setCategories(prev => prev.filter(cat => cat.id !== id));
        return true;
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      setError(errorMessage);
      logger.error('Failed to delete category', {
        message: errorMessage,
        categoryId: id,
        appId,
        hasApiKey: !!apiKey,
        hasAppSecret: !!appSecretKey
      });

      // Revert optimistic update by refetching
      await fetchCategories();
      return false;
    }
  }, [appId, apiKey, appSecretKey, fetchCategories]);

  // Reorder categories
  const reorderCategories = useCallback(async (orders: CategoryReorderData[]): Promise<boolean> => {
    try {
      setError(null);

      const response = await apiService.reorderCategories(appId, orders);

      if (response.ok) {
        // Refetch to get updated order
        await fetchCategories();
        return true;
      } else {
        throw new Error('Failed to reorder categories');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder categories';
      setError(errorMessage);
      logger.error('Failed to reorder categories', {
        message: errorMessage,
        appId,
        hasApiKey: !!apiKey,
        hasAppSecret: !!appSecretKey
      });
      return false;
    }
  }, [appId, apiKey, appSecretKey, fetchCategories]);

  // Refresh product count for a category
  const refreshCategory = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);

      const response = await apiService.get(`/categories/${id}/refresh-count`);

      if (response.ok) {
        // Refetch to get updated count
        await fetchCategories();
        return true;
      } else {
        throw new Error('Failed to refresh category');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh category';
      setError(errorMessage);
      logger.error('Failed to refresh category', {
        message: errorMessage,
        categoryId: id,
        hasApiKey: !!apiKey,
        hasAppSecret: !!appSecretKey
      });
      return false;
    }
  }, [apiKey, appSecretKey, fetchCategories]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refreshCategory,
    refetch,
  };
}