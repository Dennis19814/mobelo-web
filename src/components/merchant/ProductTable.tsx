'use client'

import { Eye, Edit, ToggleLeft, ToggleRight, Trash2, MoreVertical } from 'lucide-react'
import type { Product, ProductVariant } from '@/types/product.types'

/** Collect variant option names only (e.g. Size, Color) from first variant, no values. */
function getVariantOptionNames(variants: ProductVariant[]): string[] {
  if (!variants?.length) return []
  const first = variants[0]
  const names: string[] = []
  for (let i = 1; i <= 5; i++) {
    const name = (first as Record<string, string | undefined>)[`option${i}Name`]
    if (name && String(name).trim()) names.push(String(name).trim())
  }
  return names
}

interface ProductTableProps {
  products: Product[]
  loading: boolean
  onView: (product: Product) => void
  onEdit?: (product: Product) => void
  onStatusToggle: (product: Product) => void
  onDelete?: (product: Product) => void
}

export default function ProductTable({
  products,
  loading,
  onView,
  onEdit,
  onStatusToggle,
  onDelete
}: ProductTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      archived: 'bg-yellow-100 text-yellow-800',
      out_of_stock: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || statusClasses.draft}`}>
        {status.replace('_', ' ')}
      </span>
    )
  }

  if (loading) {
    // Skeleton table
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-[0_1px_0_#e5e7eb] border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="hidden sm:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="hidden lg:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                <th className="hidden xl:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="hidden md:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-2 sm:px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse" />
                      <div>
                        <div className="h-3 w-40 bg-gray-100 rounded animate-pulse mb-2" />
                        <div className="h-2 w-56 bg-gray-100 rounded animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><div className="h-3 w-16 bg-gray-100 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-10 bg-gray-100 rounded animate-pulse" /></td>
                  <td className="px-6 py-4"><div className="h-3 w-12 bg-gray-100 rounded animate-pulse" /></td>
                  <td className="px-6 py-4 text-right"><div className="h-3 w-14 bg-gray-100 rounded animate-pulse inline-block" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-100 rounded-full animate-pulse" /></td>
                  <td className="px-6 py-4 text-right"><div className="h-3 w-16 bg-gray-100 rounded animate-pulse ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by adding your first product.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-[0_1px_0_#e5e7eb] border-b border-gray-200">
            <tr>
              <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="hidden sm:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="hidden lg:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variants
              </th>
              <th className="hidden xl:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weight
              </th>
              <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="hidden md:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="hidden xl:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                Featured
              </th>
              <th className="px-2 sm:px-3 py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product, i) => (
              <tr key={product.id} className={`transition-colors hover:bg-gray-50/70 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                <td className="px-3 py-3 sm:py-4">
                  <div className="flex items-center">
                    {product.thumbnailUrl && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.thumbnailUrl}
                          alt={product.name}
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-contain mr-2 sm:mr-3 bg-gray-50 p-0.5"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </>
                    )}
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.shortDescription && (
                        <div className="hidden sm:block text-xs text-gray-500 truncate max-w-xs">
                          {product.shortDescription}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="hidden sm:table-cell px-3 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                  {product.sku || '-'}
                </td>
                <td className="hidden lg:table-cell px-3 py-3 sm:py-4">
                  <div className="text-xs sm:text-sm text-gray-900">
                    {product.variants && product.variants.length > 0 ? (
                      <div>
                        {getVariantOptionNames(product.variants).length > 0 ? (
                          <span className="text-gray-700">
                            {getVariantOptionNames(product.variants).join(', ')}
                          </span>
                        ) : (
                          <span className="text-gray-600">
                            <span className="font-medium">{product.variants.length}</span>
                            <span className="ml-1">variant{product.variants.length !== 1 ? 's' : ''}</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="hidden xl:table-cell px-3 py-3 sm:py-4">
                  <div className="text-xs sm:text-sm text-gray-900">
                    {product.weight ? (
                      <span>
                        {product.weight} {product.weightUnit || 'kg'}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 sm:py-4">
                  <div className="text-xs sm:text-sm text-gray-900">
                    {formatCurrency(product.basePrice)}
                  </div>
                  {product.compareAtPrice && (
                    <div className="hidden sm:block text-xs text-gray-500 line-through">
                      {formatCurrency(product.compareAtPrice)}
                    </div>
                  )}
                </td>
                <td className="hidden md:table-cell px-3 py-3 sm:py-4">
                  {getStatusBadge(product.status)}
                </td>
                <td className="hidden xl:table-cell px-3 py-3 sm:py-4">
                  {product.featured && (
                    <span className="text-purple-600">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </span>
                  )}
                </td>
                <td className="px-2 sm:px-3 py-3 sm:py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(product)}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onStatusToggle(product)}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title={product.status === 'active' ? 'Deactivate' : 'Activate'}
                    >
                      {product.status === 'active' ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(product)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination can be added here if needed */}
    </div>
  )
}
