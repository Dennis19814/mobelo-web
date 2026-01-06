'use client'

import { Package, DollarSign, Box, Tag, Calendar, Eye, EyeOff } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { Product } from '@/types/product.types'

interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
}

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product
}: ProductDetailsModalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'archived':
        return 'bg-yellow-100 text-yellow-800'
      case 'out_of_stock':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Details"
      size="lg"
    >
      <div className="space-y-4 pt-4">
        {/* Product Image and Basic Info */}
        <div className="flex gap-4">
          {/* Product Thumbnail */}
          {product.thumbnailUrl && (
            <div className="flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                className="w-32 h-32 object-contain rounded-lg bg-gray-50 border border-gray-200"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjEwMCIgeT0iMTAwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjEzcHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
                }}
              />
            </div>
          )}

          {/* Product Details */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Product Name and Status */}
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                {product.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <div className="bg-orange-50 border border-blue-100 rounded-lg p-2">
                <p className="text-sm text-gray-700">
                  {product.shortDescription}
                </p>
              </div>
            )}

            {/* Brand, SKU, Barcode */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {product.brand && (
                <div>
                  <span className="text-gray-500">Brand:</span>{' '}
                  <span className="text-gray-900 font-medium">{product.brand}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">SKU:</span>{' '}
                <span className="text-gray-900 font-medium">{product.sku || 'N/A'}</span>
              </div>
              {product.barcode && (
                <div className="col-span-2">
                  <span className="text-gray-500">Barcode:</span>{' '}
                  <span className="text-gray-900 font-medium">{product.barcode}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 flex items-center">
            <DollarSign className="w-3.5 h-3.5 mr-1" />
            Pricing
          </h4>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-600">Base Price</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(product.basePrice)}
              </p>
            </div>
            {product.compareAtPrice && (
              <div>
                <p className="text-xs text-gray-600">Compare at</p>
                <p className="text-sm font-semibold text-gray-400 line-through">
                  {formatCurrency(product.compareAtPrice)}
                </p>
              </div>
            )}
            {product.costPrice && (
              <div>
                <p className="text-xs text-gray-600">Cost</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(product.costPrice)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 flex items-center">
              <Package className="w-3.5 h-3.5 mr-1" />
              Variants ({product.variants.length})
            </h4>
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white sticky top-0">
                  <tr>
                    {product.variants[0].option1Name && (
                      <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {product.variants[0].option1Name}
                      </th>
                    )}
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {product.variants.map((variant, index) => (
                    <tr key={variant.id || index} className="hover:bg-gray-50">
                      {variant.option1Value && (
                        <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                          {variant.option1Value}
                          {variant.isDefault && (
                            <span className="ml-1 text-xs text-green-600">(default)</span>
                          )}
                        </td>
                      )}
                      <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-600">
                        {variant.sku || '-'}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {variant.price ? formatCurrency(variant.price) : formatCurrency(product.basePrice)}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                        {variant.inventoryQuantity ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inventory Information */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 flex items-center">
            <Box className="w-3.5 h-3.5 mr-1" />
            Inventory
          </h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-600">Stock Status</p>
              <p className="text-gray-900 font-medium flex items-center mt-0.5">
                {product.trackInventory ? (
                  <Eye className="w-3.5 h-3.5 text-green-600 mr-1" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-gray-400 mr-1" />
                )}
                {product.trackInventory ? 'Tracked' : 'Not Tracked'}
              </p>
            </div>
            {product.trackInventory && (
              <>
                <div>
                  <p className="text-xs text-gray-600">Current Stock</p>
                  <p className="text-gray-900 font-medium">{product.inventoryQuantity || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Minimum Quantity</p>
                  <p className="text-gray-900 font-medium">{product.minimumQuantity || 'Not set'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Shipping Information */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 flex items-center">
            <Package className="w-3.5 h-3.5 mr-1" />
            Shipping
          </h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-600">Requires Shipping</p>
              <p className="text-gray-900 font-medium">{product.requiresShipping !== false ? 'Yes' : 'No'}</p>
            </div>
            {product.weight && (
              <div>
                <p className="text-xs text-gray-600">Weight</p>
                <p className="text-gray-900 font-medium">
                  {product.weight} {product.weightUnit || 'kg'}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-600">Digital Product</p>
              <p className="text-gray-900 font-medium">{product.isDigital ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Categories and Tags */}
        {((product.categories && product.categories.length > 0) || (product.tags && product.tags.length > 0)) && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2 flex items-center">
              <Tag className="w-3.5 h-3.5 mr-1" />
              Categories & Tags
            </h4>

            {product.categories && product.categories.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-600 mb-1">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map(category => (
                    <span
                      key={category.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}