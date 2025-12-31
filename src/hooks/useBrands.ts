'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/lib/api-service';
import { logger } from '@/lib/logger';

export interface Brand {
  id: number;
  appId: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  logoUrl?: string;
  website?: string;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
  metadata?: Record<string, any>;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateBrandData {
  name: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
  appId: number;
}

export interface UpdateBrandData {
  name?: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
}

export interface UseBrandsOptions {
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface UseBrandsReturn {
  brands: Brand[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  createBrand: (data: CreateBrandData) => Promise<Brand | null>;
  updateBrand: (id: number, data: UpdateBrandData) => Promise<Brand | null>;
  deleteBrand: (id: number) => Promise<boolean>;
  reorderBrands: (orders: Array<{ id: number; displayOrder: number }>) => Promise<boolean>;
  uploadLogo: (id: number, file: File) => Promise<Brand | null>;
  refetch: () => Promise<void>;
}

export function useBrands(options: UseBrandsOptions = {}): UseBrandsReturn {
  const { search, page = 1, limit = 20, isActive } = options;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch brands
  const fetchBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.getBrands({
        search,
        page: currentPage,
        limit,
        isActive,
      });

      logger.debug('Brands fetched', {
        response: response.ok,
        dataLength: response.data?.data?.length,
        total: response.data?.total
      });

      if (response.ok) {
        setBrands(response.data?.data || []);
        setTotal(response.data?.total || 0);
      } else {
        throw new Error('Failed to fetch brands');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Failed to fetch brands', {
        message: errorMessage,
        search,
        page: currentPage,
        limit,
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, currentPage, limit, isActive]);

  // Initial fetch
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Update page when options change
  useEffect(() => {
    setCurrentPage(page);
  }, [page]);

  // Create brand
  const createBrand = useCallback(async (data: CreateBrandData): Promise<Brand | null> => {
    try {
      setError(null);

      const response = await apiService.createBrand(data);

      if (response.ok && response.data) {
        const newBrand = response.data;

        // Optimistic update
        setBrands(prev => [...prev, newBrand]);
        setTotal(prev => prev + 1);

        // Refetch to ensure order is correct
        await fetchBrands();

        return newBrand;
      } else {
        throw new Error('Failed to create brand');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create brand';
      setError(errorMessage);
      logger.error('Failed to create brand', { message: errorMessage });
      return null;
    }
  }, [fetchBrands]);

  // Update brand
  const updateBrand = useCallback(async (id: number, data: UpdateBrandData): Promise<Brand | null> => {
    try {
      setError(null);

      const response = await apiService.updateBrand(id, data);

      if (response.ok && response.data) {
        const updatedBrand = response.data;

        // Optimistic update
        setBrands(prev =>
          prev.map(brand => brand.id === id ? updatedBrand : brand)
        );

        return updatedBrand;
      } else {
        throw new Error('Failed to update brand');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update brand';
      setError(errorMessage);
      logger.error('Failed to update brand', {
        message: errorMessage,
        brandId: id,
      });

      // Revert optimistic update by refetching
      await fetchBrands();
      return null;
    }
  }, [fetchBrands]);

  // Delete brand
  const deleteBrand = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);

      const response = await apiService.deleteBrand(id);

      if (response.ok) {
        // Optimistic update
        setBrands(prev => prev.filter(brand => brand.id !== id));
        setTotal(prev => prev - 1);
        return true;
      } else {
        throw new Error('Failed to delete brand');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete brand';
      setError(errorMessage);
      logger.error('Failed to delete brand', {
        message: errorMessage,
        brandId: id,
      });

      // Revert optimistic update by refetching
      await fetchBrands();
      return false;
    }
  }, [fetchBrands]);

  // Reorder brands
  const reorderBrands = useCallback(async (orders: Array<{ id: number; displayOrder: number }>): Promise<boolean> => {
    try {
      setError(null);

      const response = await apiService.reorderBrands(orders);

      if (response.ok) {
        // Refetch to get updated order
        await fetchBrands();
        return true;
      } else {
        throw new Error('Failed to reorder brands');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder brands';
      setError(errorMessage);
      logger.error('Failed to reorder brands', { message: errorMessage });
      return false;
    }
  }, [fetchBrands]);

  // Upload logo
  const uploadLogo = useCallback(async (id: number, file: File): Promise<Brand | null> => {
    try {
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiService.uploadBrandLogo(id, formData);

      if (response.ok && response.data) {
        const updatedBrand = response.data;

        // Optimistic update
        setBrands(prev =>
          prev.map(brand => brand.id === id ? updatedBrand : brand)
        );

        return updatedBrand;
      } else {
        throw new Error('Failed to upload logo');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload logo';
      setError(errorMessage);
      logger.error('Failed to upload logo', {
        message: errorMessage,
        brandId: id,
      });
      return null;
    }
  }, []);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchBrands();
  }, [fetchBrands]);

  return {
    brands,
    total,
    page: currentPage,
    limit,
    isLoading,
    error,
    createBrand,
    updateBrand,
    deleteBrand,
    reorderBrands,
    uploadLogo,
    refetch,
  };
}
