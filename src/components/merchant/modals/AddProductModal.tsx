'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback } from 'react'
import { X, Upload, Plus, Trash2, Loader2, Package, DollarSign, Box, Layers, Image, FolderTree, Truck, Edit2, Check, XCircle } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import type { CreateProductDto, ProductCategory, ProductVariant, ProductMedia } from '@/types/product.types'
import VariantManager from '../VariantManager'
import MediaManager from '../MediaManager'
import BrandSelectorWithImages from '../../ui/BrandSelectorWithImages'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  appId: number
  apiKey?: string
  appSecretKey?: string
}

export default function AddProductModal({ isOpen, onClose, onSuccess, appId, apiKey, appSecretKey }: AddProductModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'inventory' | 'shipping' | 'variants' | 'media' | 'categories'>('basic')
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [productMedia, setProductMedia] = useState<ProductMedia[]>([])
  const [createdProductId, setCreatedProductId] = useState<number | null>(null)
  const [isBrandValid, setIsBrandValid] = useState(true)

  const [formData, setFormData] = useState<CreateProductDto>({
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
    minimumQuantity: 1,
    maximumQuantity: undefined,
    tags: [],
    variants: []
  })

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiService.getCategories({ hierarchy: true })
      if (response.ok && response.data) {
        setCategories(response.data)
      }
    } catch (error) {
      logger.error('Failed to fetch categories:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || creatingCategory) return

    setCreatingCategory(true)
    try {
      const response = await apiService.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        appId: appId,
        iconName: 'Folder',
        iconLibrary: 'lucide-react',
        iconUrl: 'lucide-react:Folder',
        displayType: 'icon' as const
      })

      if (response.ok) {
        await fetchCategories()
        setNewCategoryName('')
        setNewCategoryDescription('')
        setShowAddCategory(false)
      }
    } catch (error) {
      logger.error('Failed to add category:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleUpdateCategory = async (categoryId: number) => {
    if (!editingCategoryName.trim()) return
    
    try {
      const headers: any = {}
      if (apiKey) headers['x-api-key'] = apiKey
      if (appSecretKey) headers['x-app-secret'] = appSecretKey
      
      const response = await apiService.updateCategory(categoryId, {
        name: editingCategoryName.trim()
      })
      
      if (response.ok) {
        await fetchCategories()
        setEditingCategoryId(null)
        setEditingCategoryName('')
      }
    } catch (error) {
      logger.error('Failed to update category:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    setDeletingCategoryId(categoryId)
    try {
      const headers: any = {}
      if (apiKey) headers['x-api-key'] = apiKey
      if (appSecretKey) headers['x-app-secret'] = appSecretKey
      
      const response = await apiService.deleteCategory(categoryId)
      
      if (response.ok) {
        await fetchCategories()
        // Remove the deleted category from selected categories
        if (formData.categoryIds?.includes(categoryId)) {
          handleInputChange('categoryIds', formData.categoryIds.filter(id => id !== categoryId))
        }
      }
    } catch (error) {
      logger.error('Failed to delete category:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      alert('Failed to delete category. It may have products assigned to it.')
    } finally {
      setDeletingCategoryId(null)
    }
  }

  const createBrand = async (brandName: string): Promise<{ success: boolean; brandId?: number }> => {
    try {
      logger.debug('Creating brand:', { value: brandName })

      const headers: any = {}
      if (apiKey) headers['x-api-key'] = apiKey
      if (appSecretKey) headers['x-app-secret'] = appSecretKey

      const response = await fetch('/api/proxy/v1/merchant/brands', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: brandName,
          isActive: true,
          displayOrder: 0
        }),
      })

      if (response.ok) {
        const data = await response.json()
        logger.debug('Brand created successfully:', { value: data })
        const brandId = data.id || data.data?.id
        return { success: true, brandId }
      } else {
        const error = await response.json()
        logger.error('Failed to create brand:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
        return { success: false }
      }
    } catch (error) {
      logger.error('Error creating brand:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      return { success: false }
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen, fetchCategories])

  const handleInputChange = (field: keyof CreateProductDto, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }
    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'Price must be greater than 0'
    }
    if (formData.trackInventory && formData.minimumQuantity && formData.minimumQuantity < 0) {
      newErrors.minimumQuantity = 'Minimum quantity cannot be negative'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (status: 'draft' | 'active') => {
    if (!validateForm()) {
      // Switch to the tab with the first error
      const errorFields = Object.keys(errors)
      if (errorFields.includes('name') || errorFields.includes('description')) {
        setActiveTab('basic')
      } else if (errorFields.includes('basePrice')) {
        setActiveTab('pricing')
      }
      return
    }

    setLoading(true)
    try {
      const headers: any = {}
      if (apiKey) headers['x-api-key'] = apiKey
      if (appSecretKey) headers['x-app-secret'] = appSecretKey
      
      const response = await apiService.createProduct({
        ...formData,
        status,
        thumbnailUrl: productMedia.find(m => m.isPrimary)?.url || formData.thumbnailUrl
      })

      if (response.ok && response.data) {
        setCreatedProductId(response.data.id)
        onSuccess()
        onClose()
        resetForm()
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

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
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
      minimumQuantity: 1,
      maximumQuantity: undefined,
      tags: [],
      variants: []
    })
    setErrors({})
    setActiveTab('basic')
    setShowAddCategory(false)
    setNewCategoryName('')
    setNewCategoryDescription('')
    setEditingCategoryId(null)
    setEditingCategoryName('')
    setDeletingCategoryId(null)
    setProductMedia([])
    setCreatedProductId(null)
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'variants', label: 'Variants', icon: Layers },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'categories', label: 'Categories', icon: FolderTree }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-4 px-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full h-[72vh] overflow-hidden flex flex-col shadow-2xl mb-4">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Package className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Add New Product</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="px-4">
            <div className="flex space-x-2 md:space-x-4 overflow-x-auto" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className="py-4 px-2 md:px-3 text-xs whitespace-nowrap transition-all"
                  >
                    <span className={`flex items-center pb-1 ${
                      isActive
                        ? 'font-bold text-gray-900 border-b-[3px] border-orange-600'
                        : 'font-normal text-gray-600 border-b-[3px] border-transparent hover:text-gray-900'
                    }`}>
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="ml-1.5">{tab.label}</span>
                      {/* Special badges for certain tabs */}
                      {tab.id === 'variants' && formData.variants && formData.variants.length > 0 && (
                        <span className={`ml-1 px-1 py-0.5 text-[10px] rounded-full ${
                          isActive ? 'bg-blue-100 text-orange-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {formData.variants.length}
                        </span>
                      )}
                      {tab.id === 'categories' && formData.categoryIds && formData.categoryIds.length > 0 && (
                        <span className={`ml-1 px-1 py-0.5 text-[10px] rounded-full ${
                          isActive ? 'bg-blue-100 text-orange-700' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {formData.categoryIds.length}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-2.5 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <BrandSelectorWithImages
                    value={formData.brandId || formData.brand || ''}
                    onChange={(brandId, brandName) => {
                      handleInputChange('brandId', brandId)
                      handleInputChange('brand', brandName)
                    }}
                    onCreateBrand={createBrand}
                    apiKey={apiKey}
                    appSecretKey={appSecretKey}
                    appId={appId}
                    placeholder="Select or create brand"
                    disabled={loading}
                    onValidationChange={setIsBrandValid}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Brief product description"
                    maxLength={500}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter product description"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Stock keeping unit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Product barcode"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                  />
                  <span className="ml-1.5 text-sm text-gray-700">Featured Product</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDigital}
                    onChange={(e) => {
                      handleInputChange('isDigital', e.target.checked)
                      // Digital products don't require shipping
                      if (e.target.checked) {
                        handleInputChange('requiresShipping', false)
                      }
                    }}
                    className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                  />
                  <span className="ml-1.5 text-sm text-gray-700">Digital Product</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isNew || false}
                    onChange={(e) => handleInputChange('isNew', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                  />
                  <span className="ml-1.5 text-sm text-gray-700">New Product</span>
                </label>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price *
                </label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                  className={`w-full px-2.5 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.basePrice ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                {errors.basePrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.basePrice}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compare at Price
                </label>
                <input
                  type="number"
                  value={formData.compareAtPrice || ''}
                  onChange={(e) => handleInputChange('compareAtPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional - Leave empty for fixed pricing. Set higher than base price to show as "on sale" with strikethrough pricing.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Price
                </label>
                <input
                  type="number"
                  value={formData.costPrice || ''}
                  onChange={(e) => handleInputChange('costPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">Cost to acquire/produce the product</p>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="space-y-3">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="trackInventory"
                  checked={formData.trackInventory}
                  onChange={(e) => handleInputChange('trackInventory', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                />
                <label htmlFor="trackInventory" className="ml-2 text-sm font-medium text-gray-700">
                  Track inventory for this product
                </label>
              </div>

              {formData.trackInventory && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Quantity
                      </label>
                      <input
                        type="number"
                        value={formData.minimumQuantity}
                        onChange={(e) => handleInputChange('minimumQuantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Quantity
                      </label>
                      <input
                        type="number"
                        value={formData.maximumQuantity || ''}
                        onChange={(e) => handleInputChange('maximumQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        min="1"
                        placeholder="No limit"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="0"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight Unit
                  </label>
                  <select
                    value={formData.weightUnit}
                    onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <optgroup label="Weight Units">
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="mg">Milligrams (mg)</option>
                      <option value="t">Metric Tons (t)</option>
                      <option value="lb">Pounds (lb)</option>
                      <option value="oz">Ounces (oz)</option>
                      <option value="st">Stones (st)</option>
                      <option value="ct">Carats (ct)</option>
                    </optgroup>
                    <optgroup label="Count Units">
                      <option value="unit">Unit</option>
                      <option value="piece">Piece</option>
                      <option value="box">Box</option>
                      <option value="pack">Pack</option>
                      <option value="set">Set</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <div className="space-y-3">
              {!formData.isDigital && (
                <>
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="requiresShipping"
                      checked={formData.requiresShipping}
                      onChange={(e) => handleInputChange('requiresShipping', e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                    />
                    <label htmlFor="requiresShipping" className="ml-2 text-sm font-medium text-gray-700">
                      This product requires shipping
                    </label>
                  </div>

                  {formData.requiresShipping && (
                    <>
                      {/* Dimensions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Package Dimensions
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Length</label>
                            <input
                              type="number"
                              value={formData.shippingInfo?.length || ''}
                              onChange={(e) => handleInputChange('shippingInfo', {
                                ...formData.shippingInfo,
                                length: e.target.value ? parseFloat(e.target.value) : undefined
                              })}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="0"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Width</label>
                            <input
                              type="number"
                              value={formData.shippingInfo?.width || ''}
                              onChange={(e) => handleInputChange('shippingInfo', {
                                ...formData.shippingInfo,
                                width: e.target.value ? parseFloat(e.target.value) : undefined
                              })}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="0"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Height</label>
                            <input
                              type="number"
                              value={formData.shippingInfo?.height || ''}
                              onChange={(e) => handleInputChange('shippingInfo', {
                                ...formData.shippingInfo,
                                height: e.target.value ? parseFloat(e.target.value) : undefined
                              })}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="0"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Unit</label>
                            <select
                              value={formData.shippingInfo?.dimensionUnit || 'cm'}
                              onChange={(e) => handleInputChange('shippingInfo', {
                                ...formData.shippingInfo,
                                dimensionUnit: e.target.value
                              })}
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                              <option value="cm">cm</option>
                              <option value="in">in</option>
                              <option value="m">m</option>
                              <option value="ft">ft</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Class and Processing Time */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Shipping Class
                          </label>
                          <select
                            value={formData.shippingInfo?.shippingClass || 'standard'}
                            onChange={(e) => handleInputChange('shippingInfo', {
                              ...formData.shippingInfo,
                              shippingClass: e.target.value
                            })}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="standard">Standard Shipping</option>
                            <option value="express">Express Shipping</option>
                            <option value="overnight">Overnight Shipping</option>
                            <option value="economy">Economy Shipping</option>
                            <option value="fragile">Fragile Item</option>
                            <option value="heavy">Heavy Item</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Processing Time
                          </label>
                          <input
                            type="text"
                            value={formData.shippingInfo?.processingTime || ''}
                            onChange={(e) => handleInputChange('shippingInfo', {
                              ...formData.shippingInfo,
                              processingTime: e.target.value
                            })}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="1-2 business days"
                          />
                        </div>
                      </div>

                      {/* Shipping Options */}
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.shippingInfo?.freeShipping || false}
                            onChange={(e) => handleInputChange('shippingInfo', {
                              ...formData.shippingInfo,
                              freeShipping: e.target.checked
                            })}
                            className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Free Shipping</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.shippingInfo?.calculatedShipping || false}
                            onChange={(e) => handleInputChange('shippingInfo', {
                              ...formData.shippingInfo,
                              calculatedShipping: e.target.checked
                            })}
                            className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Calculate shipping at checkout</span>
                        </label>
                      </div>

                      {/* Flat Rate */}
                      {!formData.shippingInfo?.freeShipping && !formData.shippingInfo?.calculatedShipping && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Flat Shipping Rate
                          </label>
                          <input
                            type="number"
                            value={formData.shippingInfo?.flatRate || ''}
                            onChange={(e) => handleInputChange('shippingInfo', {
                              ...formData.shippingInfo,
                              flatRate: e.target.value ? parseFloat(e.target.value) : undefined
                            })}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Return Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Policy
                </label>
                <textarea
                  value={formData.returnPolicy || ''}
                  onChange={(e) => handleInputChange('returnPolicy', e.target.value)}
                  rows={3}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Describe your return policy..."
                />
              </div>

              {/* Warranty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Information
                </label>
                <textarea
                  value={formData.warranty || ''}
                  onChange={(e) => handleInputChange('warranty', e.target.value)}
                  rows={2}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Warranty details (e.g., 1 year manufacturer warranty)"
                />
              </div>

              {formData.isDigital && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    Digital products don't require shipping. You can still set return policy and warranty information.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Variants Tab */}
          {activeTab === 'variants' && (
            <div className="space-y-3">
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Add product variants for different options like size, color, or material. Each variant can have its own SKU, price, and inventory.
                </p>
              </div>
              <VariantManager
                variants={formData.variants || []}
                onVariantsChange={(variants) => handleInputChange('variants', variants)}
              />
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-3">
              {!createdProductId ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Please save the product first to upload media</p>
                  <p className="text-xs text-gray-500">Click "Save as Draft" or "Save & Publish" to enable image and video uploads</p>
                </div>
              ) : (
                <MediaManager
                  productId={createdProductId}
                  media={productMedia}
                  onMediaChange={(newMedia) => {
                    setProductMedia(newMedia)
                    // Update thumbnail URL if primary image changes
                    const primaryImage = newMedia.find(m => m.isPrimary)
                    if (primaryImage) {
                      handleInputChange('thumbnailUrl', primaryImage.url)
                    }
                  }}
                  onUpload={async (file) => {
                    try {
                      const headers: any = {}
                      if (apiKey) headers['x-api-key'] = apiKey
                      if (appSecretKey) headers['x-app-secret'] = appSecretKey
                      
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
                  }}
                  onDelete={async (mediaId) => {
                    try {
                      const headers: any = {}
                      if (apiKey) headers['x-api-key'] = apiKey
                      if (appSecretKey) headers['x-app-secret'] = appSecretKey
                      
                      const response = await apiService.deleteProductMedia(createdProductId, mediaId)
                      return response.ok
                    } catch (err) {
                      logger.error('Delete failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return false
                    }
                  }}
                  onSetPrimary={async (mediaId) => {
                    try {
                      const headers: any = {}
                      if (apiKey) headers['x-api-key'] = apiKey
                      if (appSecretKey) headers['x-app-secret'] = appSecretKey
                      
                      const response = await apiService.setProductMediaAsThumbnail(createdProductId, mediaId)
                      return response.ok
                    } catch (err) {
                      logger.error('Set primary failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return false
                    }
                  }}
                  onSetListingThumbnail={async (mediaId) => {
                    try {
                      const headers: any = {}
                      if (apiKey) headers['x-api-key'] = apiKey
                      if (appSecretKey) headers['x-app-secret'] = appSecretKey
                      
                      const response = await apiService.setProductMediaAsThumbnail(createdProductId, mediaId)
                      return response.ok
                    } catch (err) {
                      logger.error('Set listing thumbnail failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return false
                    }
                  }}
                  onSetDetailThumbnail={async (mediaId) => {
                    try {
                      const headers: any = {}
                      if (apiKey) headers['x-api-key'] = apiKey
                      if (appSecretKey) headers['x-app-secret'] = appSecretKey
                      
                      const response = await apiService.setProductMediaAsDetailThumbnail(createdProductId, mediaId)
                      return response.ok
                    } catch (err) {
                      logger.error('Set detail thumbnail failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return false
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Categories
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    disabled={creatingCategory}
                    className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Category</span>
                  </button>
                </div>

                {/* Add New Category Form */}
                {showAddCategory && (
                  <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        disabled={creatingCategory}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:bg-gray-100"
                      />
                      <input
                        type="text"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="Category description (optional)"
                        disabled={creatingCategory}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:bg-gray-100"
                      />
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          disabled={creatingCategory || !newCategoryName.trim()}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          {creatingCategory ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                              Creating...
                            </>
                          ) : (
                            'Create'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCategory(false)
                            setNewCategoryName('')
                            setNewCategoryDescription('')
                          }}
                          disabled={creatingCategory}
                          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {categories.length === 0 ? (
                    <p className="text-gray-500 text-sm">No categories available. Click "Add Category" to create one.</p>
                  ) : (
                    categories.map(category => (
                      <div key={category.id} className="flex items-center justify-between group hover:bg-gray-50 p-1 rounded">
                        <label className="flex items-center flex-1">
                          <input
                            type="checkbox"
                            value={category.id}
                            checked={formData.categoryIds?.includes(category.id)}
                            onChange={(e) => {
                              const categoryId = parseInt(e.target.value)
                              if (e.target.checked) {
                                handleInputChange('categoryIds', [...(formData.categoryIds || []), categoryId])
                              } else {
                                handleInputChange('categoryIds', formData.categoryIds?.filter(id => id !== categoryId))
                              }
                            }}
                            className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                          />
                          {editingCategoryId === category.id ? (
                            <div className="ml-2 flex items-center space-x-2 flex-1">
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateCategory(category.id)}
                                className="p-1 hover:bg-green-100 rounded text-green-600"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategoryId(null)
                                  setEditingCategoryName('')
                                }}
                                className="p-1 hover:bg-red-100 rounded text-red-600"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="ml-2 text-sm text-gray-700 flex-1">{category.name}</span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategoryId(category.id)
                                    setEditingCategoryName(category.name)
                                  }}
                                  className="p-1 hover:bg-blue-100 rounded text-orange-600"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCategory(category.id)}
                                  disabled={deletingCategoryId === category.id}
                                  className="p-1 hover:bg-red-100 rounded text-red-600 disabled:opacity-50"
                                >
                                  {deletingCategoryId === category.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </>
                          )}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(', ')}
                  onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter tags separated by commas"
                />
                <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="px-4 py-3 border-t border-gray-200 flex justify-between bg-gray-50">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSubmit('active')}
              disabled={loading}
              className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}