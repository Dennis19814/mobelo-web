export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
export type ApplicationType = 'entire_order' | 'specific_products' | 'specific_categories' | 'specific_brands';
export type CustomerEligibility = 'all' | 'new_customers' | 'existing_customers' | 'specific_users';
export type CouponStatus = 'active' | 'scheduled' | 'expired' | 'paused' | 'archived';

export interface BuyXGetYConfig {
  buyQuantity: number;
  getQuantity: number;
  getDiscountType: 'free' | 'percentage' | 'fixed';
  getDiscountValue?: number;
  targetProductIds?: number[];
}

export interface TargetScope {
  productIds?: number[];
  categoryIds?: number[];
  brandIds?: number[];
  excludeProductIds?: number[];
  excludeCategoryIds?: number[];
  excludeBrandIds?: number[];
}

export interface Coupon {
  id: number;
  appId: number;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  applicationType: ApplicationType;
  minPurchaseAmount?: number;
  minQuantity?: number;
  maxUsageTotal?: number;
  maxUsagePerUser?: number;
  totalUsageCount: number;
  startDate: string | Date;
  endDate: string | Date;
  targetScope?: TargetScope;
  buyXGetYConfig?: BuyXGetYConfig;
  customerEligibility?: CustomerEligibility;
  specificUserIds?: number[];
  status: CouponStatus;
  isStackable?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date;
}

export interface CreateCouponData {
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  applicationType: ApplicationType;
  minPurchaseAmount?: number;
  minQuantity?: number;
  maxUsageTotal?: number;
  maxUsagePerUser?: number;
  startDate: Date;
  endDate: Date;
  targetScope?: TargetScope;
  buyXGetYConfig?: BuyXGetYConfig;
  customerEligibility?: CustomerEligibility;
  specificUserIds?: number[];
  status?: CouponStatus;
  isStackable?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface UpdateCouponData extends Partial<CreateCouponData> {}

export interface CouponStats {
  totalUses: number;
  totalDiscountGiven: number;
  totalRevenue: number;
  uniqueUsers: number;
  usageByDate: Array<{ date: string; count: number }>;
}

export interface CouponFilters {
  status?: CouponStatus;
  discountType?: DiscountType;
  search?: string;
  page?: number;
  limit?: number;
}
