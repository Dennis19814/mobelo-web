/**
 * React Query hooks for Purchase Orders management
 * Provides data fetching, caching, and mutations for complete PO workflow
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/lib/api-service'
import toast from 'react-hot-toast'
import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceiveItemsDto,
  PurchaseOrderReceiving,
  ProductIncomingStock,
} from '@/types/purchase-order.types'
import { supplierKeys } from './useSuppliers'

// Query keys for cache management
export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (filters: PurchaseOrderFilters) => [...purchaseOrderKeys.lists(), { filters }] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (id: number) => [...purchaseOrderKeys.details(), id] as const,
  receivingHistory: (id: number) => [...purchaseOrderKeys.all, 'receiving-history', id] as const,
  productIncomingStock: (productId: number) => ['product-incoming-stock', productId] as const,
}

/**
 * Hook to fetch all purchase orders with optional filters
 */
export function usePurchaseOrders(filters?: PurchaseOrderFilters) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(filters || {}),
    queryFn: async () => {
      const response = await apiService.getPurchaseOrders(filters)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to fetch purchase orders')
      }
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (POs change frequently)
    retry: 2,
  })
}

/**
 * Hook to fetch a single purchase order by ID
 */
export function usePurchaseOrder(id: number | null) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id!),
    queryFn: async () => {
      const response = await apiService.getPurchaseOrder(id!)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to fetch purchase order')
      }
      return response.data as PurchaseOrder
    },
    enabled: id !== null,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook to fetch receiving history for a purchase order
 */
export function useReceivingHistory(poId: number | null) {
  return useQuery({
    queryKey: purchaseOrderKeys.receivingHistory(poId!),
    queryFn: async () => {
      const response = await apiService.getPurchaseOrderReceivingHistory(poId!)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to fetch receiving history')
      }
      return response.data as PurchaseOrderReceiving[]
    },
    enabled: poId !== null,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch incoming stock details for a product
 */
export function useProductIncomingStock(productId: number | null) {
  return useQuery({
    queryKey: purchaseOrderKeys.productIncomingStock(productId!),
    queryFn: async () => {
      const response = await apiService.getProductIncomingStock(productId!)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to fetch incoming stock')
      }
      return response.data as ProductIncomingStock
    },
    enabled: productId !== null,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook to create a new purchase order
 */
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePurchaseOrderDto) => {
      const response = await apiService.createPurchaseOrder(data)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to create purchase order')
      }
      return response.data as PurchaseOrder
    },
    onSuccess: (data) => {
      // Invalidate PO lists and supplier stats
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: supplierKeys.stats(data.supplierId) })
      toast.success(`Purchase Order ${data.referenceNumber} created successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create purchase order')
    },
  })
}

/**
 * Hook to update an existing purchase order
 */
export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdatePurchaseOrderDto }) => {
      const response = await apiService.updatePurchaseOrder(id, data)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to update purchase order')
      }
      return response.data as PurchaseOrder
    },
    onSuccess: (data, variables) => {
      // Invalidate lists and specific PO detail
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.id) })
      toast.success(`Purchase Order ${data.referenceNumber} updated successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update purchase order')
    },
  })
}

/**
 * Hook to delete a draft purchase order
 */
export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiService.deletePurchaseOrder(id)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to delete purchase order')
      }
      return response.data
    },
    onSuccess: () => {
      // Invalidate PO lists
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      toast.success('Purchase order deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete purchase order')
    },
  })
}

/**
 * Hook to add an item to a purchase order
 */
export function useAddPurchaseOrderItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ poId, data }: {
      poId: number
      data: {
        productId?: number
        variantId?: number
        quantity: number
        unitCost: number
        taxPercent?: number
      }
    }) => {
      const response = await apiService.addPurchaseOrderItem(poId, data)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to add item')
      }
      return response.data as PurchaseOrder
    },
    onSuccess: (data, variables) => {
      // Invalidate lists and specific PO detail
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.poId) })
      toast.success('Item added successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add item')
    },
  })
}

/**
 * Hook to update a purchase order item
 */
export function useUpdatePurchaseOrderItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ poId, itemId, data }: {
      poId: number
      itemId: number
      data: { quantity?: number; unitCost?: number }
    }) => {
      const response = await apiService.updatePurchaseOrderItem(poId, itemId, data)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to update item')
      }
      return response.data as PurchaseOrder
    },
    onSuccess: (data, variables) => {
      // Invalidate lists and specific PO detail
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.poId) })
      toast.success('Item updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update item')
    },
  })
}

/**
 * Hook to remove an item from a purchase order
 */
export function useRemovePurchaseOrderItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ poId, itemId }: { poId: number; itemId: number }) => {
      const response = await apiService.removePurchaseOrderItem(poId, itemId)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to remove item')
      }
      return response.data as PurchaseOrder
    },
    onSuccess: (data, variables) => {
      // Invalidate lists and specific PO detail
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.poId) })
      toast.success('Item removed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove item')
    },
  })
}

/**
 * Hook to mark a purchase order as ordered
 */
export function useMarkPurchaseOrderAsOrdered() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (poId: number) => {
      const response = await apiService.markPurchaseOrderAsOrdered(poId)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to mark as ordered')
      }
      return response.data as PurchaseOrder
    },
    onSuccess: (data) => {
      // Invalidate PO lists, detail, supplier stats, and product incoming stock
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.stats(data.supplierId) })
      // Invalidate all product incoming stock queries
      queryClient.invalidateQueries({ queryKey: ['product-incoming-stock'] })
      toast.success(`Purchase Order ${data.referenceNumber} marked as ordered`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark as ordered')
    },
  })
}

/**
 * Hook to receive items from a purchase order
 */
export function useReceivePurchaseOrderItems() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ poId, data }: { poId: number; data: ReceiveItemsDto }) => {
      const response = await apiService.receivePurchaseOrderItems(poId, data)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to receive items')
      }
      return response.data as PurchaseOrder
    },
    onSuccess: (data, variables) => {
      // Invalidate PO lists, detail, receiving history, supplier stats, product incoming stock, and products
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(variables.poId) })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.receivingHistory(variables.poId) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.stats(data.supplierId) })
      queryClient.invalidateQueries({ queryKey: ['product-incoming-stock'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // Inventory updated
      toast.success('Items received successfully', { icon: '📦' })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to receive items')
    },
  })
}

/**
 * Hook to close a purchase order
 */
export function useClosePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (poId: number) => {
      const response = await apiService.closePurchaseOrder(poId)
      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to close purchase order')
      }
      return response.data as PurchaseOrder
    },
    onSuccess: (data) => {
      // Invalidate PO lists, detail, supplier stats, and product incoming stock
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: supplierKeys.stats(data.supplierId) })
      queryClient.invalidateQueries({ queryKey: ['product-incoming-stock'] })
      toast.success(`Purchase Order ${data.referenceNumber} closed successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to close purchase order')
    },
  })
}

/**
 * Helper hook to get draft purchase orders (for quick access)
 */
export function useDraftPurchaseOrders() {
  return usePurchaseOrders({ status: 'draft', limit: 50 })
}

/**
 * Helper hook to get pending purchase orders (ordered + partial)
 */
export function usePendingPurchaseOrders() {
  // This will need to be called twice or we need to modify the API to support multiple statuses
  // For now, we'll just fetch ordered ones
  return usePurchaseOrders({ status: 'ordered', limit: 50 })
}
