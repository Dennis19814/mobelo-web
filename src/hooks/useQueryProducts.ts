import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';

interface Product {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number;
  status: 'draft' | 'active' | 'archived';
  categoryIds: number[];
  // ... other product fields
}

interface ProductsQueryParams {
  appId: number;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Query keys factory for products
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductsQueryParams) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: number) => [...productKeys.details(), id] as const,
};

// Fetch products with caching
export function useProducts(params: ProductsQueryParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: async () => {
      const response = await apiService.getProducts(params);
      return response.data;
    },
    enabled: !!params.appId, // Only run if appId is provided
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
  });
}

// Fetch single product
export function useProduct(id: number, appId: number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const response = await apiService.getProduct(id);
      return response.data;
    },
    enabled: !!id && !!appId,
    staleTime: 5 * 60 * 1000, // Product details stay fresh for 5 minutes
  });
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiService.createProduct(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiService.updateProduct(id, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific product detail
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// Delete product mutation
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiService.deleteProduct(id);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}

// Optimistic update example for quick UI updates
export function useToggleProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiService.updateProduct(id, { status });
      return response.data;
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.detail(id) });

      // Snapshot previous value
      const previousProduct = queryClient.getQueryData(productKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(productKeys.detail(id), (old: any) => ({
        ...old,
        status,
      }));

      return { previousProduct };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(productKeys.detail(variables.id), context.previousProduct);
      }
    },
    onSettled: (data, error, variables) => {
      // Always refetch after success or error
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
}
