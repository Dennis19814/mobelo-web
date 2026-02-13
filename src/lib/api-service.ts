/**
 * Simplified API Service using Unified HTTP Client
 * Replaces the complex 760+ line api-client.ts with focused service methods
 */

import { httpClient } from '@/lib/http-client';
import { Category, CreateCategoryData, UpdateCategoryData, CategoryReorderData } from '@/types/category';
import { PlanKey, BillingCycle } from '@/lib/plans';

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

class ApiService {
  // Billing (Platform-level)
  async createSubscriptionIntent(payload: { plan: Exclude<PlanKey, 'trial'>; billing: BillingCycle; coupon?: string; company?: { name?: string; taxId?: string; addressLine1?: string; city?: string; country?: string } }): Promise<ApiResponse<{ clientSecret: string; subscriptionId: string; customerId: string; isUpgrade?: boolean; prorationDetails?: { proratedAmount: number; currency: string; currentPlan: string; currentBilling: string; newPlan: string; newBilling: string; nextBillingDate: string; nextBillingAmount: number } }>> {
    const response = await httpClient.post('/v1/billing/create-subscription', payload)
    return { ok: response.ok, status: response.status, data: response.data }
  }

  async createSetupIntent(): Promise<ApiResponse<{ clientSecret: string }>> {
    const response = await httpClient.post('/v1/billing/create-setup-intent')
    return { ok: response.ok, status: response.status, data: response.data }
  }

  async attachPaymentMethod(params: { setupIntentId: string }): Promise<ApiResponse<{ success: boolean; message?: string }>> {
    const response = await httpClient.post('/v1/billing/attach-payment-method', params)
    return { ok: response.ok, status: response.status, data: response.data }
  }

  async getInvoices(page: number = 1, limit: number = 10): Promise<ApiResponse<{ data: { id: string; number: string; date: string; amount: number; currency: string; status: string; pdfUrl?: string }[]; total: number }>> {
    const response = await httpClient.get(`/v1/billing/invoices?page=${page}&limit=${limit}`)
    return { ok: response.ok, status: response.status, data: response.data }
  }

  async validateCoupon(code: string, plan: Exclude<PlanKey, 'trial'>, billing: BillingCycle): Promise<ApiResponse<{ valid: boolean; percentOff?: number; reason?: string }>> {
    const response = await httpClient.post('/v1/billing/coupons/validate', { code, plan, billing })
    return { ok: response.ok, status: response.status, data: response.data }
  }

  async schedulePlanChange(targetPlan: PlanKey, targetBilling: BillingCycle): Promise<ApiResponse<{ effectiveDate: string }>> {
    const response = await httpClient.post('/v1/billing/schedule-change', { targetPlan, targetBilling })
    return { ok: response.ok, status: response.status, data: response.data }
  }

  async cancelScheduledPlanChange(): Promise<ApiResponse<{ cancelled: boolean }>> {
    const response = await httpClient.post('/v1/billing/cancel-scheduled-change')
    return { ok: response.ok, status: response.status, data: response.data }
  }

  async getScheduledPlanChange(): Promise<ApiResponse<{ targetPlan: PlanKey; targetBilling: BillingCycle; effectiveDate: string } | null>> {
    const response = await httpClient.get('/v1/billing/scheduled-change')
    return { ok: response.ok, status: response.status, data: response.data }
  }

  async getSubscription(): Promise<ApiResponse<{ plan: PlanKey; billing: BillingCycle; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; trialEnd: string | null }>> {
    const response = await httpClient.get('/v1/billing/subscription')
    return { ok: response.ok, status: response.status, data: response.data }
  }

  async getBillingDiagnostics(): Promise<ApiResponse<{ accountId?: string; accountEmail?: string; checks?: Record<string, { ok: boolean; priceId?: string; error?: string }> }>> {
    const response = await httpClient.get('/v1/billing/diagnostics')
    return { ok: response.ok, status: response.status, data: response.data }
  }
  // Authentication
  async login(email: string): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/platform/auth/login', { email });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async verifyOtp(email: string, otpCode: string): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/platform/auth/verify-otp', { email, code: otpCode });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async resendOtp(email: string): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/platform/auth/resend-otp', { email });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async logout(): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/platform/auth/logout');
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getApiKeys(): Promise<ApiResponse> {
    const response = await httpClient.get('/v1/platform/auth/api-keys', { timeout: 5000 });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Apps
  async getApps(): Promise<ApiResponse> {
    const response = await httpClient.get('/v1/platform/apps', { cancelKey: 'getApps', timeout: 15000 });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getApp(appId: string | number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/platform/apps/${appId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Public: get minimal app summary (id + app_name)
  async getPublicAppSummary(appId: string | number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/public/apps/${appId}/summary`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async createApp(appData: any): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/platform/apps', appData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async createAppWithSpec(appIdea: string, specData: any, customizations?: any): Promise<ApiResponse<{ appId: number; jobId: number; appName: string; status: string }>> {
    const response = await httpClient.post('/v1/platform/apps/with-spec', { appIdea, specData, customizations });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateApp(appId: number, data: { app_name?: string; app_idea?: string; status?: string; showAppNameWithLogo?: boolean; splashTagline?: string; splashDescription?: string }): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/platform/apps/${appId}`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async uploadAppLogo(appId: number, file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await httpClient.post(`/v1/platform/apps/${appId}/logo`, formData, {
      headers: {
        // Don't set Content-Type, let the browser set it with boundary
      },
      timeout: 60000, // 60 seconds for upload
    });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async deleteAppLogo(appId: number): Promise<ApiResponse> {
    console.log(`[API-SERVICE] deleteAppLogo called for appId=${appId}`);
    const response = await httpClient.delete(`/v1/platform/apps/${appId}/logo`);
    console.log(`[API-SERVICE] deleteAppLogo response:`, { ok: response.ok, status: response.status, dataPreview: typeof response.data === 'object' ? { logoUrl: response.data?.logoUrl, hasLogoMetadata: !!response.data?.logoMetadata } : String(response.data).slice(0, 200) });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async uploadAppSplash(appId: number, file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('splash', file);

    const response = await httpClient.post(`/v1/platform/apps/${appId}/splash`, formData, {
      headers: {
        // Don't set Content-Type, let the browser set it with boundary
      },
      timeout: 60000,
    });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async deleteAppSplash(appId: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/platform/apps/${appId}/splash`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async savePlayStoreSettings(appId: number, payload: any): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/platform/apps/${appId}/play-settings`, payload);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async triggerPlayPublish(appId: number, payload: any): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/platform/apps/${appId}/play-publish`, payload);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async cancelPlayPublish(appId: number, jobId: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/platform/apps/${appId}/play-publish/${jobId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async triggerAppStorePublish(appId: number, payload: any): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/platform/apps/${appId}/appstore-publish`, payload);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async cancelAppStorePublish(appId: number, jobId: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/platform/apps/${appId}/appstore-publish/${jobId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async deleteApp(appId: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/platform/apps/${appId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateBannerJson(appId: number, bannerJson: Array<{
    id: string;
    title: string;
    subtitle: string;
    buttonText: string;
    badge?: string;
    limitedTime: boolean;
    backgroundColor: string;
    textColor: string;
  }>): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/platform/apps/${appId}/banner`, { bannerJson });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get Expo development server status
   * Returns port, QR code, web URL, started timestamp, and folder path
   */
  async getExpoStatus(appId: number): Promise<{
    port: number | null;
    qrCode: string | null;
    webUrl: string | null;
    startedAt: string | null;
    folderPath: string | null;
  }> {
    const response = await httpClient.get(`/v1/platform/apps/${appId}/expo-status`);
    return response.data;
  }

  /**
   * Restart Expo development server
   * Queues a restart job that will stop and restart the app on the same port
   */
  async restartApp(appId: number, signal?: AbortSignal): Promise<{ message: string; jobId: string | number }> {
    const response = await httpClient.post(`/v1/platform/apps/${appId}/restart`, {}, { signal });
    return response.data;
  }

  /**
   * Reload Expo app
   * Sends 'r' command to Expo CLI for fast reload without restart
   * Maintains same connection, QR code, and URL
   */
  async reloadApp(appId: number, signal?: AbortSignal): Promise<{ message: string; jobId: string | number }> {
    const response = await httpClient.post(`/v1/platform/apps/${appId}/reload`, {}, { signal });
    return response.data;
  }

  // Categories
  async getCategories(options: {
    hierarchy?: boolean;
    rootOnly?: boolean;
  } = {}): Promise<ApiResponse<Category[]>> {
    const params = new URLSearchParams();
    if (options.hierarchy !== undefined) params.append('hierarchy', String(options.hierarchy));
    if (options.rootOnly !== undefined) params.append('rootOnly', String(options.rootOnly));

    const queryString = params.toString();
    const url = queryString ? `/v1/merchant/products/categories?${queryString}` : `/v1/merchant/products/categories`;

    const response = await httpClient.get(url, { cancelKey: 'getCategories' });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getCategory(id: number, appId?: number): Promise<ApiResponse<Category>> {
    const params = new URLSearchParams();
    if (appId) params.append('appId', String(appId));

    const queryString = params.toString();
    const url = queryString ? `/v1/merchant/categories/single/${id}?${queryString}` : `/v1/merchant/categories/single/${id}`;

    const response = await httpClient.get(url);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async createCategory(categoryData: CreateCategoryData): Promise<ApiResponse<Category>> {
    const response = await httpClient.post('/v1/merchant/categories', categoryData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateCategory(id: number, categoryData: UpdateCategoryData, appId?: number): Promise<ApiResponse<Category>> {
    const params = new URLSearchParams();
    if (appId) params.append('appId', String(appId));

    const queryString = params.toString();
    const url = queryString ? `/v1/merchant/categories/${id}?${queryString}` : `/v1/merchant/categories/${id}`;

    const response = await httpClient.patch(url, categoryData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async deleteCategory(id: number, appId?: number): Promise<ApiResponse<void>> {
    const params = new URLSearchParams();
    if (appId) params.append('appId', String(appId));

    const queryString = params.toString();
    const url = queryString ? `/v1/merchant/categories/${id}?${queryString}` : `/v1/merchant/categories/${id}`;

    const response = await httpClient.delete(url);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async reorderCategories(appId: number, categoryOrders: CategoryReorderData[]): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/categories/reorder?appId=${appId}`, categoryOrders);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async uploadCategoryImage(categoryId: number, file: File, appId: number): Promise<ApiResponse<Category>> {
    console.log('[API-SERVICE-DEBUG] uploadCategoryImage called', {
      categoryId,
      appId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const formData = new FormData();
    formData.append('image', file);

    console.log('[API-SERVICE-DEBUG] Sending POST request to:', `/v1/merchant/categories/${categoryId}/upload-image?appId=${appId}`);

    const response = await httpClient.post(`/v1/merchant/categories/${categoryId}/upload-image?appId=${appId}`, formData, {
      headers: {
        // Don't set Content-Type, let the browser set it with boundary
      },
      timeout: 60000, // 60 seconds for upload
    });

    console.log('[API-SERVICE-DEBUG] Upload response received', {
      ok: response.ok,
      status: response.status,
      hasData: !!response.data,
      dataKeys: response.data ? Object.keys(response.data) : [],
      iconUrl: response.data?.iconUrl,
      imageUrl: response.data?.imageUrl,
      displayType: response.data?.displayType
    });

    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Products
  async getProducts(query?: Record<string, any>, cancelKey?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/v1/merchant/products?${queryString}` : '/v1/merchant/products';

    const response = await httpClient.get(url, cancelKey ? { cancelKey } : {});
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Mobile-optimized products list (does not require staff product permissions)
  async getMobileProductList(query?: Record<string, any>): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/v1/merchant/products/mobile/list?${queryString}`
      : '/v1/merchant/products/mobile/list';

    const response = await httpClient.get(url, { cancelKey: 'getMobileProducts' });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getProduct(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/products/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async createProduct(productData: any): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/products', productData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateProduct(id: number, productData: any): Promise<ApiResponse> {
    console.log(`[API-SERVICE] updateProduct called for ID: ${id}`);
    console.log(`[API-SERVICE] Product data:`, JSON.stringify(productData).substring(0, 500));

    // Increase timeout for product updates (especially with variants/media)
    const response = await httpClient.put(`/v1/merchant/products/${id}`, productData, {
      timeout: 180000  // 180 seconds for product updates
    });

    console.log(`[API-SERVICE] updateProduct response:`, { ok: response.ok, status: response.status });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async deleteProduct(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/products/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Product Media
  async uploadProductMedia(productId: number, formData: FormData): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/products/${productId}/media/upload`, formData, {
      timeout: 60000, // 60 second timeout for file uploads
    });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async deleteProductMedia(productId: number, mediaId: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/products/${productId}/media/${mediaId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Brands
  async getBrands(params?: {
    search?: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));

    const queryString = queryParams.toString();
    const url = queryString ? `/v1/merchant/brands?${queryString}` : '/v1/merchant/brands';

    const response = await httpClient.get(url);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getBrand(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/brands/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async createBrand(brandData: any): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/brands', brandData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateBrand(id: number, brandData: any): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/brands/${id}`, brandData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async deleteBrand(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/brands/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async reorderBrands(brandOrders: Array<{ id: number; displayOrder: number }>): Promise<ApiResponse> {
    const response = await httpClient.patch('/v1/merchant/brands/reorder', { brands: brandOrders });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async uploadBrandLogo(id: number, formData: FormData): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/brands/${id}/logo`, formData, {
      timeout: 60000, // 60 second timeout for file uploads
    });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Orders
  async getOrders(query?: Record<string, any>, cancelKey?: string): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/v1/merchant/orders?${queryString}` : '/v1/merchant/orders';

    const response = await httpClient.get(url, cancelKey ? { cancelKey } : {});
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getOrder(orderId: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/orders/${orderId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getOrderByNumber(orderNumber: string): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/orders/by-number/${orderNumber}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateOrderStatus(orderId: number, status: string): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/orders/${orderId}/status`, { status });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updatePaymentStatus(orderId: number, paymentStatus: string): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/orders/${orderId}/payment-status`, { paymentStatus });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateFulfillmentStatus(orderId: number, fulfillmentStatus: string): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/orders/${orderId}/fulfillment-status`, { fulfillmentStatus });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async cancelOrder(orderId: number, reason: string): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/orders/${orderId}/cancel`, { reason });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateDeliveryStatus(orderId: number, data: {
    fulfillmentStatus: string;
    trackingNumber?: string;
    trackingUrl?: string;
    estimatedDeliveryAt?: string;
  }): Promise<ApiResponse> {
    const response = await httpClient.put(`/v1/merchant/orders/${orderId}/fulfillment`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async refundOrder(orderId: number, data: any): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/orders/${orderId}/refund`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Product Reviews
  async getProductReviews(productId: number, query?: Record<string, any>): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString
      ? `/v1/merchant/products/${productId}/reviews?${queryString}`
      : `/v1/merchant/products/${productId}/reviews`;

    const response = await httpClient.get(url);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async addMerchantResponse(productId: number, reviewId: number, responseData: any): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/products/${productId}/reviews/${reviewId}/merchant-response`, responseData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Special Features
  async getFeatures(appIdea: string): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/platform/app-generation/features', { appIdea });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async analyzeAppIdeaBreakDown(appIdea: string): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/platform/templates/app-idea-breakdown', { appIdea });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get AI-generated app specification based on user prompt
   *
   * This endpoint uses OpenAI GPT-4o to analyze the app idea and match it
   * with the best vertical template from the database.
   *
   * Performance characteristics:
   * - Average response time: 15-40 seconds (OpenAI processing + caching)
   * - Maximum response time: 60 seconds (95th percentile)
   * - Timeout: 180 seconds (to handle slow OpenAI responses, matches proxy)
   * - Caching: Backend caches vertical/theme data for 10 minutes
   *
   * Rate limiting:
   * - Uses x-session-id for per-user rate limiting
   * - Session ID stored in localStorage
   * - Prevents abuse while allowing legitimate retries
   * - Anonymous users: Lower limits
   * - Authenticated users: Higher limits (via JWT)
   *
   * Request flow:
   * 1. Frontend generates/retrieves session ID
   * 2. Sends prompt to backend via proxy
   * 3. Backend queries cache (10 min) or DB
   * 4. Backend calls OpenAI GPT-4o (40-60s)
   * 5. Backend logs cost to database
   * 6. Frontend receives result
   *
   * @param prompt - User's app idea description (max 2000 characters)
   * @returns App specification with vertical match, themes, and design recommendations
   * @throws {Error} If OpenAI API fails, timeout exceeded, or validation fails
   *
   * @example
   * const result = await apiService.getAppSpec("build app selling sunglasses");
   * if (result.ok) {
   *   console.log(result.data.best.verticalName); // "fashion-retail"
   *   console.log(result.data.theme.colors.primary); // "#4A5C6A"
   * }
   */
  async getAppSpec(prompt: string): Promise<ApiResponse> {
    // Ensure we include a per-user session id for rate-limiting
    let sessionId: string | null = null;
    try {
      sessionId = localStorage.getItem('x_session_id');
      if (!sessionId) {
        const rand = Math.random().toString(36).slice(2, 10);
        sessionId = `sess_${Date.now().toString(36)}_${rand}`;
        localStorage.setItem('x_session_id', sessionId);
      }
    } catch {
      // Best-effort only; backend will fall back to IP-based throttling
    }

    const response = await httpClient.post('/v1/public/getAppSpec', { prompt }, {
      headers: sessionId ? { 'x-session-id': sessionId } : undefined,
      // CRITICAL: Timeout must match proxy timeout (180s) to prevent premature client-side cancellation
      // OpenAI takes 40-60s, proxy waits 180s, so client must wait at least 180s
      timeout: 180000, // 180 seconds - matches proxy timeout, handles slow OpenAI responses
      cancelKey: 'getAppSpec', // Prevent duplicate requests from React Strict Mode
    });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Additional Product Media Methods
  async setProductMediaAsThumbnail(productId: number, mediaId: number): Promise<ApiResponse> {
    const response = await httpClient.put(`/v1/merchant/products/${productId}/media/${mediaId}/listing-thumbnail`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async setProductMediaAsDetailThumbnail(productId: number, mediaId: number): Promise<ApiResponse> {
    const response = await httpClient.put(`/v1/merchant/products/${productId}/media/${mediaId}/detail-thumbnail`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getProductMedia(productId: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/products/${productId}/media`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getProductCategories(): Promise<ApiResponse> {
    const response = await httpClient.get('/v1/merchant/products/categories');
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Additional Category Methods
  async refreshCategoryProductCount(id: number): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/categories/${id}/refresh-count`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Additional Order Methods
  async modifyOrderItems(orderId: number, modifications: any): Promise<ApiResponse> {
    const response = await httpClient.put(`/v1/merchant/orders/${orderId}/items`, modifications);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Tax Categories
  async getTaxCategories(): Promise<ApiResponse> {
    const response = await httpClient.get('/v1/merchant/tax-categories');
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getTaxCategory(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/tax-categories/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async createTaxCategory(categoryData: any): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/tax-categories', categoryData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateTaxCategory(id: number, categoryData: any): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/tax-categories/${id}`, categoryData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async deleteTaxCategory(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/tax-categories/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getProductsForTaxCategory(categoryId?: number): Promise<ApiResponse> {
    const url = categoryId
      ? `/v1/merchant/tax-categories/${categoryId}/products`
      : '/v1/merchant/tax-categories/available-products';
    const response = await httpClient.get(url);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Tax Rules
  async getTaxRules(params?: Record<string, any>): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/v1/merchant/tax-rules?${queryString}` : '/v1/merchant/tax-rules';

    const response = await httpClient.get(url);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getTaxRule(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/tax-rules/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async createTaxRule(ruleData: any): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/tax-rules', ruleData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateTaxRule(id: number, ruleData: any): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/tax-rules/${id}`, ruleData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async deleteTaxRule(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/tax-rules/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getTaxOptions(): Promise<ApiResponse> {
    const response = await httpClient.get('/v1/merchant/tax-rules/options/metadata');
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async calculateTax(calculationData: any): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/tax-rules/calculate', calculationData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Coupons
  async getCoupons(query?: Record<string, any>): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/v1/merchant/coupons?${queryString}` : '/v1/merchant/coupons';

    const response = await httpClient.get(url);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getCoupon(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/coupons/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async createCoupon(couponData: any): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/coupons', couponData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async updateCoupon(id: number, couponData: any): Promise<ApiResponse> {
    try {
      const response = await httpClient.patch(`/v1/merchant/coupons/${id}`, couponData, { timeout: 90000 });
      return { ok: response.ok, status: response.status, data: response.data };
    } catch (error: any) {
      console.error(`[apiService.updateCoupon] Failed to update coupon ${id}:`, error);
      throw error;
    }
  }

  async deleteCoupon(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/coupons/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getCouponStats(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/coupons/${id}/stats`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getActiveCoupons(): Promise<ApiResponse> {
    const response = await httpClient.get('/v1/merchant/coupons/active');
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async getExpiringCoupons(days: number = 7): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/coupons/expiring?days=${days}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  async bulkUpdateCouponStatus(couponIds: number[], status: string): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/coupons/bulk/update-status', { couponIds, status });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Generic GET method for flexibility
  async get(endpoint: string): Promise<ApiResponse> {
    const response = await httpClient.get(endpoint);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // ============================================
  // MERCHANT STAFF AUTHENTICATION & MANAGEMENT
  // ============================================

  /**
   * Send OTP to staff member
   * @param data - { appIdentifier: string, identifier: string (email or phone) }
   */
  async sendStaffOtp(data: { appIdentifier: string; identifier: string }): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/staff-auth/send-otp', data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Verify staff OTP and get JWT tokens
   * @param data - { appIdentifier: string, identifier: string, code: string }
   */
  async verifyStaffOtp(data: { appIdentifier: string; identifier: string; code: string }): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/staff-auth/verify-otp', data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Invite new staff member (requires platform user authentication)
   * @param data - { appId: number, email?: string, phone?: string, firstName: string, lastName: string, role: string }
   */
  async inviteStaff(data: {
    appId: number;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    role: string;
    notes?: string;
  }): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/staff', data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get all staff members for an app (requires staff authentication)
   * @param filters - { role?: string, status?: string, search?: string, page?: number, limit?: number }
   */
  async getStaffMembers(filters?: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (filters?.role) queryParams.append('role', filters.role);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const query = queryParams.toString();
    const endpoint = query ? `/v1/merchant/staff?${query}` : '/v1/merchant/staff';

    const response = await httpClient.get(endpoint, { cancelKey: 'getStaffMembers', timeout: 30000 });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get staff member by ID (requires staff authentication)
   */
  async getStaffMember(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/staff/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update staff member (requires staff authentication with edit permission)
   * @param id - Staff member ID
   * @param data - { firstName?: string, lastName?: string, role?: string, status?: string, notes?: string }
   */
  async updateStaffMember(id: number, data: {
    firstName?: string;
    lastName?: string;
    role?: string;
    status?: string;
    notes?: string;
  }): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/staff/${id}`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Suspend staff member (requires staff authentication with edit permission)
   */
  async suspendStaffMember(id: number): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/staff/${id}/suspend`, {});
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Reactivate staff member (requires staff authentication with edit permission)
   */
  async reactivateStaffMember(id: number): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/staff/${id}/reactivate`, {});
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Remove staff member (requires staff authentication with remove permission)
   */
  async removeStaffMember(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/staff/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get all available staff roles with permissions
   */
  async getStaffRoles(): Promise<ApiResponse> {
    const response = await httpClient.get('/v1/merchant/staff/roles');
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get a single staff role by name
   */
  async getStaffRole(role: string): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/staff/roles/${role}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Create a new custom staff role (requires staff create permission)
   */
  async createStaffRole(roleData: { role: string; permissions: Record<string, any> }): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/staff/roles', roleData);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update staff role permissions (requires staff edit permission)
   */
  async updateStaffRolePermissions(role: string, permissions: Record<string, any>): Promise<ApiResponse> {
    const response = await httpClient.put(`/v1/merchant/staff/roles/${role}`, { permissions });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Delete a custom staff role (requires staff delete permission)
   */
  async deleteStaffRole(role: string): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/staff/roles/${role}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // ========================================
  // Analytics
  // ========================================

  /**
   * Get analytics data with flexible filters
   * @param params - Query parameters for analytics
   * @param params.period - Time period preset (today, last_7_days, last_30_days, etc.)
   * @param params.fromDate - Custom start date (YYYY-MM-DD) when period=custom
   * @param params.toDate - Custom end date (YYYY-MM-DD) when period=custom
   * @param params.category - Category filter (all, sales, customers, products, carts, reviews)
   */
  async getAnalytics(params: {
    period?: 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'last_90_days' | 'last_12_months' | 'custom';
    fromDate?: string;
    toDate?: string;
    category?: 'all' | 'sales' | 'customers' | 'products' | 'carts' | 'reviews';
  } = {}): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();

    if (params.period) queryParams.append('period', params.period);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    if (params.category) queryParams.append('category', params.category);

    const queryString = queryParams.toString();
    const url = queryString ? `/v1/merchant/analytics?${queryString}` : '/v1/merchant/analytics';

    const response = await httpClient.get(url, { cancelKey: 'getAnalytics', timeout: 30000 });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get dashboard summary (last 30 days, all categories)
   * Convenience method for quick dashboard overview
   */
  async getAnalyticsSummary(): Promise<ApiResponse> {
    const response = await httpClient.get('/v1/merchant/analytics/summary', { cancelKey: 'getAnalyticsSummary', timeout: 30000 });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // ==================== System Templates ====================
  /**
   * Get all system templates for a specific app (Platform owner access)
   * Returns email and SMS OTP templates
   */
  async getSystemTemplates(appId: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/platform/apps/${appId}/system-templates`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get a specific system template by ID (Platform owner access)
   */
  async getSystemTemplate(appId: number, templateId: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/platform/apps/${appId}/system-templates/${templateId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update a system template (Platform owner access)
   * Can update content, subject, HTML content, etc.
   */
  async updateSystemTemplate(appId: number, templateId: number, data: {
    name?: string;
    subject?: string | null;
    content?: string;
    contentHtml?: string | null;
    availableVariables?: string[];
    isActive?: boolean;
  }): Promise<ApiResponse> {
    const response = await httpClient.put(`/v1/platform/apps/${appId}/system-templates/${templateId}`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Preview a template with test data (Platform owner access)
   * Returns rendered template with variables replaced
   */
  async previewSystemTemplate(appId: number, templateId: number, variables?: Record<string, string>): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/platform/apps/${appId}/system-templates/${templateId}/preview`, { variables });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Legal Documents
  /**
   * Get a specific legal document by type
   */
  async getLegalDocument(appId: number, documentType: 'terms_and_conditions' | 'privacy_policy'): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/platform/apps/${appId}/legal-documents/${documentType}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get all legal documents for an app
   */
  async getAllLegalDocuments(appId: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/platform/apps/${appId}/legal-documents`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Create or update a legal document (upsert)
   */
  async upsertLegalDocument(appId: number, data: { documentType: string; content: string }): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/platform/apps/${appId}/legal-documents`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update an existing legal document
   */
  async updateLegalDocument(appId: number, documentType: 'terms_and_conditions' | 'privacy_policy', content: string): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/platform/apps/${appId}/legal-documents/${documentType}`, { content });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // =============== Download Jobs ===============
  /**
   * Get latest download job for app
   */
  async getLatestDownloadJob(appId: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/platform/apps/${appId}/download-jobs/latest`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Request new source download
   */
  async requestSourceDownload(appId: number): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/platform/apps/${appId}/download-source`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // =============== Social Auth (Google) ===============
  async getGoogleAuthInit(redirectUri: string, state: string): Promise<ApiResponse> {
    const params = new URLSearchParams({ provider: 'google', redirect_uri: redirectUri });
    if (state) params.set('state', state);
    const response = await httpClient.get(`/v1/platform/auth/social/init?${params.toString()}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Hero Images
  /**
   * Upload hero images for an app (merchant access)
   * Max 10 images per upload, max 10 total per app
   */
  async uploadHeroImages(appId: number, files: File[]): Promise<ApiResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await httpClient.post(`/v1/merchant/settings/hero-images/upload?appId=${appId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get all hero images for an app
   */
  async getHeroImages(appId: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/settings/hero-images/${appId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update a hero image (display order or active status)
   */
  async updateHeroImage(id: number, appId: number, data: { displayOrder?: number; isActive?: boolean }): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/settings/hero-images/${id}?appId=${appId}`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Delete a hero image (soft delete)
   */
  async deleteHeroImage(id: number, appId: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/settings/hero-images/${id}?appId=${appId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Reorder hero images
   */
  async reorderHeroImages(appId: number, orders: Array<{ id: number; displayOrder: number }>): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/settings/hero-images/reorder?appId=${appId}`, { orders });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // Content Generation
  /**
   * Get latest content generation job for an app (includes progress history)
   */
  async getContentGenerationJobByApp(appId: number): Promise<ApiResponse<{
    id: number;
    appId: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    currentStep?: string;
    progress: number;
    errorMessage?: string;
    progressHistory?: Array<{
      step: string;
      progress: number;
      message: string;
      timestamp: string;
    }>;
    createdAt: string;
    updatedAt: string;
  } | null>> {
    const response = await httpClient.get(`/v1/admin/content-generation/jobs/by-app/${appId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // ==================== Locations API ====================
  /**
   * Get all locations for the current app
   */
  async getLocations(filters?: {
    status?: 'active' | 'inactive';
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const url = queryString ? `/v1/merchant/locations?${queryString}` : '/v1/merchant/locations';

    const response = await httpClient.get(url, { cancelKey: 'getLocations' });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get a specific location by ID
   */
  async getLocation(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/locations/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Create a new location
   */
  async createLocation(data: {
    name: string;
    address: string;
    apartment?: string;
    city: string;
    country: string;
    postalCode: string;
    isDefault?: boolean;
  }): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/locations', data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update an existing location
   */
  async updateLocation(id: number, data: {
    name?: string;
    address?: string;
    apartment?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    isDefault?: boolean;
  }): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/locations/${id}`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Delete a location (soft delete)
   */
  async deleteLocation(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/locations/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Reactivate a deleted location
   */
  async activateLocation(id: number): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/locations/${id}/activate`, {});
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // ==================== Suppliers API ====================
  /**
   * Get all suppliers for the current app
   */
  async getSuppliers(filters?: {
    status?: 'active' | 'inactive';
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const url = queryString ? `/v1/merchant/suppliers?${queryString}` : '/v1/merchant/suppliers';

    const response = await httpClient.get(url, { cancelKey: 'getSuppliers' });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get a specific supplier by ID
   */
  async getSupplier(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/suppliers/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Create a new supplier
   */
  async createSupplier(data: {
    company: string;
    country: string;
    address: string;
    apartment?: string;
    city: string;
    postalCode: string;
    contactName: string;
    email: string;
    phoneNumber: string;
    phoneCountryCode: string;
  }): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/suppliers', data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update an existing supplier
   */
  async updateSupplier(id: number, data: {
    company?: string;
    country?: string;
    address?: string;
    apartment?: string;
    city?: string;
    postalCode?: string;
    contactName?: string;
    email?: string;
    phoneNumber?: string;
    phoneCountryCode?: string;
  }): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/suppliers/${id}`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Deactivate a supplier (soft delete)
   */
  async deactivateSupplier(id: number): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/suppliers/${id}/deactivate`, {});
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Reactivate a supplier
   */
  async activateSupplier(id: number): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/suppliers/${id}/activate`, {});
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get supplier statistics (total POs, active POs, total spent)
   */
  async getSupplierStats(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/suppliers/${id}/stats`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // ==================== Purchase Orders API ====================
  /**
   * Get all purchase orders for the current app
   */
  async getPurchaseOrders(filters?: {
    status?: 'draft' | 'ordered' | 'partial' | 'received' | 'closed';
    supplierId?: number;
    locationId?: number;
    search?: string;
    createdFrom?: string;
    createdTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplierId) params.append('supplierId', String(filters.supplierId));
    if (filters?.locationId) params.append('locationId', String(filters.locationId));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.createdFrom) params.append('createdFrom', filters.createdFrom);
    if (filters?.createdTo) params.append('createdTo', filters.createdTo);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const url = queryString ? `/v1/merchant/purchase-orders?${queryString}` : '/v1/merchant/purchase-orders';

    const response = await httpClient.get(url, { cancelKey: 'getPurchaseOrders' });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get a specific purchase order by ID
   */
  async getPurchaseOrder(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/purchase-orders/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(data: {
    supplierId: number;
    locationId: number;
    referenceNumber: string;
    paymentTerms?: string;
    supplierCurrency?: string;
    estimatedArrival?: string;
    shippingCarrier?: string;
    trackingNumber?: string;
    noteToSupplier?: string;
    tags?: string[];
    shippingCost?: number;
    customsDuties?: number;
    otherFees?: number;
    items: Array<{
      productId?: number;
      variantId?: number;
      quantity: number;
      unitCost: number;
      taxPercent?: number;
    }>;
  }): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/purchase-orders', data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update an existing purchase order
   */
  async updatePurchaseOrder(id: number, data: {
    supplierId?: number;
    locationId?: number;
    referenceNumber?: string;
    paymentTerms?: string;
    supplierCurrency?: string;
    estimatedArrival?: string;
    shippingCarrier?: string;
    trackingNumber?: string;
    shippingCost?: number;
    customsDuties?: number;
    otherFees?: number;
    noteToSupplier?: string;
    tags?: string[];
  }): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/purchase-orders/${id}`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Delete a draft purchase order
   */
  async deletePurchaseOrder(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/purchase-orders/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Add a new item to a purchase order
   */
  async addPurchaseOrderItem(poId: number, data: {
    productId?: number;
    variantId?: number;
    quantity: number;
    unitCost: number;
    taxPercent?: number;
  }): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/purchase-orders/${poId}/items`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update a purchase order item
   */
  async updatePurchaseOrderItem(poId: number, itemId: number, data: {
    quantity?: number;
    unitCost?: number;
    taxPercent?: number;
  }): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/purchase-orders/${poId}/items/${itemId}`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Remove an item from a purchase order
   */
  async removePurchaseOrderItem(poId: number, itemId: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/purchase-orders/${poId}/items/${itemId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Mark a purchase order as ordered (transitions from draft to ordered)
   */
  async markPurchaseOrderAsOrdered(poId: number): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/purchase-orders/${poId}/mark-ordered`, {});
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Receive items from a purchase order
   */
  async receivePurchaseOrderItems(poId: number, data: {
    items: Array<{
      itemId: number;
      quantity: number;
      notes?: string;
    }>;
  }): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/purchase-orders/${poId}/receive`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Close a purchase order
   */
  async closePurchaseOrder(poId: number): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/purchase-orders/${poId}/close`, {});
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get receiving history for a purchase order
   */
  async getPurchaseOrderReceivingHistory(poId: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/purchase-orders/${poId}/receiving-history`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get incoming stock details for a specific product
   */
  async getProductIncomingStock(productId: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/purchase-orders/products/${productId}/incoming-stock`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // ==================== Shipping Zones API ====================
  /**
   * Get all shipping zones for the current app
   */
  async getShippingZones(): Promise<ApiResponse> {
    const response = await httpClient.get('/v1/merchant/shipping/zones', { cancelKey: 'getShippingZones' });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get a specific shipping zone by ID
   */
  async getShippingZone(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/shipping/zones/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Create a new shipping zone
   */
  async createShippingZone(data: {
    name: string;
    description?: string;
    countries?: string[];
    states?: string[];
    isActive?: boolean;
    displayOrder?: number;
  }): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/shipping/zones', data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update an existing shipping zone
   */
  async updateShippingZone(id: number, data: {
    name?: string;
    description?: string;
    countries?: string[];
    states?: string[];
    isActive?: boolean;
    displayOrder?: number;
  }): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/shipping/zones/${id}`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Delete a shipping zone
   */
  async deleteShippingZone(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/shipping/zones/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Reorder shipping zones (priority matching)
   */
  async reorderShippingZones(zoneIds: number[]): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/shipping/zones/reorder', { zoneIds });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Create default shipping zones (Domestic + International)
   */
  async createDefaultShippingZones(country: string = 'US'): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/shipping/zones/default', { country });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Check if address can be shipped to
   */
  async canShipToAddress(address: { country: string; state?: string }): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/shipping/zones/can-ship', address);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get zone with all active rates
   */
  async getShippingZoneWithRates(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/shipping/zones/${id}/rates`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  // ==================== Shipping Rates API ====================
  /**
   * Get all shipping rates (optionally filter by zoneId)
   */
  async getShippingRates(zoneId?: number): Promise<ApiResponse> {
    const url = zoneId
      ? `/v1/merchant/shipping/rates?zoneId=${zoneId}`
      : '/v1/merchant/shipping/rates';
    const response = await httpClient.get(url, { cancelKey: 'getShippingRates' });
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get rates for specific zone
   */
  async getShippingRatesByZone(zoneId: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/shipping/rates/zone/${zoneId}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Get a specific shipping rate by ID
   */
  async getShippingRate(id: number): Promise<ApiResponse> {
    const response = await httpClient.get(`/v1/merchant/shipping/rates/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Create a new shipping rate
   */
  async createShippingRate(data: {
    zoneId: number;
    name: string;
    description?: string;
    method: 'flat_rate' | 'weight_based' | 'price_based' | 'free' | 'pickup';
    baseRate?: number;
    pricePerKg?: number;
    percentageOfTotal?: number;
    minOrderAmount?: number;
    maxOrderAmount?: number;
    freeShippingThreshold?: number;
    minWeight?: number;
    maxWeight?: number;
    deliveryMinDays?: number;
    deliveryMaxDays?: number;
    isActive?: boolean;
    isTaxable?: boolean;
  }): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/shipping/rates', data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Update an existing shipping rate
   */
  async updateShippingRate(id: number, data: {
    name?: string;
    description?: string;
    method?: 'flat_rate' | 'weight_based' | 'price_based' | 'free' | 'pickup';
    baseRate?: number;
    pricePerKg?: number;
    percentageOfTotal?: number;
    minOrderAmount?: number;
    maxOrderAmount?: number;
    freeShippingThreshold?: number;
    minWeight?: number;
    maxWeight?: number;
    deliveryMinDays?: number;
    deliveryMaxDays?: number;
    isActive?: boolean;
    isTaxable?: boolean;
  }): Promise<ApiResponse> {
    const response = await httpClient.patch(`/v1/merchant/shipping/rates/${id}`, data);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Delete a shipping rate
   */
  async deleteShippingRate(id: number): Promise<ApiResponse> {
    const response = await httpClient.delete(`/v1/merchant/shipping/rates/${id}`);
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Duplicate/clone a shipping rate
   */
  async duplicateShippingRate(id: number): Promise<ApiResponse> {
    const response = await httpClient.post(`/v1/merchant/shipping/rates/${id}/duplicate`, {});
    return { ok: response.ok, status: response.status, data: response.data };
  }

  /**
   * Reorder shipping rates within a zone
   */
  async reorderShippingRates(zoneId: number, rateIds: number[]): Promise<ApiResponse> {
    const response = await httpClient.post('/v1/merchant/shipping/rates/reorder', { zoneId, rateIds });
    return { ok: response.ok, status: response.status, data: response.data };
  }
}

// Export singleton instance
export const apiService = new ApiService();
