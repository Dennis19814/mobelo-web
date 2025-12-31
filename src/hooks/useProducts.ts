'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { logger } from '@/lib/logger';
import type { Product } from '@/types/product.types';

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: number | string;
  brand?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProductsResponse {
  data: Product[];
  meta?: {
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface UseProductsOptions {
  appId: number;
  filters?: ProductFilters;
  enabled?: boolean;
}

export function useProducts(options: UseProductsOptions) {
  const { appId, filters = {}, enabled = true } = options;
  const queryClient = useQueryClient();

  // Query key includes appId and filters for proper caching
  const queryKey = ['products', appId, filters];

  // Fetch products
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      logger.debug('Fetching products with filters:', filters);

      const response = await apiService.getProducts(filters);

      if (!response.ok || !response.data) {
        const errorMsg = response.data?.message || 'Failed to fetch products';
        logger.error('Failed to fetch products:', { value: errorMsg });
        throw new Error(errorMsg);
      }

      let productsData: Product[] = [];
      let meta;

      if (response.data.data) {
        // Paginated response
        productsData = response.data.data;
        meta = response.data.meta;
      } else if (Array.isArray(response.data)) {
        // Simple array response
        productsData = response.data;
        meta = {
          total: response.data.length,
          page: 1,
          totalPages: 1
        };
      }

      // Extract unique brands from products
      const brandSet = new Set<string>();
      productsData.forEach((product: Product) => {
        if (product.brand && product.brand.trim() !== '') {
          brandSet.add(product.brand);
        }
      });
      const brands = Array.from(brandSet).sort();

      return {
        data: productsData,
        meta,
        brands
      };
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiService.createProduct(productData);
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to create product');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', appId] });
    },
  });

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiService.updateProduct(id, data);
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to update product');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', appId] });
    },
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiService.deleteProduct(id);
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to delete product');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', appId] });
    },
  });

  return {
    products: query.data?.data ?? [],
    brands: query.data?.brands ?? [],
    meta: query.data?.meta,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error?.message || null,
    refetch: query.refetch,
    createProduct: createProduct.mutateAsync,
    updateProduct: updateProduct.mutateAsync,
    deleteProduct: deleteProduct.mutateAsync,
    isCreating: createProduct.isPending,
    isUpdating: updateProduct.isPending,
    isDeleting: deleteProduct.isPending,
  };
}
