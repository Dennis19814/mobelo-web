/**
 * React Query hooks for Locations management
 * Provides data fetching, caching, and mutations for warehouse/store locations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/lib/api-service'
import toast from 'react-hot-toast'
import type {
  Location,
  LocationFilters,
  CreateLocationDto,
  UpdateLocationDto,
} from '@/types/purchase-order.types'

// Query keys for cache management
export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (filters: LocationFilters) => [...locationKeys.lists(), { filters }] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (id: number) => [...locationKeys.details(), id] as const,
}

/**
 * Hook to fetch all locations with optional filters
 */
export function useLocations(filters?: LocationFilters) {
  return useQuery({
    queryKey: locationKeys.list(filters || {}),
    queryFn: async () => {
      const response = await apiService.getLocations(filters)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to fetch locations')
      }
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

/**
 * Hook to fetch a single location by ID
 */
export function useLocation(id: number | null) {
  return useQuery({
    queryKey: locationKeys.detail(id!),
    queryFn: async () => {
      const response = await apiService.getLocation(id!)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to fetch location')
      }
      return response.data as Location
    },
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to create a new location
 */
export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateLocationDto) => {
      const response = await apiService.createLocation(data)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to create location')
      }
      return response.data as Location
    },
    onSuccess: (data) => {
      // Invalidate and refetch locations list
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() })
      toast.success(`Location "${data.name}" created successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create location')
    },
  })
}

/**
 * Hook to update an existing location
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateLocationDto }) => {
      const response = await apiService.updateLocation(id, data)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to update location')
      }
      return response.data as Location
    },
    onSuccess: (data, variables) => {
      // Invalidate lists and specific location detail
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(variables.id) })
      toast.success(`Location "${data.name}" updated successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update location')
    },
  })
}

/**
 * Hook to delete (soft delete) a location
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiService.deleteLocation(id)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to delete location')
      }
      return response.data
    },
    onSuccess: () => {
      // Invalidate locations list
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() })
      toast.success('Location deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete location')
    },
  })
}

/**
 * Hook to activate a deleted location
 */
export function useActivateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiService.activateLocation(id)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to activate location')
      }
      return response.data as Location
    },
    onSuccess: (data) => {
      // Invalidate lists and specific location detail
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(data.id) })
      toast.success(`Location "${data.name}" activated successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate location')
    },
  })
}

/**
 * Helper hook to get active locations only (for dropdowns)
 */
export function useActiveLocations() {
  return useLocations({ status: 'active', limit: 100 })
}
