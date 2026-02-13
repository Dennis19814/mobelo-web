// Order Status Types
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type PaymentStatus = 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'failed';

export type FulfillmentStatus = 'pending' | 'prepared' | 'partially_fulfilled' | 'fulfilled' | 'partially_shipped' | 'shipped' | 'delivered';

// Address Interface
export interface Address {
  fullName: string;
  company?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// Tax Line Interface
export interface TaxLine {
  name: string;
  rate: number;
  amount: number;
}

// Order Item Interface
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  variantId?: number;
  productName: string;
  productSku?: string;
  productSnapshot?: Record<string, any>;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  fulfilledQuantity: number;
  refundedQuantity: number;
  refundedAmount: number;
  notes?: string;
  customization?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string | Date;
  updatedAt: string | Date;
  // Relations
  product?: {
    id: number;
    name: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    shortDescription?: string;
  };
  variant?: {
    id: number;
    name: string;
    option1Value?: string;
    option2Value?: string;
  };
}

// Order Payment Interface
export interface OrderPayment {
  id: number;
  orderId: number;
  paymentMethod: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentDetails?: {
    cardBrand?: string;
    cardLast4?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Order Status History Interface
export interface OrderStatusHistory {
  id: number;
  orderId: number;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  notes?: string;
  createdBy?: string;
  createdAt: string | Date;
}

// Mobile User Interface (for order customer)
export interface OrderCustomer {
  id: number;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

// Main Order Interface
export interface Order {
  id: number;
  appId: number;
  mobileUserId: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  totalPaid: number;
  totalRefunded: number;
  totalWeight: number;
  weightUnit: 'kg' | 'lb' | 'oz' | 'g';
  couponCode?: string;
  couponDiscount: number;
  shippingAddress?: Address;
  billingAddress?: Address;
  shippingMethod?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  customerNotes?: string;
  internalNotes?: string;
  cancelReason?: string;
  refundReason?: string;
  cancelledAt?: string | Date | null;
  confirmedAt?: string | Date | null;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  estimatedDeliveryAt?: string | Date | null;
  taxLines?: TaxLine[];
  metadata?: Record<string, any>;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Relations
  items?: OrderItem[];
  mobileUser?: OrderCustomer;
  statusHistory?: OrderStatusHistory[];
  payments?: OrderPayment[];
}

// Order Filters for List API
export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  search?: string; // For order number, customer name, email
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'createdAt' | 'total' | 'orderNumber';
  sortOrder?: 'ASC' | 'DESC';
}

// Order List Response
export interface OrdersListResponse {
  data: Order[];
  meta?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

// Cancel Order DTO
export interface CancelOrderData {
  reason: string;
}

// Refund Order DTO
export interface RefundOrderData {
  amount?: number; // If not provided, full refund
  reason: string;
}

// Update Order Status DTO
export interface UpdateOrderStatusData {
  status: OrderStatus;
}

// Update Payment Status DTO
export interface UpdatePaymentStatusData {
  paymentStatus: PaymentStatus;
}

// Update Fulfillment Status DTO
export interface UpdateFulfillmentStatusData {
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryAt?: string;
}

// Order Stats (for dashboard cards)
export interface OrderStats {
  // Order Status
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;

  // Payment Status
  paymentPending: number;
  paymentAuthorized: number;
  paymentPaid: number;
  paymentPartiallyPaid: number;
  paymentPartiallyRefunded: number;
  paymentRefunded: number;
  paymentFailed: number;

  // Fulfillment Status
  fulfillmentPending: number;
  fulfillmentPartiallyFulfilled: number;
  fulfillmentFulfilled: number;
  fulfillmentPartiallyShipped: number;
  fulfillmentShipped: number;
  fulfillmentDelivered: number;

  total: number;
}

// ==================== Shipping Calculation (Mobile App) ====================

// Cart item for shipping calculation
export interface ShippingCalculationItem {
  productId: number;
  quantity: number;
  variantId?: number;
}

// Shipping address for calculation
export interface ShippingCalculationAddress {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
}

// Request to calculate shipping options
export interface ShippingCalculationRequest {
  items: ShippingCalculationItem[];
  shippingAddress: ShippingCalculationAddress;
}

// Individual shipping option returned by calculation
export interface ShippingOption {
  id: number;
  name: string;
  method: 'flat_rate' | 'weight_based' | 'price_based' | 'free' | 'pickup';
  cost: number;
  deliveryMinDays?: number;
  deliveryMaxDays?: number;
  description?: string;
  isTaxable?: boolean;
}

// Order summary information for shipping calculation
export interface ShippingOrderSummary {
  subtotal: number;
  totalWeight: number;
  weightUnit: 'kg' | 'lb' | 'oz' | 'g';
  itemCount: number;
}

// Response from shipping calculation
export interface ShippingCalculationResponse {
  shippingOptions: ShippingOption[];
  orderSummary: ShippingOrderSummary;
  canShip: boolean;
  message?: string;
}
