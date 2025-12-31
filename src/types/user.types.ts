export enum UserSortBy {
  CREATED_AT = 'created_at',
  LAST_LOGIN = 'last_login',
  TOTAL_ORDERS = 'total_orders',
  TOTAL_SPENT = 'total_spent',
  NAME = 'firstName',
  EMAIL = 'email',
  STATUS = 'status',
}

export enum UserSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum UserFilterStatus {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  UNBLOCKED = 'unblocked',
}

export interface MobileUserSummary {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  countryCode: string;
  isActive: boolean;
  isBlocked: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  totalOrders: number;
  totalSpent: number;
  addressCount: number;
  paymentMethodCount: number;
  blockedAt?: string;
  blockReason?: string;
}

export interface UsersResponse {
  data: MobileUserSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search?: string;
    status?: UserFilterStatus;
    isVerified?: boolean;
    hasOrders?: boolean;
  };
  sort: {
    sortBy: UserSortBy;
    sortOrder: UserSortOrder;
  };
}

export interface UserDetailsResponse extends MobileUserSummary {
  notes?: string;
  loginMethod?: string;
  addresses: Array<{
    id: number;
    addressType: string;
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    // New delivery fields
    houseNumber?: string;
    streetName?: string;
    deliveryNotes?: string;
    landmark?: string;
    usageCount?: number;
  }>;
  paymentMethods: Array<{
    id: number;
    type: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
    stripePaymentMethodId: string;
  }>;
  recentOrders: Array<{
    id: number;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
  sessions: Array<{
    id: number;
    deviceType?: string;
    deviceModel?: string;
    osVersion?: string;
    appVersion?: string;
    isActive: boolean;
    lastActiveAt: string;
    createdAt: string;
  }>;
  blockedByUserId?: number;
  metadata?: Record<string, any>;
}

export interface BlockUserRequest {
  reason: string;
}

export interface UnblockUserRequest {
  note?: string;
}

export interface BlockUserResponse {
  success: boolean;
  message: string;
  blockedAt: string;
  blockedBy?: number;
}

export interface UnblockUserResponse {
  success: boolean;
  message: string;
  unblockedAt: string;
  unblockedBy?: number;
  note?: string;
}