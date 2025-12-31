'use client';

import { useState } from 'react';
import { apiService } from '@/lib/api-service';
import { DiscountType, ApplicationType, CustomerEligibility, CouponStatus, CreateCouponData } from '@/types/coupon';

interface CreateCouponModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCouponModal({ onClose, onSuccess }: CreateCouponModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage' as DiscountType,
    discountValue: 0,
    maxDiscountAmount: undefined as number | undefined,
    applicationType: 'entire_order' as ApplicationType,
    minPurchaseAmount: undefined as number | undefined,
    minQuantity: undefined as number | undefined,
    maxUsageTotal: undefined as number | undefined,
    maxUsagePerUser: undefined as number | undefined,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
    customerEligibility: 'all' as CustomerEligibility,
    status: 'active' as CouponStatus,
    isStackable: false,
    priority: 0,

    // Target scope
    productIds: [] as number[],
    categoryIds: [] as number[],
    brandIds: [] as number[],
    excludeProductIds: [] as number[],
    excludeCategoryIds: [] as number[],
    excludeBrandIds: [] as number[],

    // Buy X Get Y config
    buyQuantity: undefined as number | undefined,
    getQuantity: undefined as number | undefined,
    getDiscountType: 'free' as 'free' | 'percentage' | 'fixed',
    getDiscountValue: undefined as number | undefined,
    targetProductIds: [] as number[],

    // Specific users
    specificUserIds: [] as number[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Build the coupon data
      const couponData: CreateCouponData = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        maxDiscountAmount: formData.maxDiscountAmount,
        applicationType: formData.applicationType,
        minPurchaseAmount: formData.minPurchaseAmount,
        minQuantity: formData.minQuantity,
        maxUsageTotal: formData.maxUsageTotal,
        maxUsagePerUser: formData.maxUsagePerUser,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        customerEligibility: formData.customerEligibility,
        status: formData.status,
        isStackable: formData.isStackable,
        priority: formData.priority,
      };

      // Add target scope if applicable
      if (formData.applicationType !== 'entire_order') {
        couponData.targetScope = {
          productIds: formData.productIds.length > 0 ? formData.productIds : undefined,
          categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
          brandIds: formData.brandIds.length > 0 ? formData.brandIds : undefined,
          excludeProductIds: formData.excludeProductIds.length > 0 ? formData.excludeProductIds : undefined,
          excludeCategoryIds: formData.excludeCategoryIds.length > 0 ? formData.excludeCategoryIds : undefined,
          excludeBrandIds: formData.excludeBrandIds.length > 0 ? formData.excludeBrandIds : undefined,
        };
      }

      // Add Buy X Get Y config if applicable
      if (formData.discountType === 'buy_x_get_y' && formData.buyQuantity && formData.getQuantity) {
        couponData.buyXGetYConfig = {
          buyQuantity: formData.buyQuantity,
          getQuantity: formData.getQuantity,
          getDiscountType: formData.getDiscountType,
          getDiscountValue: formData.getDiscountValue,
          targetProductIds: formData.targetProductIds.length > 0 ? formData.targetProductIds : undefined,
        };
      }

      // Add specific user IDs if applicable
      if (formData.customerEligibility === 'specific_users' && formData.specificUserIds.length > 0) {
        couponData.specificUserIds = formData.specificUserIds;
      }

      const response = await apiService.createCoupon(couponData);

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(response.data?.message || 'Failed to create coupon');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleArrayInput = (field: keyof typeof formData, value: string) => {
    const numbers = value.split(',')
      .map(s => parseInt(s.trim()))
      .filter(n => !isNaN(n));

    setFormData({ ...formData, [field]: numbers });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-4 max-w-4xl w-full mx-4 my-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Create Coupon</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Basic Information */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold mb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="SAVE20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="20% Off Summer Sale"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Internal description for this coupon"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CouponStatus })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="paused">Paused</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Priority
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Higher priority coupons apply first</p>
              </div>
            </div>
          </div>

          {/* Discount Configuration */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold mb-2">Discount Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Discount Type *
                </label>
                <select
                  required
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as DiscountType })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                  <option value="buy_x_get_y">Buy X Get Y</option>
                </select>
              </div>

              {formData.discountType !== 'free_shipping' && formData.discountType !== 'buy_x_get_y' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    placeholder={formData.discountType === 'percentage' ? '20' : '10.00'}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.discountType === 'percentage' ? 'Enter percentage (e.g., 20 for 20%)' : 'Enter amount in dollars'}
                  </p>
                </div>
              )}

              {formData.discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Max Discount Amount
                  </label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount || ''}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    placeholder="No limit"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cap the maximum discount amount</p>
                </div>
              )}
            </div>

            {/* Buy X Get Y Configuration */}
            {formData.discountType === 'buy_x_get_y' && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Buy X Get Y Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Buy Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.buyQuantity || ''}
                      onChange={(e) => setFormData({ ...formData, buyQuantity: parseInt(e.target.value) || undefined })}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      placeholder="2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Get Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.getQuantity || ''}
                      onChange={(e) => setFormData({ ...formData, getQuantity: parseInt(e.target.value) || undefined })}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Get Discount Type *
                    </label>
                    <select
                      required
                      value={formData.getDiscountType}
                      onChange={(e) => setFormData({ ...formData, getDiscountType: e.target.value as 'free' | 'percentage' | 'fixed' })}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="free">Free</option>
                      <option value="percentage">Percentage Off</option>
                      <option value="fixed">Fixed Amount Off</option>
                    </select>
                  </div>

                  {formData.getDiscountType !== 'free' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Get Discount Value *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.getDiscountValue || ''}
                        onChange={(e) => setFormData({ ...formData, getDiscountValue: parseFloat(e.target.value) || undefined })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Target Product IDs
                    </label>
                    <input
                      type="text"
                      value={formData.targetProductIds.join(', ')}
                      onChange={(e) => handleArrayInput('targetProductIds', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="1, 2, 3"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated product IDs for the "get" items</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Application Scope */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold mb-2">Application Scope</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Application Type *
                </label>
                <select
                  required
                  value={formData.applicationType}
                  onChange={(e) => setFormData({ ...formData, applicationType: e.target.value as ApplicationType })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="entire_order">Entire Order</option>
                  <option value="specific_products">Specific Products</option>
                  <option value="specific_categories">Specific Categories</option>
                  <option value="specific_brands">Specific Brands</option>
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isStackable}
                    onChange={(e) => setFormData({ ...formData, isStackable: e.target.checked })}
                    className="rounded border-gray-300 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Can be stacked with other coupons</span>
                </label>
              </div>
            </div>

            {formData.applicationType !== 'entire_order' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <h4 className="font-medium">Target Scope</h4>

                {formData.applicationType === 'specific_products' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Product IDs
                      </label>
                      <input
                        type="text"
                        value={formData.productIds.join(', ')}
                        onChange={(e) => handleArrayInput('productIds', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="1, 2, 3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Exclude Product IDs
                      </label>
                      <input
                        type="text"
                        value={formData.excludeProductIds.join(', ')}
                        onChange={(e) => handleArrayInput('excludeProductIds', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="4, 5, 6"
                      />
                    </div>
                  </>
                )}

                {formData.applicationType === 'specific_categories' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Category IDs
                      </label>
                      <input
                        type="text"
                        value={formData.categoryIds.join(', ')}
                        onChange={(e) => handleArrayInput('categoryIds', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="1, 2, 3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Exclude Category IDs
                      </label>
                      <input
                        type="text"
                        value={formData.excludeCategoryIds.join(', ')}
                        onChange={(e) => handleArrayInput('excludeCategoryIds', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="4, 5, 6"
                      />
                    </div>
                  </>
                )}

                {formData.applicationType === 'specific_brands' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Brand IDs
                      </label>
                      <input
                        type="text"
                        value={formData.brandIds.join(', ')}
                        onChange={(e) => handleArrayInput('brandIds', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="1, 2, 3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Exclude Brand IDs
                      </label>
                      <input
                        type="text"
                        value={formData.excludeBrandIds.join(', ')}
                        onChange={(e) => handleArrayInput('excludeBrandIds', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="4, 5, 6"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Requirements & Limits */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold mb-2">Requirements & Limits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Minimum Purchase Amount
                </label>
                <input
                  type="number"
                  value={formData.minPurchaseAmount || ''}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Minimum Quantity
                </label>
                <input
                  type="number"
                  value={formData.minQuantity || ''}
                  onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Max Usage (Total)
                </label>
                <input
                  type="number"
                  value={formData.maxUsageTotal || ''}
                  onChange={(e) => setFormData({ ...formData, maxUsageTotal: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  placeholder="Unlimited"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Max Usage (Per User)
                </label>
                <input
                  type="number"
                  value={formData.maxUsagePerUser || ''}
                  onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  placeholder="Unlimited"
                />
              </div>
            </div>
          </div>

          {/* Customer Eligibility */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold mb-2">Customer Eligibility</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Eligible Customers *
                </label>
                <select
                  required
                  value={formData.customerEligibility}
                  onChange={(e) => setFormData({ ...formData, customerEligibility: e.target.value as CustomerEligibility })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Customers</option>
                  <option value="new_customers">New Customers Only</option>
                  <option value="existing_customers">Existing Customers Only</option>
                  <option value="specific_users">Specific Users</option>
                </select>
              </div>

              {formData.customerEligibility === 'specific_users' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    User IDs
                  </label>
                  <input
                    type="text"
                    value={formData.specificUserIds.join(', ')}
                    onChange={(e) => handleArrayInput('specificUserIds', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1, 2, 3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Comma-separated mobile user IDs</p>
                </div>
              )}
            </div>
          </div>

          {/* Validity Period */}
          <div className="border-b pb-3">
            <h3 className="text-sm font-semibold mb-2">Validity Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
