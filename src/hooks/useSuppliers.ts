/**
 * React Query hooks for Suppliers management
 * Provides data fetching, caching, and mutations for supplier operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/lib/api-service'
import toast from 'react-hot-toast'
import type {
  Supplier,
  SupplierFilters,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierStats,
} from '@/types/purchase-order.types'

// Query keys for cache management
export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: SupplierFilters) => [...supplierKeys.lists(), { filters }] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: number) => [...supplierKeys.details(), id] as const,
  stats: (id: number) => [...supplierKeys.all, 'stats', id] as const,
}

/**
 * Hook to fetch all suppliers with optional filters
 */
export function useSuppliers(filters?: SupplierFilters) {
  return useQuery({
    queryKey: supplierKeys.list(filters || {}),
    queryFn: async () => {
      const response = await apiService.getSuppliers(filters)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to fetch suppliers')
      }
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

/**
 * Hook to fetch a single supplier by ID
 */
export function useSupplier(id: number | null) {
  return useQuery({
    queryKey: supplierKeys.detail(id!),
    queryFn: async () => {
      const response = await apiService.getSupplier(id!)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to fetch supplier')
      }
      return response.data as Supplier
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch supplier statistics
 */
export function useSupplierStats(id: number | null) {
  return useQuery({
    queryKey: supplierKeys.stats(id!),
    queryFn: async () => {
      const response = await apiService.getSupplierStats(id!)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to fetch supplier stats')
      }
      return response.data as SupplierStats
    },
    enabled: id !== null,
    staleTime: 2 * 60 * 1000, // 2 minutes (stats change more frequently)
  })
}

/**
 * Hook to create a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSupplierDto) => {
      const response = await apiService.createSupplier(data)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to create supplier')
      }
      return response.data as Supplier
    },
    onSuccess: (data) => {
      // Invalidate and refetch suppliers list
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      toast.success(`Supplier "${data.company}" created successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create supplier')
    },
  })
}

/**
 * Hook to update an existing supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSupplierDto }) => {
      const response = await apiService.updateSupplier(id, data)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to update supplier')
      }
      return response.data as Supplier
    },
    onSuccess: (data, variables) => {
      // Invalidate lists, specific supplier detail, and stats
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.stats(variables.id) })
      toast.success(`Supplier "${data.company}" updated successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update supplier')
    },
  })
}

/**
 * Hook to deactivate a supplier (soft delete)
 */
export function useDeactivateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiService.deactivateSupplier(id)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to deactivate supplier')
      }
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate suppliers list
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })

      // Show warning if there are active POs
      if (data.warning) {
        toast.success('Supplier deactivated', {
          icon: '⚠️',
          duration: 5000,
        })
        // Show warning message separately
        setTimeout(() => {
          toast(data.warning, { icon: '📦', duration: 5000 })
        }, 500)
      } else {
        toast.success('Supplier deactivated successfully')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate supplier')
    },
  })
}

/**
 * Hook to activate a supplier
 */
export function useActivateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiService.activateSupplier(id)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to activate supplier')
      }
      return response.data as Supplier
    },
    onSuccess: (data) => {
      // Invalidate lists and specific supplier detail
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(data.id) })
      toast.success(`Supplier "${data.company}" activated successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate supplier')
    },
  })
}

/**
 * Helper hook to get active suppliers only (for dropdowns)
 */
export function useActiveSuppliers() {
  return useSuppliers({ status: 'active', limit: 100 })
}
