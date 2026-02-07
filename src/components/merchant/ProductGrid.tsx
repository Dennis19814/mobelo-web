"use client";

import { logger } from '@/lib/logger'

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Package,
  Edit2,
  Trash2,
  Eye,
  Copy,
  MoreVertical,
  AlertCircle,
  TrendingUp,
  Play,
  AlertTriangle,
  X,
} from "lucide-react";
import { StarRating } from "@/components/ui/StarRating";
import VideoThumbnail from "@/components/ui/VideoThumbnail";
import LazyVideoThumbnail from "@/components/ui/LazyVideoThumbnail";
import LazyImage from "@/components/ui/LazyImage";
import type { Product } from "@/types/product.types";

interface ProductGridProps {
  products: Product[];
  onEdit?: (productId: number) => void;
  onDelete?: (productId: number) => void;
  onView: (productId: number) => void;
  onDuplicate: (productId: number) => void;
  selectedProducts: number[];
  onSelectProduct: (productId: number) => void;
  viewMode?: "grid" | "list";
  onPrefetch?: (productId: number) => void;
  loading?: boolean;
}

// Skeleton loader components
const SkeletonGridCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-20" />
        <div className="h-4 bg-gray-200 rounded w-16" />
      </div>
    </div>
  </div>
)

const SkeletonListRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 w-4 bg-gray-200 rounded" />
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center space-x-3">
        <div className="h-12 w-12 bg-gray-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-16" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-20" />
    </td>
    <td className="px-6 py-4">
      <div className="h-6 bg-gray-200 rounded w-16" />
    </td>
    <td className="px-6 py-4">
      <div className="h-4 bg-gray-200 rounded w-20" />
    </td>
    <td className="px-6 py-4">
      <div className="flex justify-end space-x-2">
        <div className="h-8 w-8 bg-gray-200 rounded" />
        <div className="h-8 w-8 bg-gray-200 rounded" />
      </div>
    </td>
  </tr>
)

export default function ProductGrid({
  products,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
  selectedProducts,
  onSelectProduct,
  viewMode = "grid",
  onPrefetch,
  loading = false,
}: ProductGridProps) {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [duplicateConfirmId, setDuplicateConfirmId] = useState<number | null>(null);
  const [duplicatingProduct, setDuplicatingProduct] = useState<Product | null>(null);
  const dropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  // Helper function to handle missing images
  const fixImageUrl = (url: string | null | undefined): string => {
    if (!url) return '/placeholder-product.png'
    return url
  }

  // Helper function to check if product has video thumbnail
  const isVideoProduct = (product: Product): boolean => {
    return product.thumbnailType === 'video'
  }

  // Helper function to get video URL from product media
  const getVideoUrl = (product: Product): string | null => {
    if (!product.media || product.media.length === 0) return null
    
    // Find the listing thumbnail video or the first video
    const listingVideo = product.media.find(m => m.type === 'video' && m.isListingThumbnail)
    const firstVideo = product.media.find(m => m.type === 'video')
    
    const videoMedia = listingVideo || firstVideo
    return videoMedia?.url || null
  }

  // Helper function to get video thumbnail URL
  const getVideoThumbnailUrl = (product: Product): string | null => {
    if (!product.media || product.media.length === 0) {
      return product.thumbnailUrl || null
    }
    
    // Find the listing thumbnail video
    const listingVideo = product.media.find(m => m.type === 'video' && m.isListingThumbnail)
    const firstVideo = product.media.find(m => m.type === 'video')
    
    const videoMedia = listingVideo || firstVideo
    return videoMedia?.thumbnailUrl || product.thumbnailUrl || null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-yellow-100 text-yellow-800";
      case "out_of_stock":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockStatusColor = (quantity?: number) => {
    // Handle undefined/null gracefully - don't treat as "Out of Stock"
    if (quantity === undefined || quantity === null) return "text-gray-400 bg-gray-50";
    if (quantity === 0) return "text-red-600 bg-red-50";
    if (quantity < 10) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getStockStatusText = (quantity?: number, productId?: number) => {
    // Log when inventory quantity is undefined to help diagnose backend issues
    if (quantity === undefined || quantity === null) {
      console.warn('[ProductGrid] inventoryQuantity is undefined/null:', {
        productId,
        quantity,
        typeOf: typeof quantity,
        message: 'Backend may not be returning inventoryQuantity in product list'
      });
      return "Stock N/A";
    }

    // Only show "Out of Stock" when explicitly 0
    if (quantity === 0) return "Out of Stock";
    if (quantity < 10) return `Low Stock (${quantity})`;
    return `In Stock (${quantity})`;
  };

  const formatPrice = (price: number, currency: string | undefined = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(price);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId !== null) {
        const dropdownElement = dropdownRefs.current.get(openDropdownId);
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setOpenDropdownId(null);
        }
      }
    };

    if (openDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  onChange={(e) => {
                    if (e.target.checked) {
                      products.forEach((p) => onSelectProduct(p.id));
                    } else {
                      selectedProducts.forEach((id) => onSelectProduct(id));
                    }
                  }}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              // Show skeleton rows while loading
              Array.from({ length: 5 }).map((_, idx) => (
                <SkeletonListRow key={`skeleton-${idx}`} />
              ))
            ) : products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => onSelectProduct(product.id)}
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-12 w-12 flex-shrink-0 relative">
                      {isVideoProduct(product) && getVideoUrl(product) ? (
                        <VideoThumbnail
                          videoUrl={getVideoUrl(product)!}
                          thumbnailUrl={getVideoThumbnailUrl(product) || undefined}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="rounded-lg"
                          preload="none"
                        />
                      ) : product.thumbnailUrl ? (
                        <LazyImage
                          src={fixImageUrl(product.thumbnailUrl)}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg"
                          fallbackSrc="/placeholder-product.png"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      {/* Video indicator for list view */}
                      {isVideoProduct(product) && (
                        <div className="absolute top-0.5 right-0.5 bg-black bg-opacity-70 rounded-full p-0.5">
                          <Play className="w-2 h-2 text-white" fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.brand && (
                        <div className="text-sm text-gray-500">{product.brand}</div>
                      )}
                      {product.shortDescription && (
                        <div className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                          {product.shortDescription}
                        </div>
                      )}
                      <div className="flex gap-1 mt-1">
                        {product.featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Featured
                          </span>
                        )}
                        {product.isNew && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                        {product.isBestSeller && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Best Seller
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    {product.isOnSale && product.compareAtPrice ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(product.basePrice, product.currency)}
                        </div>
                        <div className="text-xs text-gray-500 line-through">
                          {formatPrice(product.compareAtPrice, product.currency)}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(product.basePrice, product.currency)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {product.trackInventory ? (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(
                        product.inventoryQuantity
                      )}`}
                    >
                      {getStockStatusText(product.inventoryQuantity, product.id)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-400 bg-gray-50">
                      N/A
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      product.status
                    )}`}
                  >
                    {product.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <StarRating 
                    rating={product.averageRating || 0} 
                    totalReviews={product.totalReviews || 0} 
                    size="sm"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView(product.id)}
                      onMouseEnter={() => onPrefetch?.(product.id)}
                      className="text-gray-400 hover:text-gray-600"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {onEdit && (
                      <button
                        onClick={() => onEdit(product.id)}
                        onMouseEnter={() => onPrefetch?.(product.id)}
                        className="text-blue-400 hover:text-orange-600"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setDuplicatingProduct(product);
                        setDuplicateConfirmId(product.id);
                      }}
                      className="text-green-400 hover:text-green-600"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(product.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
      {loading ? (
        // Show skeleton cards while loading
        Array.from({ length: 8 }).map((_, idx) => (
          <SkeletonGridCard key={`skeleton-${idx}`} />
        ))
      ) : products.map((product) => (
        <div
          key={product.id}
          className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden relative"
        >
          {/* Checkbox and Actions */}
          <div className="absolute top-2 left-2 right-2 flex justify-between z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <input
                type="checkbox"
                className="rounded border-gray-300 bg-white shadow-sm"
                checked={selectedProducts.includes(product.id)}
                onChange={() => onSelectProduct(product.id)}
              />
            </div>
            <div 
              className="relative pointer-events-auto"
              ref={(el) => {
                if (el) {
                  dropdownRefs.current.set(product.id, el);
                } else {
                  dropdownRefs.current.delete(product.id);
                }
              }}
            >
              <button 
                onClick={() => setOpenDropdownId(openDropdownId === product.id ? null : product.id)}
                className="p-1 bg-white rounded-full shadow-sm hover:shadow-md transition-colors"
              >
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </button>
              
              {openDropdownId === product.id && (
                <div className="absolute right-0 top-8 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                  <button
                    onClick={() => {
                      onView(product.id);
                      setOpenDropdownId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </button>
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(product.id);
                        setOpenDropdownId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setDuplicatingProduct(product);
                      setDuplicateConfirmId(product.id);
                      setOpenDropdownId(null);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Duplicate</span>
                  </button>
                  {onDelete && (
                    <>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          setDeletingProduct(product);
                          setDeleteConfirmId(product.id);
                          setOpenDropdownId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Product Image/Video - responsive height */}
          <div className="relative h-40 sm:h-44 md:h-48 bg-gray-100 overflow-hidden flex items-center justify-center p-2">
            {isVideoProduct(product) && getVideoUrl(product) ? (
              <LazyVideoThumbnail
                videoUrl={getVideoUrl(product)!}
                thumbnailUrl={getVideoThumbnailUrl(product) || undefined}
                alt={product.name}
                width={300}
                height={192}
                className="w-full h-full"
                preload="none"
                onPlay={() => {
                  // Optional: Add analytics tracking
                  logger.debug(`Video played for product: ${product.name}`)
                }}
                onVisible={() => {
                  // Optional: Add analytics tracking for video visibility
                  logger.debug(`Video thumbnail visible for product: ${product.name}`)
                }}
                placeholder={
                  <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <span className="text-xs text-gray-500">Loading video...</span>
                    </div>
                  </div>
                }
              />
            ) : product.thumbnailUrl ? (
              <LazyImage
                src={fixImageUrl(product.thumbnailUrl)}
                alt={product.name}
                className="w-full h-full transition-transform duration-200 ease-out group-hover:scale-[1.01]"
                fallbackSrc="/placeholder-product.png"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-14 left-2 flex flex-col gap-1">
              {product.featured && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-600 text-white">
                  Featured
                </span>
              )}
              {product.isNew && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-600 text-white">
                  New
                </span>
              )}
              {product.isBestSeller && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Best Seller
                </span>
              )}
              {product.isOnSale && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-600 text-white">
                  Sale
                </span>
              )}
              {product.badge && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: product.badge.color }}
                >
                  {product.badge.text}
                </span>
              )}
            </div>
          </div>

          {/* Product Info - responsive padding */}
          <div className="p-3 md:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
              {product.name}
            </h3>
            {product.brand && (
              <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
            )}
            {product.shortDescription && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {product.shortDescription}
              </p>
            )}

            {/* Price - responsive font size */}
            <div className="mt-2">
              {product.isOnSale && product.compareAtPrice ? (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="text-base md:text-lg font-bold text-gray-900">
                    {formatPrice(product.basePrice, product.currency)}
                  </span>
                  <span className="text-xs md:text-sm text-gray-500 line-through">
                    {formatPrice(product.compareAtPrice, product.currency)}
                  </span>
                </div>
              ) : (
                <span className="text-base md:text-lg font-bold text-gray-900">
                  {formatPrice(product.basePrice, product.currency)}
                </span>
              )}
            </div>

            {/* Stock and Status */}
            <div className="mt-3 flex items-center justify-between">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  product.trackInventory 
                    ? getStockStatusColor(product.inventoryQuantity)
                    : 'text-gray-400 bg-gray-50'
                }`}
              >
                {product.trackInventory ? (
                  <>
                    {product.inventoryQuantity === 0 && (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {getStockStatusText(product.inventoryQuantity, product.id)}
                  </>
                ) : (
                  "Stock N/A"
                )}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  product.status
                )}`}
              >
                {product.status.replace("_", " ")}
              </span>
            </div>

            {/* Rating */}
            <div className="mt-2">
              <StarRating 
                rating={product.averageRating || 0} 
                totalReviews={product.totalReviews || 0} 
                size="sm"
              />
            </div>

            {/* Action Buttons - responsive sizing */}
            <div className="mt-3 md:mt-4 flex items-center gap-1.5 md:gap-2">
              <button
                onClick={() => onView(product.id)}
                className="flex-1 px-2 md:px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                View
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(product.id)}
                  className="flex-1 px-2 md:px-3 py-1.5 text-xs font-medium text-white bg-orange-600 rounded hover:bg-orange-700 transition-colors whitespace-nowrap"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Duplicate Confirmation Modal */}
      {duplicateConfirmId !== null && duplicatingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in-0 zoom-in-95">
            <div className="p-6">
              {/* Icon and Title */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Copy className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Duplicate Product
                  </h3>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to duplicate <span className="font-medium text-gray-900">"{duplicatingProduct.name}"</span>? A copy will be created with "(Copy)" added to the name.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDuplicateConfirmId(null);
                    setDuplicatingProduct(null);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setDuplicateConfirmId(null);
                    setDuplicatingProduct(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (duplicatingProduct) {
                      onDuplicate(duplicatingProduct.id);
                    }
                    setDuplicateConfirmId(null);
                    setDuplicatingProduct(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate Product</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in-0 zoom-in-95">
            <div className="p-6">
              {/* Icon and Title */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Delete Product
                  </h3>
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete <span className="font-medium text-gray-900">"{deletingProduct.name}"</span>? This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeletingProduct(null);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeletingProduct(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (onDelete && deletingProduct) {
                      onDelete(deletingProduct.id);
                    }
                    setDeleteConfirmId(null);
                    setDeletingProduct(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Product</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
