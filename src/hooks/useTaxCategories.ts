'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/lib/api-service';
import { TaxCategory, TaxCategoryFormData } from '@/types/tax.types';

export interface UseTaxCategoriesOptions {}

export interface UseTaxCategoriesReturn {
  categories: TaxCategory[];
  isLoading: boolean;
  error: string | null;
  createCategory: (data: TaxCategoryFormData) => Promise<TaxCategory | null>;
  updateCategory: (id: number, data: TaxCategoryFormData) => Promise<TaxCategory | null>;
  deleteCategory: (id: number) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useTaxCategories(options: UseTaxCategoriesOptions = {}): UseTaxCategoriesReturn {
  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  // Fetch tax categories - only apply result if this request is still the latest (avoids empty then table flash)
  const fetchCategories = useCallback(async () => {
    const thisId = ++fetchIdRef.current;
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.getTaxCategories();

      if (thisId !== fetchIdRef.current) return;

      if (response.ok) {
        setCategories(response.data || []);
        setError(null);
      } else {
        throw new Error('Failed to fetch tax categories');
      }
    } catch (err) {
      if (thisId !== fetchIdRef.current) return;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      if (thisId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Create tax category
  const createCategory = useCallback(async (data: TaxCategoryFormData): Promise<TaxCategory | null> => {
    try {
      setError(null);

      const response = await apiService.createTaxCategory(data);

      if (response.ok && response.data) {
        const newCategory = response.data;

        // Optimistic update
        setCategories(prev => [...prev, newCategory]);

        // Refetch to ensure correct order
        await fetchCategories();

        return newCategory;
      } else {
        throw new Error('Failed to create tax category');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tax category';
      setError(errorMessage);
      return null;
    }
  }, [fetchCategories]);

  // Update tax category
  const updateCategory = useCallback(async (id: number, data: TaxCategoryFormData): Promise<TaxCategory | null> => {
    try {
      setError(null);

      const response = await apiService.updateTaxCategory(id, data);

      if (response.ok && response.data) {
        const updatedCategory = response.data;

        // Optimistic update
        setCategories(prev =>
          prev.map(cat => cat.id === id ? updatedCategory : cat)
        );

        return updatedCategory;
      } else {
        throw new Error('Failed to update tax category');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tax category';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Delete tax category
  const deleteCategory = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);

      const response = await apiService.deleteTaxCategory(id);

      if (response.ok) {
        // Optimistic update
        setCategories(prev => prev.filter(cat => cat.id !== id));
        return true;
      } else {
        throw new Error('Failed to delete tax category');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete tax category';
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
