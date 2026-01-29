'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiService } from '@/lib/api-service'
import { logger } from '@/lib/logger'
import type { CreateProductDto, ProductMedia, ProductVariant } from '@/types/product.types'
import { useCategories, useMerchantAuth } from '@/hooks'
import SimpleMediaManager from '../SimpleMediaManager'
import VariantManager from '../VariantManager'

interface ShopifyProductProps {
  appId: number
  apiKey?: string
  appSecretKey?: string
  onSuccess?: () => void
}

const initialFormData: CreateProductDto = {
  name: '',
  brand: '',
  brandId: undefined,
  description: '',
  shortDescription: '',
  sku: '',
  barcode: '',
  basePrice: 0,
  compareAtPrice: undefined,
  costPrice: undefined,
  thumbnailUrl: '',
  weight: undefined,
  weightUnit: 'kg',
  status: 'draft',
  featured: false,
  isNew: false,
  isDigital: false,
  requiresShipping: true,
  shippingInfo: {
    width: undefined,
    height: undefined,
    length: undefined,
    dimensionUnit: 'cm',
    shippingClass: 'standard',
    processingTime: '1-2 business days',
    shippingZones: [],
    freeShipping: false,
    flatRate: undefined,
    calculatedShipping: false
  },
  returnPolicy: '',
  warranty: '',
  categoryIds: [],
  trackInventory: true,
  inventoryQuantity: 0,
  minimumQuantity: 1,
  maximumQuantity: undefined,
  tags: [],
  variants: []
}

const ShopifyProduct = ({ appId, apiKey, appSecretKey, onSuccess }: ShopifyProductProps) => {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [createdProductId, setCreatedProductId] = useState<number | null>(null)
  const [productMedia, setProductMedia] = useState<ProductMedia[]>([])
  const [tempUploadedMedia, setTempUploadedMedia] = useState<File[]>([])
  const [hasUnsavedVariant, setHasUnsavedVariant] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [showPackageModal, setShowPackageModal] = useState(false)
  const [packageType, setPackageType] = useState<'box' | 'envelope' | 'soft'>('box')

  const [formData, setFormData] = useState<CreateProductDto>(initialFormData)

  const { headers } = useMerchantAuth(apiKey, appSecretKey)
  const { categories } = useCategories({
    appId,
    headers: headers || undefined
  })

  useEffect(() => {
    if (apiKey && typeof window !== 'undefined') {
      localStorage.setItem('userApiKey', apiKey)
    }
    if (appSecretKey && typeof window !== 'undefined') {
      localStorage.setItem('appSecretKey', appSecretKey)
    }
  }, [apiKey, appSecretKey])

  const flattenedCategories = useMemo(() => {
    const result: Array<{ id: number; name: string }> = []
    const walk = (items: any[], prefix = '') => {
      items.forEach(item => {
        const label = prefix ? `${prefix} / ${item.name}` : item.name
        result.push({ id: item.id, name: label })
        if (item.children && item.children.length > 0) {
          walk(item.children, label)
        }
      })
    }
    walk(categories || [])
    return result
  }, [categories])

  const handleInputChange = <K extends keyof CreateProductDto>(key: K, value: CreateProductDto[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleTagChange = (value: string) => {
    setTagInput(value)
    const tags = value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
    handleInputChange('tags', tags)
  }

  const handleOpenPackageModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    setShowPackageModal(true)
    const details = event.currentTarget.closest('details')
    if (details) {
      details.removeAttribute('open')
    }
  }

  const handlePriceChange = (value: string) => {
    const parsed = Number.parseFloat(value)
    handleInputChange('basePrice', Number.isNaN(parsed) ? 0 : parsed)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }
    if (!formData.basePrice || formData.basePrice <= 0) {
      newErrors.basePrice = 'Price must be greater than 0'
    }
    if (hasUnsavedVariant) {
      newErrors.variants = 'Please save or cancel the current variant before saving'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleDiscard = () => {
    setFormData(initialFormData)
    setErrors({})
    setSuccessMessage(null)
    setMediaError(null)
    setCreatedProductId(null)
    setTagInput('')
    setHasUnsavedVariant(false)
    setTempUploadedMedia([])
    setProductMedia(prev => {
      prev.forEach(m => {
        if (m.isTemporary && m.url.startsWith('blob:')) {
          URL.revokeObjectURL(m.url)
        }
      })
      return []
    })
  }

  const handleSave = async (status: 'draft' | 'active') => {
    setSuccessMessage(null)
    setMediaError(null)
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await apiService.createProduct({
        ...formData,
        status,
        thumbnailUrl: productMedia.find(m => m.isPrimary)?.url || formData.thumbnailUrl
      })

      if (response.ok && response.data) {
        const newProductId = response.data.id
        setCreatedProductId(newProductId)

        if (tempUploadedMedia.length > 0 && newProductId) {
          try {
            const uploadFormData = new FormData()
            tempUploadedMedia.forEach(file => {
              if (file.type.startsWith('image/')) {
                uploadFormData.append('files', file)
              }
            })

            const uploadResponse = await apiService.uploadProductMedia(newProductId, uploadFormData)
            if (uploadResponse.ok && uploadResponse.data?.media) {
              const buildMediaStrictKey = (media: ProductMedia) =>
                `${media.originalFileName || ''}|${media.fileSize || ''}|${media.mimeType || ''}`
              const buildMediaNameKey = (media: ProductMedia) => media.originalFileName || ''

              const mapUploadedMedia = (uploaded: any): ProductMedia => ({
                id: uploaded.id,
                url: uploaded.mediaUrl || uploaded.cdnUrl || uploaded.thumbnailUrl || '',
                type: uploaded.type || 'image',
                altText: uploaded.altText || '',
                displayOrder: uploaded.displayOrder || 0,
                isPrimary: uploaded.isPrimary || false,
                isListingThumbnail: uploaded.isListingThumbnail || false,
                isDetailThumbnail: uploaded.isDetailThumbnail || false,
                thumbnailUrl: uploaded.thumbnailUrl,
                duration: uploaded.duration,
                fileSize: uploaded.fileSize,
                width: uploaded.width,
                height: uploaded.height,
                mimeType: uploaded.mimeType,
                originalFileName: uploaded.originalFileName
              })

              setProductMedia(prev => {
                const tempMedia = prev.filter(m => m.isTemporary)
                const permanentMedia = prev.filter(m => !m.isTemporary)

                const tempMediaStrictMap = new Map<string, ProductMedia[]>()
                const tempMediaNameMap = new Map<string, ProductMedia[]>()
                tempMedia.forEach(mediaItem => {
                  const strictKey = buildMediaStrictKey(mediaItem)
                  const nameKey = buildMediaNameKey(mediaItem)
                  const strictList = tempMediaStrictMap.get(strictKey) || []
                  strictList.push(mediaItem)
                  tempMediaStrictMap.set(strictKey, strictList)
                  if (nameKey) {
                    const nameList = tempMediaNameMap.get(nameKey) || []
                    nameList.push(mediaItem)
                    tempMediaNameMap.set(nameKey, nameList)
                  }
                })

                const takeTempMatch = (mapped: ProductMedia) => {
                  const strictKey = buildMediaStrictKey(mapped)
                  const nameKey = buildMediaNameKey(mapped)
                  let match = tempMediaStrictMap.get(strictKey)?.shift()
                  if (!match && nameKey) {
                    match = tempMediaNameMap.get(nameKey)?.shift()
                  }
                  if (match) {
                    const matchStrictKey = buildMediaStrictKey(match)
                    const matchNameKey = buildMediaNameKey(match)
                    const strictList = tempMediaStrictMap.get(matchStrictKey)?.filter(item => item !== match) || []
                    if (strictList.length > 0) {
                      tempMediaStrictMap.set(matchStrictKey, strictList)
                    } else {
                      tempMediaStrictMap.delete(matchStrictKey)
                    }
                    if (matchNameKey) {
                      const nameList = tempMediaNameMap.get(matchNameKey)?.filter(item => item !== match) || []
                      if (nameList.length > 0) {
                        tempMediaNameMap.set(matchNameKey, nameList)
                      } else {
                        tempMediaNameMap.delete(matchNameKey)
                      }
                    }
                  }
                  return match
                }

                const mappedUploadedMedia = uploadResponse.data.media.map((uploadedItem: any) => {
                  const mapped = mapUploadedMedia(uploadedItem)
                  const match = takeTempMatch(mapped)
                  if (match) {
                    mapped.isPrimary = !!match.isPrimary
                    mapped.isListingThumbnail = !!match.isListingThumbnail
                    mapped.isDetailThumbnail = !!match.isDetailThumbnail
                  }
                  return mapped
                })

                const updatedMedia = [...permanentMedia, ...mappedUploadedMedia]
                tempMedia.forEach(m => {
                  if (m.url.startsWith('blob:')) {
                    URL.revokeObjectURL(m.url)
                  }
                })
                return updatedMedia
              })

              setTempUploadedMedia([])
            }
          } catch (uploadError) {
            logger.error('Error uploading temporary media:', { error: uploadError instanceof Error ? uploadError.message : String(uploadError), stack: uploadError instanceof Error ? uploadError.stack : undefined })
          }
        }

        setSuccessMessage('Product saved successfully')
        onSuccess?.()
      } else {
        setErrors({ submit: response.data?.message || 'Failed to create product' })
      }
    } catch (error) {
      logger.error('Error creating product:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      setErrors({ submit: 'An error occurred while creating the product' })
    } finally {
      setLoading(false)
    }
  }

  const handleVariantsChange = (variants: ProductVariant[]) => {
    handleInputChange('variants', variants)
  }

  const hasErrors = Object.keys(errors).length > 0
  const saveDisabled = loading || hasUnsavedVariant

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-3 flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50"
              onClick={handleDiscard}
              disabled={loading}
            >
              Discard
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-xs font-medium ${saveDisabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-500'}`}
              onClick={() => handleSave(formData.status === 'active' ? 'active' : 'draft')}
              disabled={saveDisabled}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-6 py-5 md:py-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Add Product</h1>

        {hasErrors && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {errors.submit || errors.name || errors.basePrice || errors.variants || errors.media}
          </div>
        )}
        {successMessage && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="mt-5 md:mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-5">
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white"
                    value={formData.categoryIds?.[0] || ''}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      handleInputChange('categoryIds', value ? [value] : [])
                    }}
                  >
                    <option value="">Select the category</option>
                    {flattenedCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <div className="mt-1 rounded-lg border border-gray-200">
                  <textarea
                    className="w-full min-h-[140px] rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
                    placeholder="Enter product description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Product Tags</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="Enter tag name"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                  />
                  <button
                    className="h-10 w-10 rounded-lg bg-orange-500 text-white text-lg leading-none"
                    onClick={() => {
                      const next = tagInput.trim()
                      if (!next) return
                      const merged = [...(formData.tags || []), next]
                      handleInputChange('tags', merged)
                      setTagInput('')
                    }}
                    type="button"
                  >
                    +
                  </button>
                </div>
                {(formData.tags || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(formData.tags || []).map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <h2 className="text-sm font-semibold text-gray-900">Media</h2>
              <div className="mt-3">
                <SimpleMediaManager
                  productId={createdProductId || undefined}
                  media={productMedia}
                  onMediaChange={(newMedia) => {
                    setProductMedia(newMedia)
                    const primaryImage = newMedia.find(m => m.isPrimary)
                    if (primaryImage) {
                      handleInputChange('thumbnailUrl', primaryImage.url)
                    }
                  }}
                  onUpload={async (file) => {
                    if (!file.type.startsWith('image/')) {
                      setMediaError('Only image files are allowed')
                      setErrors(prev => ({ ...prev, media: 'Only image files are allowed' }))
                      return null
                    }
                    setMediaError(null)
                    setErrors(prev => {
                      if (!prev.media) return prev
                      const { media, ...rest } = prev
                      return rest
                    })

                    if (createdProductId) {
                      try {
                        const formData = new FormData()
                        formData.append('files', file)
                        const response = await apiService.uploadProductMedia(createdProductId, formData)
                        if (response.ok && response.data?.media && response.data.media.length > 0) {
                          return response.data.media[0]
                        }
                        return null
                      } catch (err) {
                        logger.error('Upload failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                        return null
                      }
                    } else {
                      const tempId = `temp-${Date.now()}-${Math.random()}`
                      const previewUrl = URL.createObjectURL(file)
                      const currentImages = productMedia.filter(m => m.type === 'image' || !m.type)
                      const isFirstImage = currentImages.length === 0

                      const tempMedia: ProductMedia = {
                        id: tempId as any,
                        url: previewUrl,
                        type: 'image',
                        altText: '',
                        displayOrder: productMedia.length,
                        isPrimary: isFirstImage,
                        isListingThumbnail: isFirstImage,
                        isDetailThumbnail: isFirstImage,
                        thumbnailUrl: previewUrl,
                        originalFileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type,
                        isTemporary: true
                      }

                      setProductMedia(prev => [...prev, tempMedia])
                      setTempUploadedMedia(prev => [...prev, file])

                      return tempMedia
                    }
                  }}
                  onDelete={async (mediaId) => {
                    if (createdProductId) {
                      try {
                        const response = await apiService.deleteProductMedia(createdProductId, mediaId)
                        return response.ok
                      } catch (err) {
                        logger.error('Delete failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                        return false
                      }
                    } else {
                      setProductMedia(prev => {
                        const mediaToDelete = prev.find(m => m.id === mediaId)
                        if (mediaToDelete?.isTemporary && mediaToDelete.url.startsWith('blob:')) {
                          URL.revokeObjectURL(mediaToDelete.url)
                        }

                        const tempMediaIndex = prev.findIndex(m => m.id === mediaId && m.isTemporary)
                        if (tempMediaIndex !== -1) {
                          setTempUploadedMedia(files => {
                            const newFiles = [...files]
                            newFiles.splice(tempMediaIndex, 1)
                            return newFiles
                          })
                        }
                        return prev.filter(m => m.id !== mediaId)
                      })
                      return true
                    }
                  }}
                  onSetPrimary={async (mediaId) => {
                    if (!createdProductId || typeof mediaId !== 'number') {
                      return true
                    }
                    try {
                      const response = await apiService.setProductMediaAsThumbnail(createdProductId, mediaId)
                      return response.ok
                    } catch (err) {
                      logger.error('Set primary failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return false
                    }
                  }}
                  onSetListingThumbnail={async (mediaId) => {
                    if (!createdProductId || typeof mediaId !== 'number') {
                      return true
                    }
                    try {
                      const response = await apiService.setProductMediaAsThumbnail(createdProductId, mediaId)
                      return response.ok
                    } catch (err) {
                      logger.error('Set listing thumbnail failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return false
                    }
                  }}
                  onSetDetailThumbnail={async (mediaId) => {
                    if (!createdProductId || typeof mediaId !== 'number') {
                      return true
                    }
                    try {
                      const response = await apiService.setProductMediaAsDetailThumbnail(createdProductId, mediaId)
                      return response.ok
                    } catch (err) {
                      logger.error('Set detail thumbnail failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return false
                    }
                  }}
                  loading={loading}
                  disabled={loading}
                />
                {mediaError && (
                  <div className="mt-1 text-xs text-red-500">{mediaError}</div>
                )}
              </div>
            </div>

           

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <h2 className="text-sm font-semibold text-gray-900">Price</h2>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Rs</span>
                  <input
                    className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="0.00"
                    value={formData.basePrice ? formData.basePrice : ''}
                    onChange={(e) => handlePriceChange(e.target.value)}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded-full bg-gray-100 px-3 py-1">Compare at</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1">Unit price</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1">Charge tax</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1">Cost per item</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Inventory</h2>
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs text-gray-500"
                  onClick={() => handleInputChange('trackInventory', !formData.trackInventory)}
                >
                  Inventory tracked
                  <div className={`h-5 w-9 rounded-full relative ${formData.trackInventory ? 'bg-emerald-400' : 'bg-gray-200'}`}>
                    <div className={`h-4 w-4 rounded-full bg-white border border-gray-300 absolute top-0.5 transition-all ${formData.trackInventory ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-gray-200">
                <div className="grid grid-cols-[1fr_120px] text-xs text-gray-500 border-b border-gray-100 px-3 py-2">
                  <span>Quantity</span>
                  <span className="text-right">Quantity</span>
                </div>
                <div className="grid grid-cols-[1fr_120px] items-center px-3 py-3 text-sm">
                  <span>188, 248 Hill Street</span>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-right"
                    value={formData.inventoryQuantity ?? 0}
                    onChange={(e) => handleInputChange('inventoryQuantity', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-gray-100 px-3 py-1">SKU</span>
                <span className="rounded-full bg-gray-100 px-3 py-1">Barcode</span>
                <span className="rounded-full bg-gray-100 px-3 py-1">Sell when out of stock</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Shipping</h2>
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs text-gray-500"
                  onClick={() => handleInputChange('requiresShipping', !formData.requiresShipping)}
                >
                  Physical product
                  <div className={`h-5 w-9 rounded-full relative ${formData.requiresShipping ? 'bg-emerald-400' : 'bg-gray-200'}`}>
                    <div className={`h-4 w-4 rounded-full bg-white border border-gray-300 absolute top-0.5 transition-all ${formData.requiresShipping ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Package</label>
                  <details className="relative mt-1">
                    <summary className="list-none cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white flex items-center justify-between">
                      <span>Store default</span>
                      <span className="text-xs text-gray-400">v</span>
                    </summary>
                    <div className="absolute left-0 right-0 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg z-10 text-sm text-gray-700">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 font-medium"
                        onClick={handleOpenPackageModal}
                      >
                        Add new package
                      </button>
                      <div className="border-t border-gray-100" />
                      <div className="px-3 py-2 bg-gray-50 text-gray-900 font-medium">
                        Store default
                      </div>
                      <div className="border-t border-gray-100" />
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
                      >
                        Manage packages
                      </button>
                    </div>
                  </details>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Product weight</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="0.0"
                      value={formData.weight ?? ''}
                      onChange={(e) => handleInputChange('weight', Number(e.target.value))}
                    />
                    <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">kg</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-gray-100 px-3 py-1">Country of origin</span>
                <span className="rounded-full bg-gray-100 px-3 py-1">HS Code</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <h2 className="text-sm font-semibold text-gray-900">Variants</h2>
              <div className="mt-3">
                <VariantManager
                  variants={formData.variants || []}
                  onVariantsChange={handleVariantsChange}
                  onEditingStateChange={(hasUnsaved) => setHasUnsavedVariant(hasUnsaved)}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Search engine listing</h2>
                <button className="text-gray-400 hover:text-gray-600">Edit</button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Add a title and description to see how this product might appear in a search engine listing
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <h2 className="text-sm font-semibold text-gray-900">Product Options</h2>
              <div className="mt-3 space-y-3 text-sm text-gray-600">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-orange-500"
                    checked={!!formData.isNew}
                    onChange={(e) => handleInputChange('isNew', e.target.checked)}
                  />
                  New Product
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-orange-500"
                    checked={!!formData.isDigital}
                    onChange={(e) => handleInputChange('isDigital', e.target.checked)}
                  />
                  Digital Product
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-orange-500"
                    checked={!!formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                  />
                  Featured Product
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <h2 className="text-sm font-semibold text-gray-900">SKU</h2>
              <input
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Stock Keeping Unit"
                value={formData.sku || ''}
                onChange={(e) => handleInputChange('sku', e.target.value)}
              />
              <label className="mt-4 block text-sm font-medium text-gray-700">Barcode</label>
              <input
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Product barcode"
                value={formData.barcode || ''}
                onChange={(e) => handleInputChange('barcode', e.target.value)}
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <label className="block text-xs font-medium text-gray-500">Status</label>
              <select
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as CreateProductDto['status'])}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Publishing</h2>
                <span className="text-gray-400">Settings</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600">
                  Online Store
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600">
                  Point of Sale
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <h2 className="text-sm font-semibold text-gray-900">Product organization</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500">Type</label>
                  <input className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Vendor</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={formData.brand || ''}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Collections</label>
                  <input className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Search" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500">Tags</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    placeholder="tag1, tag2"
                    value={tagInput}
                    onChange={(e) => handleTagChange(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
              <label className="block text-xs font-medium text-gray-500">Theme template</label>
              <div className="mt-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                Default product
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-sm font-semibold text-gray-900">Add package</h3>
              <button
                type="button"
                onClick={() => setShowPackageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-medium text-gray-600">Package type</p>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPackageType('box')}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    packageType === 'box' ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Box
                </button>
                <button
                  type="button"
                  onClick={() => setPackageType('envelope')}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    packageType === 'envelope' ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Envelope
                </button>
                <button
                  type="button"
                  onClick={() => setPackageType('soft')}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    packageType === 'soft' ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Soft package
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_120px_1fr_90px] gap-2">
                <div>
                  <label className="block text-xs text-gray-500">Length</label>
                  <input className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Width</label>
                  <input className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Height</label>
                  <input
                    className={`mt-1 w-full rounded-lg border px-2 py-1.5 text-sm ${
                      packageType === 'envelope' ? 'border-gray-200 bg-gray-100 text-gray-400' : 'border-gray-200'
                    }`}
                    disabled={packageType === 'envelope'}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Unit</label>
                  <select className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white">
                    <option>cm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Weight (empty)</label>
                  <input className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Unit</label>
                  <select className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm bg-white">
                    <option>kg</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs text-gray-500">Package name</label>
                <input className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
              </div>

              <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300" />
                <span>
                  Use as default package
                  <span className="block text-xs text-gray-500">
                    Used to calculate rates at checkout and pre-selected when buying labels
                  </span>
                </span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setShowPackageModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-500 cursor-not-allowed"
              >
                Add package
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShopifyProduct