/**
 * Analytics TypeScript Types
 * Matches backend DTOs for type safety
 */

export type TimePeriod =
  | 'today'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_month'
  | 'last_month'
  | 'last_90_days'
  | 'last_12_months'
  | 'custom';

export type AnalyticsCategory = 'all' | 'sales' | 'customers' | 'products' | 'carts' | 'reviews';

export interface AnalyticsQuery {
  period?: TimePeriod;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  category?: AnalyticsCategory;
}

export interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  averageOrderValue: number;
  conversionRate?: number; // Percentage
}

export interface CustomerMetrics {
  newCustomers: number;
  returningCustomers: number;
  totalCustomers: number;
  retentionRate?: number; // Percentage
}

export interface ProductMetrics {
  totalProductsSold: number;
  uniqueProductsSold: number;
  averageProductsPerOrder?: number;
}

export interface CartMetrics {
  cartsCreated: number;
  cartsAbandoned: number;
  cartsConverted: number;
  abandonedCartValue: number;
  conversionRate?: number; // Percentage
  abandonmentRate?: number; // Percentage
}

export interface ReviewMetrics {
  totalReviews: number;
  averageRating: number;
}

export interface DailyStatPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  orders: number;
  customers: number;
}

export interface AnalyticsResponse {
  period: string;
  fromDate: string;
  toDate: string;
  category: AnalyticsCategory;
  sales?: SalesMetrics;
  customers?: CustomerMetrics;
  products?: ProductMetrics;
  carts?: CartMetrics;
  reviews?: ReviewMetrics;
  dailyStats?: DailyStatPoint[];
}

export interface DashboardSummary {
  period: string;
  summary: {
    revenue: number;
    orders: number;
    customers: number;
    conversionRate: number;
  };
  charts: DailyStatPoint[];
}
