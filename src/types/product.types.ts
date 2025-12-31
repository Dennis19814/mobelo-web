export interface ProductCategory {
  id: number
  name: string
  description?: string
  parentId?: number
  productCount?: number
}

export interface ProductVariant {
  id?: number
  sku?: string
  option1Name?: string
  option1Value?: string
  option2Name?: string
  option2Value?: string
  option3Name?: string
  option3Value?: string
  price?: number
  inventoryQuantity?: number
  position?: number
  isDefault?: boolean
}

export interface ProductMedia {
  id?: number
  url: string
  type: 'image' | 'video' | '3d'
  altText?: string
  displayOrder?: number
  isPrimary?: boolean
  isListingThumbnail?: boolean // Featured on product listing pages
  isDetailThumbnail?: boolean // Featured on product detail page
  thumbnailUrl?: string
  duration?: number // For videos in seconds
  fileSize?: number
  width?: number
  height?: number
  mimeType?: string
  originalFileName?: string
  isUploading?: boolean // Flag for optimistic UI updates during upload
  isTemporary?: boolean // Flag for temporary media that hasn't been uploaded yet
}

export interface ProductSpecification {
  id?: number
  name: string
  value: string
  specType?: string
  specKey?: string
  specValue?: string
  specData?: Record<string, any>
}

export interface Product {
  id: number
  appId?: number
  name: string
  description?: string
  shortDescription?: string
  brand?: string
  brandId?: number
  brandEntity?: any
  sku?: string
  barcode?: string
  basePrice: number
  compareAtPrice?: number
  costPrice?: number
  currency?: string
  thumbnailUrl?: string
  thumbnailType?: 'image' | 'video'
  weight?: number
  weightUnit?: 'kg' | 'g' | 'mg' | 'lb' | 'oz' | 't' | 'st' | 'ct' | 'unit' | 'piece' | 'box' | 'pack' | 'set'
  status: 'active' | 'draft' | 'archived' | 'out_of_stock'
  featured: boolean
  isNew?: boolean
  isBestSeller?: boolean
  isOnSale?: boolean
  isAvailable?: boolean
  isDigital?: boolean
  taxable?: boolean
  requiresShipping?: boolean
  trackInventory?: boolean
  inventoryQuantity?: number
  minimumQuantity?: number
  maximumQuantity?: number
  badge?: {
    text: string
    color: string
    icon?: string
  }
  shippingInfo?: Record<string, any>
  returnPolicy?: string
  warranty?: string
  displayOrder?: number
  tags?: string[]
  metadata?: Record<string, any>
  categories?: ProductCategory[]
  variants?: ProductVariant[]
  media?: ProductMedia[]
  specifications?: ProductSpecification[]
  averageRating?: number
  totalReviews?: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string
}

export interface CreateProductDto {
  name: string
  brand?: string
  brandId?: number
  description?: string
  shortDescription?: string
  sku?: string
  barcode?: string
  basePrice: number
  compareAtPrice?: number
  costPrice?: number
  thumbnailUrl?: string
  weight?: number
  weightUnit?: string
  status?: string
  featured?: boolean
  isNew?: boolean
  isDigital?: boolean
  requiresShipping?: boolean
  shippingInfo?: {
    width?: number
    height?: number
    length?: number
    dimensionUnit?: 'cm' | 'in' | 'm' | 'ft'
    shippingClass?: string
    processingTime?: string
    shippingZones?: string[]
    freeShipping?: boolean
    flatRate?: number
    calculatedShipping?: boolean
  }
  returnPolicy?: string
  warranty?: string
  categoryIds?: number[]
  specifications?: ProductSpecification[]
  media?: ProductMedia[]
  variants?: ProductVariant[]
  tags?: string[]
  trackInventory?: boolean
  inventoryQuantity?: number
  minimumQuantity?: number
  maximumQuantity?: number
  metadata?: Record<string, any>
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id?: number
}

export interface ProductFilters {
  search?: string
  categoryId?: number
  categories?: number[]
  brands?: string[]
  brandIds?: number[]
  status?: string | string[]
  featured?: boolean
  isNew?: boolean
  isBestSeller?: boolean
  isOnSale?: boolean
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  stockStatus?: string[]
  page?: number
  limit?: number
  sortBy?: 'name' | 'price' | 'createdAt' | 'featured'
  sortOrder?: 'ASC' | 'DESC'
}

export interface InventoryUpdateDto {
  variantId?: number
  quantity: number
  operation: 'add' | 'subtract' | 'set'
}

export interface ProductsResponse {
  data: Product[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Review-related interfaces
export interface Review {
  id: number
  appId: number
  productId: number
  mobileUserId: number
  rating: number // 1-5 stars
  title?: string
  description?: string
  isVerifiedPurchase: boolean
  helpfulCount: number
  reportCount: number
  isVisible: boolean
  mediaUrls?: string[]
  merchantResponse?: string
  merchantResponseAt?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  // Relations
  mobileUser?: {
    id: number
    firstName: string
    lastName: string
    email?: string
    avatar?: string
  }
  product?: {
    id: number
    name: string
    thumbnailUrl?: string
  }
}

export interface CreateReviewDto {
  rating: number
  title?: string
  description?: string
  mediaUrls?: string[]
}

export interface UpdateReviewDto extends Partial<CreateReviewDto> {}

export interface MerchantResponseDto {
  response: string
}

export interface ReviewQuery {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'rating' | 'helpfulCount'
  sortOrder?: 'ASC' | 'DESC'
  rating?: number // Filter by specific rating
  minRating?: number
  maxRating?: number
  isVerifiedPurchase?: boolean
  hasResponse?: boolean
  isVisible?: boolean
}

export interface ReviewsResponse {
  data: Review[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface RatingSummary {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface ProductWithReviews extends Product {
  reviews?: Review[]
  ratingSummary?: RatingSummary
}
