/**
 * Purchase Order System Type Definitions
 * Includes types for Locations, Suppliers, and Purchase Orders
 */

// ==================== Location Types ====================

export interface Location {
  id: number
  appId: number
  name: string
  address: string
  apartment?: string
  city: string
  country: string
  postalCode: string
  isDefault: boolean
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CreateLocationDto {
  name: string
  address: string
  apartment?: string
  city: string
  country: string
  postalCode: string
  isDefault?: boolean
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> {}

export interface LocationFilters {
  status?: 'active' | 'inactive'
  search?: string
  limit?: number
  offset?: number
}

export interface LocationsResponse {
  status: number
  data: Location[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

// ==================== Supplier Types ====================

export interface Supplier {
  id: number
  appId: number
  company: string
  country: string
  address: string
  apartment?: string
  city: string
  postalCode: string
  contactName: string
  email: string
  phoneNumber: string
  phoneCountryCode: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface CreateSupplierDto {
  company: string
  country: string
  address: string
  apartment?: string
  city: string
  postalCode: string
  contactName: string
  email: string
  phoneNumber: string
  phoneCountryCode: string
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {}

export interface SupplierFilters {
  status?: 'active' | 'inactive'
  search?: string
  limit?: number
  offset?: number
}

export interface SupplierStats {
  supplier: {
    id: number
    company: string
    email: string
  }
  totalPOs: number
  activePOs: number
  totalSpent: number
}

export interface SuppliersResponse {
  status: number
  data: Supplier[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

// ==================== Purchase Order Types ====================

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'closed'

export interface PurchaseOrderItem {
  id: number
  productId?: number
  variantId?: number
  quantity: number
  receivedQuantity: number
  unitCost: number
  taxPercent?: number
  taxAmount?: number
  totalCost: number
  productSnapshot: {
    name: string
    sku?: string
    image?: string
  }
}

export interface PurchaseOrder {
  id: number
  appId: number
  supplierId: number
  supplierSnapshot: {
    company: string
    email: string
    phoneNumber: string
    address: string
    city: string
    country: string
  }
  locationId: number
  locationSnapshot: {
    name: string
    address: string
    city: string
    country: string
  }
  status: PurchaseOrderStatus
  referenceNumber: string
  paymentTerms?: string
  supplierCurrency?: string
  estimatedArrival?: string
  shippingCarrier?: string
  trackingNumber?: string
  noteToSupplier?: string
  tags?: string[]
  subtotal: number
  totalTax: number
  shippingCost?: number
  customsDuties?: number
  otherFees?: number
  total: number
  items: PurchaseOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface CreatePurchaseOrderItemDto {
  productId?: number
  variantId?: number
  quantity: number
  unitCost: number
  taxPercent?: number
}

export interface CreatePurchaseOrderDto {
  supplierId: number
  locationId: number
  referenceNumber: string
  paymentTerms?: string
  supplierCurrency?: string
  estimatedArrival?: string
  shippingCarrier?: string
  trackingNumber?: string
  noteToSupplier?: string
  tags?: string[]
  shippingCost?: number
  customsDuties?: number
  otherFees?: number
  items: CreatePurchaseOrderItemDto[]
}

export interface UpdatePurchaseOrderDto {
  referenceNumber?: string
  estimatedArrival?: string
  shippingCarrier?: string
  trackingNumber?: string
  shippingCost?: number
  customsDuties?: number
  otherFees?: number
  noteToSupplier?: string
  tags?: string[]
}

export interface UpdatePurchaseOrderItemDto {
  quantity?: number
  unitCost?: number
}

export interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus
  supplierId?: number
  locationId?: number
  search?: string
  createdFrom?: string
  createdTo?: string
  limit?: number
  offset?: number
}

export interface PurchaseOrdersResponse {
  status: number
  data: PurchaseOrder[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

// ==================== Receiving Types ====================

export interface PurchaseOrderReceiving {
  id: number
  purchaseOrderId: number
  itemId: number
  receivedQuantity: number
  notes?: string
  createdAt: string
  receivedByUser: {
    id: number
    email: string
    fullName: string
  }
}

export interface ReceiveItemDto {
  itemId: number
  quantity: number
  notes?: string
}

export interface ReceiveItemsDto {
  items: ReceiveItemDto[]
}

export interface ReceivingHistoryResponse {
  status: number
  data: PurchaseOrderReceiving[]
}

// ==================== Incoming Stock Types ====================

export interface ProductIncomingStockPO {
  id: number
  referenceNumber: string
  supplier: string
  expectedQuantity: number
  receivedQuantity: number
  incomingQuantity: number
  estimatedArrival: string
}

export interface ProductIncomingStock {
  product: {
    id: number
    name: string
    sku: string
    inventoryQuantity: number
    incomingStock: number
  }
  totalIncoming: number
  purchaseOrders: ProductIncomingStockPO[]
}

export interface ProductIncomingStockResponse {
  status: number
  data: ProductIncomingStock
}

// ==================== Helper Types ====================

export interface PurchaseOrderProgress {
  totalItems: number
  receivedItems: number
  percentage: number
  isComplete: boolean
}

export interface PurchaseOrderSummary {
  id: number
  referenceNumber: string
  supplierName: string
  locationName: string
  status: PurchaseOrderStatus
  total: number
  estimatedArrival?: string
  progress: PurchaseOrderProgress
  createdAt: string
}
