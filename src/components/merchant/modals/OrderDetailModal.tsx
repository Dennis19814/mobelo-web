'use client';

import { useState } from 'react';
import { X, Package, MapPin, CreditCard, FileText, AlertCircle } from 'lucide-react';
import { Order } from '@/types/order.types';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onRefresh: () => void;
  headers?: Record<string, string>;
}

type TabType = 'overview' | 'items' | 'shipping' | 'payment';

export default function OrderDetailModal({
  isOpen,
  onClose,
  order,
  onRefresh,
  headers,
}: OrderDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string, type: 'order' | 'payment' | 'fulfillment') => {
    const colors = {
      order: {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        processing: 'bg-purple-100 text-purple-800',
        shipped: 'bg-indigo-100 text-indigo-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        refunded: 'bg-gray-100 text-gray-800',
      },
      payment: {
        pending: 'bg-yellow-100 text-yellow-800',
        authorized: 'bg-blue-100 text-blue-800',
        paid: 'bg-green-100 text-green-800',
        partially_paid: 'bg-orange-100 text-orange-800',
        partially_refunded: 'bg-orange-100 text-orange-800',
        refunded: 'bg-gray-100 text-gray-800',
        failed: 'bg-red-100 text-red-800',
      },
      fulfillment: {
        pending: 'bg-gray-100 text-gray-800',
        partially_fulfilled: 'bg-yellow-100 text-yellow-800',
        fulfilled: 'bg-blue-100 text-blue-800',
        partially_shipped: 'bg-indigo-100 text-indigo-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
      },
    };

    const colorClass = colors[type][status as keyof typeof colors[typeof type]] || 'bg-gray-100 text-gray-800';
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const getCustomerName = () => {
    if (!order.mobileUser) return 'Guest';
    const { firstName, lastName, email } = order.mobileUser;
    const name = `${firstName || ''} ${lastName || ''}`.trim();
    return name || email || 'Guest';
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: FileText },
    { id: 'items' as TabType, label: 'Items', icon: Package },
    { id: 'shipping' as TabType, label: 'Shipping', icon: MapPin },
    { id: 'payment' as TabType, label: 'Payment', icon: CreditCard },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full h-[85vh] overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Order #{order.orderNumber}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Horizontal Pill Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex px-4 py-2 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Order Summary - Compact */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Order Summary</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(Number(order.subtotal), order.currency)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(Number(order.discountAmount), order.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatCurrency(Number(order.taxAmount), order.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{formatCurrency(Number(order.shippingAmount), order.currency)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-gray-200">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-orange-600">{formatCurrency(Number(order.total), order.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info - 2 Column Grid */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Name</span>
                    <p className="font-medium">{getCustomerName()}</p>
                  </div>
                  {order.mobileUser?.email && (
                    <div>
                      <span className="text-gray-500 text-xs">Email</span>
                      <p className="font-medium truncate">{order.mobileUser.email}</p>
                    </div>
                  )}
                  {order.mobileUser?.phone && (
                    <div>
                      <span className="text-gray-500 text-xs">Phone</span>
                      <p className="font-medium">{order.mobileUser.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Info - Badges */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Status</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Order:</span>
                    {getStatusBadge(order.status, 'order')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Payment:</span>
                    {getStatusBadge(order.paymentStatus, 'payment')}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500">Fulfillment:</span>
                    {getStatusBadge(order.fulfillmentStatus, 'fulfillment')}
                  </div>
                </div>

                {/* Cancel Reason - Show when order is cancelled */}
                {order.status === 'cancelled' && order.cancelReason && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-900">Cancellation Reason</p>
                      <p className="text-sm text-red-700 mt-0.5">{order.cancelReason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Order Items ({order.items?.length || 0})</h3>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      {/* Product Thumbnail */}
                      <div className="flex-shrink-0">
                        {item.product?.thumbnailUrl ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.product.thumbnailUrl}
                              alt={item.productName}
                              className="w-16 h-16 object-cover rounded-lg bg-white border border-gray-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </>
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{item.productName}</h4>
                        {item.productSku && (
                          <p className="text-xs text-gray-500 mt-0.5">SKU: {item.productSku}</p>
                        )}
                        {item.product?.shortDescription && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.product.shortDescription}</p>
                        )}
                        {item.variant && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.variant.option1Value && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-700">
                                {item.variant.option1Value}
                              </span>
                            )}
                            {item.variant.option2Value && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700">
                                {item.variant.option2Value}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm text-gray-900">{formatCurrency(Number(item.lineTotal), order.currency)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(Number(item.unitPrice), order.currency)}/ea</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No items found</p>
              )}
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Shipping Address</h3>
                {order.shippingAddress ? (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium">{order.shippingAddress.fullName}</p>
                    {order.shippingAddress.company && <p className="text-gray-600">{order.shippingAddress.company}</p>}
                    <p className="text-gray-600 mt-1">{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p className="text-gray-600">{order.shippingAddress.addressLine2}</p>}
                    <p className="text-gray-600">
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </p>
                    <p className="text-gray-600">{order.shippingAddress.country}</p>
                    {order.shippingAddress.phone && <p className="text-gray-600 mt-1">{order.shippingAddress.phone}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No shipping address</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Billing Address</h3>
                {order.billingAddress ? (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium">{order.billingAddress.fullName}</p>
                    {order.billingAddress.company && <p className="text-gray-600">{order.billingAddress.company}</p>}
                    <p className="text-gray-600 mt-1">{order.billingAddress.addressLine1}</p>
                    {order.billingAddress.addressLine2 && <p className="text-gray-600">{order.billingAddress.addressLine2}</p>}
                    <p className="text-gray-600">
                      {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.postalCode}
                    </p>
                    <p className="text-gray-600">{order.billingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Same as shipping address</p>
                )}
              </div>

              {order.shippingMethod && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Shipping Method</h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium">{order.shippingMethod}</p>
                    {order.trackingNumber && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-gray-500">Tracking:</span>
                        <code className="bg-white px-2 py-0.5 rounded border border-gray-300 text-xs font-mono">
                          {order.trackingNumber}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Payment Information</h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Status</span>
                    {getStatusBadge(order.paymentStatus, 'payment')}
                  </div>
                  {order.payments && order.payments.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-medium">
                        {(() => {
                          const payment = order.payments[0];
                          const paymentDetails = payment.paymentDetails || {};
                          const cardBrand = paymentDetails.cardBrand || payment.paymentMethod || 'Card';
                          const cardLast4 = paymentDetails.cardLast4 || '';
                          return cardLast4
                            ? `${cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1)} •••• ${cardLast4}`
                            : cardBrand;
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="font-medium">{formatCurrency(Number(order.totalPaid), order.currency)}</span>
                  </div>
                  {order.totalRefunded > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Refunded</span>
                      <span className="font-medium text-red-600">{formatCurrency(Number(order.totalRefunded), order.currency)}</span>
                    </div>
                  )}
                </div>
              </div>

              {order.taxLines && order.taxLines.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Tax Breakdown</h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm">
                    {order.taxLines.map((tax, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{tax.name} ({(tax.rate * 100).toFixed(2)}%)</span>
                        <span className="font-medium">{formatCurrency(tax.amount, order.currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Compact Footer */}
        <div className="flex justify-end p-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
