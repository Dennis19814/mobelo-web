'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Package, DollarSign, Box, Image, FolderTree, Layers, FolderPlus, Edit2, Trash2, Plus, Truck, Sparkles } from 'lucide-react'
import ExtraInfoEditor from '../ExtraInfoEditor'
import Modal from '@/components/ui/Modal'
import VariantManager from '../VariantManager'
import MediaManager from '../MediaManager'
import BrandSelectorWithImages from '../../ui/BrandSelectorWithImages'
import CharacterCount from '@/components/ui/CharacterCount'
import { apiService } from '@/lib/api-service'
import type { Product, UpdateProductDto, ProductCategory, ProductVariant, ProductMedia } from '@/types/product.types'
import { AddCategoryModal } from './AddCategoryModal'
import type { Category } from '@/types/category'
import { useCategories } from '@/hooks/useCategories'
import { useMerchantAuth } from '@/hooks'

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
  onSuccess?: () => void
  apiKey?: string
  appSecretKey?: string
  onCategoriesUpdate?: (categories: any[]) => void
}

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
  apiKey,
  appSecretKey,
  onCategoriesUpdate
}: EditProductModalProps) {
  const [activeStep, setActiveStep] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [basePriceInput, setBasePriceInput] = useState<string>('') // Local state for base price input
  
  const [formData, setFormData] = useState<UpdateProductDto>({
    name: product.name,
    description: product.description || '',
    shortDescription: product.shortDescription || '',
    sku: product.sku || '',
    barcode: product.barcode || '',
    basePrice: product.basePrice,
    compareAtPrice: product.compareAtPrice,
    costPrice: product.costPrice,
    thumbnailUrl: product.thumbnailUrl || '',
    weight: product.weight,
    weightUnit: product.weightUnit || 'kg',
    status: product.status,
    featured: product.featured,
    isDigital: product.isDigital || false,
    isNew: product.isNew || false,
    requiresShipping: product.requiresShipping || false,
    shippingInfo: product.shippingInfo || undefined,
    returnPolicy: product.returnPolicy || '',
    warranty: product.warranty || '',
    categoryIds: product.categories?.map(c => c.id) || [],
    tags: product.tags || [],
    trackInventory: product.trackInventory || false,
    inventoryQuantity: product.inventoryQuantity || 0,
    minimumQuantity: product.minimumQuantity || 1,
    maximumQuantity: product.maximumQuantity || 99999,
    variants: product.variants || [],
    media: product.media || [],
    metadata: product.metadata || {}
  })

  const [productMedia, setProductMedia] = useState<ProductMedia[]>(product.media || [])
  const [tempUploadedMedia, setTempUploadedMedia] = useState<File[]>([]) // Track temporary uploads

  const [errors, setErrors] = useState<Partial<Record<keyof UpdateProductDto, string>>>({})
  const [tagInput, setTagInput] = useState('')
  const [isBrandValid, setIsBrandValid] = useState(true)
  const [hasUnsavedVariant, setHasUnsavedVariant] = useState(false)
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [triggerVariantShake, setTriggerVariantShake] = useState(false)

  // Category management state
  const [localCategories, setLocalCategories] = useState<ProductCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(true)
  const [editingCategory, setEditingCategory] = useState<number | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  // Sync formData with product prop when it changes
  useEffect(() => {
    if (isOpen && product) {
      logger.debug('EditProductModal: Product data received:', {
        productId: product.id,
        name: product.name,
        requiresShipping: product.requiresShipping,
        shippingInfo: product.shippingInfo,
        returnPolicy: product.returnPolicy,
        warranty: product.warranty,
        isNew: product.isNew
      })

      setFormData({
        name: product.name,
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        basePrice: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        costPrice: product.costPrice,
        thumbnailUrl: product.thumbnailUrl || '',
        weight: product.weight,
        weightUnit: product.weightUnit || 'kg',
        status: product.status,
        featured: product.featured,
        isDigital: product.isDigital || false,
        isNew: product.isNew || false,
        requiresShipping: product.requiresShipping || false,
        shippingInfo: product.shippingInfo || undefined,
        returnPolicy: product.returnPolicy || '',
        warranty: product.warranty || '',
        categoryIds: product.categories?.map(c => c.id) || [],
        tags: product.tags || [],
        trackInventory: product.trackInventory || false,
        inventoryQuantity: product.inventoryQuantity || 0,
        minimumQuantity: product.minimumQuantity || 1,
        maximumQuantity: product.maximumQuantity || 99999,
        variants: product.variants || [],
        media: product.media || [],
        metadata: product.metadata || {}
      })

      // Sync basePriceInput with formData when modal opens
      if (product.basePrice === 0 || product.basePrice === undefined) {
        setBasePriceInput('')
      } else {
        setBasePriceInput(product.basePrice.toString())
      }

      logger.debug('EditProductModal: FormData initialized with shipping details:', {
        requiresShipping: product.requiresShipping || false,
        shippingInfo: product.shippingInfo || undefined,
        returnPolicy: product.returnPolicy || '',
        warranty: product.warranty || ''
      })
    }
  }, [isOpen, product])
  
  // Sync basePriceInput when formData.basePrice changes externally
  useEffect(() => {
    if (formData.basePrice === 0 || formData.basePrice === undefined) {
      if (basePriceInput !== '') {
        // Only update if input is not empty (user might be typing)
        // This prevents clearing while user is typing
      }
    } else if (basePriceInput !== formData.basePrice.toString()) {
      // Sync if formData changed externally and input doesn't match
      setBasePriceInput(formData.basePrice.toString())
    }
  }, [formData.basePrice])

  // Fetch existing media when modal opens
  useEffect(() => {
    const fetchProductMedia = async () => {
      if (!isOpen || !product.id) return
      
      try {
        const headers: any = {}
        if (apiKey) headers['x-api-key'] = apiKey
        if (appSecretKey) headers['x-app-secret'] = appSecretKey
        
        const response = await apiService.getProductMedia(product.id)
        if (response.ok && response.data?.media) {
          logger.debug('Fetched product media:', { value: response.data.media })
          // Map backend media format to frontend format
          const mappedMedia = response.data.media.map((m: any) => ({
            id: m.id,
            url: m.mediaUrl || m.cdnUrl || m.thumbnailUrl || '',
            type: m.type || 'image',
            altText: m.altText || '',
            displayOrder: m.displayOrder || 0,
            isPrimary: m.isPrimary || false,
            isListingThumbnail: m.isListingThumbnail || false,
            isDetailThumbnail: m.isDetailThumbnail || false,
            thumbnailUrl: m.thumbnailUrl,
            duration: m.duration,
            fileSize: m.fileSize,
            width: m.width,
            height: m.height,
            mimeType: m.mimeType,
            originalFileName: m.originalFileName
          }))
          setProductMedia(mappedMedia)
          setFormData(prev => ({ ...prev, media: mappedMedia }))
        }
      } catch (err) {
        logger.error('Failed to fetch product media:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
      }
    }
    
    fetchProductMedia()
  }, [isOpen, product.id, apiKey, appSecretKey])

  // Clear variant error when variant is saved or cancelled
  useEffect(() => {
    if (!hasUnsavedVariant && (errors as any).variants) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete (newErrors as any).variants
        return newErrors
      })
    }
  }, [hasUnsavedVariant, errors])

  const fetchCategories = useCallback(async () => {
    try {
      const headers: any = {}
      if (apiKey) headers['x-api-key'] = apiKey
      if (appSecretKey) headers['x-app-secret'] = appSecretKey

      logger.info('🔍 Fetching categories:', { hasApiKey: !!apiKey, hasAppSecret: !!appSecretKey })

      const response = await apiService.getCategories({ hierarchy: true })

      logger.info('📦 Categories response:', {
        ok: response.ok,
        status: response.status,
        dataType: typeof response.data,
        dataIsArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 0,
        data: response.data
      })

      if (response.ok && response.data) {
        logger.info('✅ Setting categories:', { count: Array.isArray(response.data) ? response.data.length : 0 })
        setCategories(response.data)
        setLocalCategories(response.data)
      } else {
        logger.warn('⚠️ Categories response not OK or no data:', { ok: response.ok, hasData: !!response.data })
      }
    } catch (err) {
      // Silently ignore cancelled requests (normal in dev mode with React Strict Mode)
      if (err instanceof Error && (err.name === 'AbortError' || err.message === 'Request was cancelled')) {
        return
      }
      logger.error('❌ Failed to fetch categories:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, appSecretKey, product.appId])

  // Category management functions
  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || creatingCategory) return

    setCreatingCategory(true)
    try {
      // Get the current appId from URL to ensure consistency
      const pathSegments = window.location.pathname.split('/')
      const merchantPanelIndex = pathSegments.indexOf('merchant-panel')
      const currentAppId = merchantPanelIndex !== -1 && pathSegments[merchantPanelIndex + 1]
        ? parseInt(pathSegments[merchantPanelIndex + 1])
        : product.appId || 0

      // Create category through API to get a proper ID
      const headers: any = {}
      if (apiKey) headers['x-api-key'] = apiKey
      if (appSecretKey) headers['x-app-secret'] = appSecretKey

      const categoryData = {
        name: newCategoryName.trim(),
        parentId: selectedParentCategory || undefined,
        appId: currentAppId,
        isActive: true,
        displayOrder: 0,
        iconName: 'Folder',
        iconLibrary: 'lucide-react',
        iconUrl: 'lucide-react:Folder',
        displayType: 'icon' as const
      }

      const response = await apiService.createCategory(categoryData)

      if (response.ok && response.data) {
        // Add the newly created category with the real ID from the backend
        const newCategory: ProductCategory = {
          id: response.data.id,
          name: response.data.name,
          parentId: response.data.parentId
        }

        setLocalCategories(prev => [...prev, newCategory])
        setCategories(prev => [...prev, newCategory])

        // Also update the parent categories list if this was fetched from the API
        if (onCategoriesUpdate) {
          onCategoriesUpdate([...categories, response.data])
        }

        // Clear form and close
        setNewCategoryName('')
        setSelectedParentCategory(null)
        setShowAddCategory(false)
      } else {
        logger.error('Failed to create category:', { value: 'Unknown error' })
        // Show error message instead of creating local category
        setError('Failed to create category. Please try again.')
      }
    } catch (error) {
      logger.error('Error creating category:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      // Show error message instead of creating local category
      setError('Failed to create category. Please check your connection and try again.')
    } finally {
      setCreatingCategory(false)
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

        // Update formData with real brand ID after creation
        const newBrandId = data.id || data.data?.id
        if (newBrandId) {
          handleInputChange('brandId', newBrandId)
          logger.debug('Updated formData brandId to:', { value: newBrandId })
        }

        return { success: true, brandId: newBrandId }
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

  const handleUpdateCategory = (categoryId: number) => {
    if (!editCategoryName.trim()) return
    
    setLocalCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, name: editCategoryName.trim() }
          : cat
      )
    )
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, name: editCategoryName.trim() }
          : cat
      )
    )
    setEditingCategory(null)
    setEditCategoryName('')
    
    // Note: In production, you would call an API to persist this
    // await apiService.put(`/categories/${categoryId}`, { name: editCategoryName });
  }

  const handleDeleteCategory = (categoryId: number) => {
    // Remove category and its subcategories
    const categoriesToDelete = new Set([categoryId])
    const findSubcategories = (parentId: number) => {
      localCategories.forEach(cat => {
        if (cat.parentId === parentId) {
          categoriesToDelete.add(cat.id)
          findSubcategories(cat.id)
        }
      })
    }
    findSubcategories(categoryId)
    
    setLocalCategories(prev => 
      prev.filter(cat => !categoriesToDelete.has(cat.id))
    )
    setCategories(prev => 
      prev.filter(cat => !categoriesToDelete.has(cat.id))
    )
    
    // Remove deleted categories from selected categories
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds?.filter(id => !categoriesToDelete.has(id)) || []
    }))
    
    // Note: In production, you would call an API to persist this
    // await apiService.delete(`/categories/${categoryId}`);
  }

  const getCategoryTree = () => {
    const tree: (ProductCategory & { children?: ProductCategory[] })[] = []
    const categoryMap = new Map<number, ProductCategory & { children?: ProductCategory[] }>()
    
    localCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })
    
    localCategories.forEach(cat => {
      const category = categoryMap.get(cat.id)!
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children?.push(category)
      } else if (!cat.parentId) {
        tree.push(category)
      }
    })
    
    return tree
  }

  // Helper function to get categories with proper nesting indication for dropdown
  const getCategoriesForDropdown = () => {
    const result: Array<{ id: number; name: string; depth: number }> = []
    
    const addCategoryWithDepth = (category: ProductCategory & { children?: ProductCategory[] }, depth: number = 0) => {
      result.push({
        id: category.id,
        name: category.name,
        depth
      })
      
      if (category.children) {
        category.children.forEach(child => {
          addCategoryWithDepth(child, depth + 1)
        })
      }
    }
    
    getCategoryTree().forEach(category => {
      addCategoryWithDepth(category)
    })
    
    return result
  }

  useEffect(() => {
    if (isOpen) {
      setIsEditModalVisible(true)
      setShowAddCategoryModal(false)
      fetchCategories()
      // Reset form data to product values when modal opens
      setFormData({
        name: product.name,
        brandId: product.brandId || undefined,
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        basePrice: product.basePrice,
        // Ensure compareAtPrice is undefined if it's null or 0
        compareAtPrice: product.compareAtPrice || undefined,
        costPrice: product.costPrice || undefined,
        thumbnailUrl: product.thumbnailUrl || '',
        weight: product.weight || undefined,
        weightUnit: product.weightUnit || 'kg',
        status: product.status,
        featured: product.featured,
        isNew: product.isNew || false,
        isDigital: product.isDigital || false,
        categoryIds: product.categories?.map(c => c.id) || [],
        tags: product.tags || [],
        trackInventory: product.trackInventory || false,
        inventoryQuantity: product.inventoryQuantity || 0,
        minimumQuantity: product.minimumQuantity || 1,
        maximumQuantity: product.maximumQuantity || 99999,
        variants: product.variants || [],
        media: product.media || [],
        metadata: product.metadata || {}
      })
      setProductMedia(product.media || [])
      setErrors({})
      setError('')
    }
  }, [isOpen, product, fetchCategories])

  const handleInputChange = (field: keyof UpdateProductDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateProductDto, string>> = {}
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required'
    }
    
    if (formData.basePrice === undefined || formData.basePrice < 0) {
      newErrors.basePrice = 'Valid price is required'
    }
    
    if (formData.compareAtPrice && formData.basePrice !== undefined && formData.compareAtPrice <= formData.basePrice) {
      newErrors.compareAtPrice = 'Compare price must be higher than base price'
    }
    
    // Brand validation is now handled by the BrandSelectorWithAPI component
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e?: React.MouseEvent) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    // If there's an unsaved variant being edited, prevent submission
    if (hasUnsavedVariant) {
      setErrors({ variants: 'Please save or cancel the current variant before updating the product' } as any)
      // Trigger shake animation
      setTriggerVariantShake(true)
      setTimeout(() => setTriggerVariantShake(false), 100)
      // Clear error after 4 seconds
      setTimeout(() => {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete (newErrors as any).variants
          return newErrors
        })
      }, 4000)
      // Navigate to variants step if not already there
      if (currentStepId !== 'variants') {
        const variantsStepIndex = steps.findIndex(s => s.id === 'variants')
        if (variantsStepIndex !== -1) {
          setActiveStep(variantsStepIndex)
        }
      }
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const headers: any = {}
      if (apiKey) headers['x-api-key'] = apiKey
      if (appSecretKey) headers['x-app-secret'] = appSecretKey

      // Step 1: Upload all temporary media files first
      let uploadedRealMedia: ProductMedia[] = []
      if (tempUploadedMedia.length > 0) {
        logger.debug(`Uploading ${tempUploadedMedia.length} temporary media files...`)

        for (const file of tempUploadedMedia) {
          try {
            const formData = new FormData()
            formData.append('files', file)

            const response = await apiService.uploadProductMedia(product.id, formData)
            if (response.ok && response.data?.media && response.data.media.length > 0) {
              const uploadedMedia = response.data.media[0]
              // Map backend format to frontend format
              const mappedMedia: ProductMedia = {
                id: uploadedMedia.id,
                url: uploadedMedia.mediaUrl || uploadedMedia.cdnUrl || uploadedMedia.thumbnailUrl || '',
                type: uploadedMedia.type || 'image',
                altText: uploadedMedia.altText || '',
                displayOrder: uploadedMedia.displayOrder || 0,
                isPrimary: uploadedMedia.isPrimary || false,
                isListingThumbnail: uploadedMedia.isListingThumbnail || false,
                isDetailThumbnail: uploadedMedia.isDetailThumbnail || false,
                thumbnailUrl: uploadedMedia.thumbnailUrl,
                duration: uploadedMedia.duration,
                fileSize: uploadedMedia.fileSize,
                width: uploadedMedia.width,
                height: uploadedMedia.height,
                mimeType: uploadedMedia.mimeType,
                originalFileName: uploadedMedia.originalFileName
              }
              uploadedRealMedia.push(mappedMedia)
            }
          } catch (uploadErr) {
            logger.error('Failed to upload media file:', { error: uploadErr instanceof Error ? uploadErr.message : String(uploadErr) })
            throw new Error('Failed to upload one or more media files')
          }
        }
      }

      // Step 2: Replace temporary media with uploaded real media
      let finalMedia = productMedia.filter(m => !(m as any).isTemporary) // Remove temp media

      // Add uploaded media with correct isPrimary flags from temp media
      uploadedRealMedia.forEach((realMedia, index) => {
        const tempMedia = productMedia.find((m: any) => m.isTemporary && m.displayOrder === realMedia.displayOrder)
        if (tempMedia) {
          realMedia.isPrimary = tempMedia.isPrimary
          realMedia.isListingThumbnail = tempMedia.isListingThumbnail
          realMedia.isDetailThumbnail = tempMedia.isDetailThumbnail
        }
        finalMedia.push(realMedia)
      })

      // Ensure single image is marked as primary
      const images = finalMedia.filter(m => m.type === 'image' || !m.type)
      if (images.length === 1 && !images[0].isPrimary) {
        finalMedia = finalMedia.map(m =>
          m.id === images[0].id ? { ...m, isPrimary: true } : m
        )
      }

      // Normalize variants: trim, coerce numbers, drop half-filled option2/3 pairs
      const trimVal = (v?: string) => (v ?? '').trim()
      const normalizeVariant = (v: ProductVariant): ProductVariant => {
        const nv: ProductVariant = { ...v }
        nv.option1Name = trimVal(nv.option1Name)
        nv.option1Value = trimVal(nv.option1Value)
        const o2n = trimVal(nv.option2Name)
        const o2v = trimVal(nv.option2Value)
        nv.option2Name = o2n && o2v ? o2n : undefined
        nv.option2Value = o2n && o2v ? o2v : undefined
        const o3n = trimVal(nv.option3Name)
        const o3v = trimVal(nv.option3Value)
        nv.option3Name = o3n && o3v ? o3n : undefined
        nv.option3Value = o3n && o3v ? o3v : undefined
        nv.sku = trimVal(nv.sku)
        nv.price = typeof nv.price === 'number' ? nv.price : parseFloat((nv.price as any) || '0') || 0
        nv.inventoryQuantity = typeof nv.inventoryQuantity === 'number' ? nv.inventoryQuantity : parseInt((nv.inventoryQuantity as any) || '0') || 0
        return nv
      }

      const signatureOf = (v: ProductVariant) => {
        const p = (n?: string, val?: string) => `${trimVal(n).toLowerCase()}:${trimVal(val).toLowerCase()}`
        return [p(v.option1Name, v.option1Value), p(v.option2Name, v.option2Value), p(v.option3Name, v.option3Value)].join('||')
      }

      const normalizedVariants = (formData.variants || []).map(normalizeVariant)

      // Validate required Option 1 for all variants
      const invalidOpt1 = normalizedVariants.find(v => !v.option1Name || !v.option1Value)
      if (invalidOpt1) {
        setError('Each variant requires Option 1 name and value (e.g., Size: 8).')
        setLoading(false)
        return
      }

      // Validate duplicate SKUs
      const skuSet = new Set<string>()
      for (const v of normalizedVariants) {
        const sku = trimVal(v.sku)
        if (!sku) continue
        const k = sku.toLowerCase()
        if (skuSet.has(k)) {
          setError('Duplicate SKU detected. Each variant must have a unique SKU.')
          setLoading(false)
          return
        }
        skuSet.add(k)
      }

      // Validate duplicate combinations
      const sigSet = new Set<string>()
      for (const v of normalizedVariants) {
        const sig = signatureOf(v)
        if (sigSet.has(sig)) {
          setError('Duplicate variant combination detected. Ensure each row has a unique set of options.')
          setLoading(false)
          return
        }
        sigSet.add(sig)
      }

      // Determine if variants actually changed to avoid heavy delete+reinsert when not needed
      const baseVariants = (product.variants || []).map(v => ({
        sku: (v as any).sku || '',
        option1Name: (v as any).option1Name || '',
        option1Value: (v as any).option1Value || '',
        option2Name: (v as any).option2Name || '',
        option2Value: (v as any).option2Value || '',
        option3Name: (v as any).option3Name || '',
        option3Value: (v as any).option3Value || '',
        price: typeof (v as any).price === 'number' ? (v as any).price : parseFloat(((v as any).price || '0') as any) || 0,
        inventoryQuantity: typeof (v as any).inventoryQuantity === 'number' ? (v as any).inventoryQuantity : parseInt(((v as any).inventoryQuantity || '0') as any) || 0,
        isDefault: !!(v as any).isDefault,
      }))
      const sig = (x: any) => [x.option1Name, x.option1Value, x.option2Name, x.option2Value, x.option3Name, x.option3Value, x.price, x.inventoryQuantity, x.sku, x.isDefault].join('|').toLowerCase()
      const sortBySig = (arr: any[]) => arr.slice().sort((a, b) => sig(a).localeCompare(sig(b)))
      const variantsChanged = (() => {
        const a = sortBySig(baseVariants)
        const b = sortBySig(normalizedVariants)
        if (a.length !== b.length) return true
        for (let i = 0; i < a.length; i++) {
          if (sig(a[i]) !== sig(b[i])) return true
        }
        return false
      })()

      // Prepare minimal update data – omit media and variants if unchanged
      const updateData: any = {
        ...formData,
        // Explicitly send null for empty numeric fields so they get cleared in the database
        compareAtPrice: formData.compareAtPrice === undefined || formData.compareAtPrice === null || formData.compareAtPrice === 0
          ? null
          : formData.compareAtPrice,
        costPrice: formData.costPrice === undefined || formData.costPrice === null || formData.costPrice === 0
          ? null
          : formData.costPrice,
        weight: formData.weight === undefined || formData.weight === null || formData.weight === 0
          ? null
          : formData.weight,
        // Fix: Don't send temporary brand IDs (id: -1) to backend - use null instead
        brandId: formData.brandId === -1 ? null : formData.brandId
      }

      // Only include variants if they changed
      if (variantsChanged) {
        updateData.variants = normalizedVariants
      }

      // Do not send media through the main update path (handled via dedicated endpoints)
      delete updateData.media

      // Coerce top-level numeric fields to numbers if they accidentally became strings in the form state
      if (typeof (updateData as any).basePrice === 'string') {
        (updateData as any).basePrice = parseFloat((updateData as any).basePrice) || 0
      }
      if (typeof (updateData as any).compareAtPrice === 'string') {
        (updateData as any).compareAtPrice = parseFloat((updateData as any).compareAtPrice)
      }
      if (typeof (updateData as any).costPrice === 'string') {
        (updateData as any).costPrice = parseFloat((updateData as any).costPrice)
      }

      // Log what we're sending for compareAtPrice
      logger.debug('Sending update with compareAtPrice:', { value: updateData.compareAtPrice })
      logger.debug('Sending update with shipping details:', {
        requiresShipping: updateData.requiresShipping,
        shippingInfo: updateData.shippingInfo,
        returnPolicy: updateData.returnPolicy,
        warranty: updateData.warranty,
        isNew: updateData.isNew
      })
      logger.debug('Full update data:', { value: updateData })

      const response = await apiService.updateProduct(product.id, updateData)

      if (response.ok) {
        onSuccess?.()
        handleClose()
      } else {
        setError(response.data?.message || 'Failed to update product')
      }
    } catch (err) {
      setError('An error occurred while updating the product')
      logger.error('Update product error:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'variants', label: 'Variants', icon: Layers },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'extras', label: 'Extra Info', icon: Sparkles }
  ]

  const currentStepId = steps[activeStep]?.id || 'basic'

  const goToStep = (stepIndex: number) => {
    // If there's an unsaved variant being edited on variants step, prevent navigation to any other step
    if (currentStepId === 'variants' && hasUnsavedVariant && stepIndex !== activeStep) {
      const direction = stepIndex > activeStep ? 'proceeding to the next step' : 'going back to the previous step'
      setErrors({ variants: `Please save or cancel the current variant before ${direction}` } as any)
      // Trigger shake animation
      setTriggerVariantShake(true)
      setTimeout(() => setTriggerVariantShake(false), 100)
      // Clear error after 4 seconds
      setTimeout(() => {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete (newErrors as any).variants
          return newErrors
        })
      }, 4000)
      return
    }
    
    // All steps are accessible in edit mode
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setActiveStep(stepIndex)
    }
  }

  const handleClose = () => {
    // If there's an unsaved variant, prevent closing
    if (hasUnsavedVariant) {
      setErrors({ variants: 'Please save or cancel the current variant before closing the modal' } as any)
      // Trigger shake animation
      setTriggerVariantShake(true)
      setTimeout(() => setTriggerVariantShake(false), 100)
      // Clear error after 4 seconds
      setTimeout(() => {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete (newErrors as any).variants
          return newErrors
        })
      }, 4000)
      // Navigate to variants step if not already there
      if (currentStepId !== 'variants') {
        const variantsStepIndex = steps.findIndex(s => s.id === 'variants')
        if (variantsStepIndex !== -1) {
          setActiveStep(variantsStepIndex)
        }
      }
      return
    }

    // Clean up temporary preview URLs to prevent memory leaks
    productMedia.forEach(media => {
      if ((media as any).isTemporary && media.url) {
        URL.revokeObjectURL(media.url)
      }
    })

    // Clear temporary media state
    setTempUploadedMedia([])

    // Clear local categories to prevent stale data
    setLocalCategories([])
    setCategories([])
    setShowAddCategory(false)
    setNewCategoryName('')
    setSelectedParentCategory(null)
    setEditingCategory(null)
    setEditCategoryName('')
    setHasUnsavedVariant(false)
    // Call the original onClose
    onClose()
  }

  // Get appId from product or URL
  const getAppId = useCallback(() => {
    const pathSegments = window.location.pathname.split('/')
    const merchantPanelIndex = pathSegments.indexOf('merchant-panel')
    const currentAppId = merchantPanelIndex !== -1 && pathSegments[merchantPanelIndex + 1]
      ? parseInt(pathSegments[merchantPanelIndex + 1])
      : product.appId || 0
    return currentAppId
  }, [product.appId])

  // Get stable appId value
  const currentAppId = useMemo(() => getAppId(), [getAppId])

  // Use the same category creation approach as CategoriesSection
  const { headers: merchantHeaders } = useMerchantAuth(apiKey, appSecretKey)
  
  // Ensure API keys are in localStorage for httpClient interceptors
  useEffect(() => {
    if (apiKey && typeof window !== 'undefined') {
      localStorage.setItem('userApiKey', apiKey)
    }
    if (appSecretKey && typeof window !== 'undefined') {
      localStorage.setItem('appSecretKey', appSecretKey)
    }
  }, [apiKey, appSecretKey])

  const { createCategory: createCategoryFromHook, categories: categoriesFromHook } = useCategories({
    appId: currentAppId,
    headers: merchantHeaders || undefined
  })

  // Sync categories from useCategories hook to local state when they're available
  // This ensures categories are available even if fetchCategories hasn't completed yet
  useEffect(() => {
    if (categoriesFromHook && Array.isArray(categoriesFromHook)) {
      // Only update if we have categories or if localCategories is empty
      if (categoriesFromHook.length > 0 || localCategories.length === 0) {
        setCategories(categoriesFromHook)
        setLocalCategories(categoriesFromHook)
      }
    }
  }, [categoriesFromHook, localCategories.length])

  // Handle opening Add Category modal
  const handleOpenAddCategoryModal = () => {
    // Ensure API keys are in localStorage before opening modal
    if (apiKey && typeof window !== 'undefined') {
      localStorage.setItem('userApiKey', apiKey)
    }
    if (appSecretKey && typeof window !== 'undefined') {
      localStorage.setItem('appSecretKey', appSecretKey)
    }
    setIsEditModalVisible(false)
    setShowAddCategoryModal(true)
  }

  // Handle closing Add Category modal and showing Edit Product modal again
  const handleCloseAddCategoryModal = () => {
    setShowAddCategoryModal(false)
    setIsEditModalVisible(true)
  }

  // Handle category creation success
  const handleCategoryCreated = async (category: Category) => {
    // Add the newly created category to the list
    const newCategory: ProductCategory = {
      id: category.id,
      name: category.name,
      parentId: category.parentId
    }

    setLocalCategories(prev => [...prev, newCategory])
    setCategories(prev => [...prev, newCategory])

    // Also update the parent categories list if this was fetched from the API
    if (onCategoriesUpdate) {
      onCategoriesUpdate([...categories, category])
    }

    // Refresh categories list
    await fetchCategories()

    // Close Add Category modal and show Edit Product modal
    handleCloseAddCategoryModal()
  }

  // Get parent categories for AddCategoryModal
  const parentCategoriesForModal = useMemo(() => {
    return getCategoryTree().map(cat => ({
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId,
      imageUrl: cat.imageUrl,
      iconUrl: cat.iconUrl,
      displayType: cat.displayType,
      isActive: cat.isActive,
      displayOrder: cat.displayOrder,
      description: cat.description,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      appId: cat.appId
    } as Category))
  }, [categories])

  return (
    <>
    <Modal
      isOpen={isOpen && isEditModalVisible}
      onClose={handleClose}
      title="Edit Product"
      size="xl"
      showCloseButton={!loading}
      position="top"
      className="max-w-6xl"
    >
      <div className="flex flex-col h-[80vh]">
        {/* Steps Indicator */}
        <div className="border-b border-gray-200 bg-gray-50 -mx-6 mb-4 rounded-t-lg ">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between overflow-x-auto pt-1" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = activeStep === index
                // In edit mode, all steps are considered completed/accessible
                const isCompleted = true
                
                return (
                  <div key={step.id} className="flex items-center flex-shrink-0">
                    <button
                      onClick={() => goToStep(index)}
                      disabled={loading}
                      className={`flex flex-col items-center min-w-[80px] transition-all ${
                        loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                    >
                      <div className={`relative flex items-center justify-center w-10 h-10 rounded-full mb-2 transition-all ${
                        isActive
                          ? 'bg-orange-600 text-white shadow-md'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                        {/* Count badge on top-right corner of icon */}
                        {step.id === 'variants' && formData.variants && Array.isArray(formData.variants) && formData.variants.length > 0 && (
                          <span className="absolute -top-1 -right-1 z-10 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-semibold rounded-full border-2 border-white">
                            {formData.variants.length}
                          </span>
                        )}
                        {step.id === 'categories' && formData.categoryIds && Array.isArray(formData.categoryIds) && formData.categoryIds.length > 0 && (
                          <span className="absolute -top-1 -right-1 z-10 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-semibold rounded-full border-2 border-white">
                            {formData.categoryIds.length}
                          </span>
                        )}
                        {step.id === 'media' && productMedia && Array.isArray(productMedia) && productMedia.length > 0 && (
                          <span className="absolute -top-1 -right-1 z-10 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-semibold rounded-full border-2 border-white">
                            {productMedia.length}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs text-center max-w-[80px] ${
                        isActive ? 'font-semibold text-gray-900' : 'font-normal text-gray-600'
                      }`}>
                        {step.label}
                      </span>
                    </button>
                    {index < steps.length - 1 && (
                      <div className={`mx-2 h-0.5 w-8 md:w-13 transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
            {error}
          </div>
        )}
        {(errors as any).variants && (
          <div className="sticky top-0 z-50 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm flex items-center space-x-2 shadow-md">
            <span className="font-medium">⚠️</span>
            <span>{(errors as any).variants}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Basic Info Tab */}
          {currentStepId === 'basic' && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  maxLength={255}
                  className={`
                    w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.name ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="Enter product name"
                  disabled={loading}
                />
                <CharacterCount
                  current={formData.name?.length || 0}
                  max={255}
                  recommended={100}
                  showRecommended={true}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <BrandSelectorWithImages
                    value={formData.brandId || product.brand || ''}
                    onChange={(brandId, brandName) => {
                      handleInputChange('brandId', brandId)
                      handleInputChange('brand', brandName)
                    }}
                    onCreateBrand={createBrand}
                    apiKey={apiKey}
                    appSecretKey={appSecretKey}
                    appId={product.appId}
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
                    maxLength={500}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Brief product description"
                    disabled={loading}
                  />
                  <CharacterCount
                    current={formData.shortDescription?.length || 0}
                    max={500}
                    recommended={200}
                    showRecommended={true}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detailed product description"
                  rows={2}
                  disabled={loading}
                />
                <CharacterCount
                  current={formData.description?.length || 0}
                  max={5000}
                  recommended={1000}
                  showRecommended={true}
                />
              </div>

              {/* Extras tab content rendered outside of 'basic' tab */}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    maxLength={100}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Stock keeping unit"
                    disabled={loading}
                  />
                  <CharacterCount
                    current={formData.sku?.length || 0}
                    max={100}
                    recommended={30}
                    showRecommended={true}
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
                    maxLength={100}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Product barcode"
                    disabled={loading}
                  />
                  <CharacterCount
                    current={formData.barcode?.length || 0}
                    max={100}
                    recommended={13}
                    showRecommended={true}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Featured Product</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDigital}
                    onChange={(e) => handleInputChange('isDigital', e.target.checked)}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Digital Product</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isNew || false}
                    onChange={(e) => handleInputChange('isNew', e.target.checked)}
                    className="mr-2"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">New Product</span>
                </label>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {currentStepId === 'pricing' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Price *
                </label>
                <input
                  type="number"
                  value={basePriceInput}
                  onChange={(e) => {
                    const value = e.target.value
                    // Update local input state - allow empty
                    setBasePriceInput(value)
                    
                    // Update formData only when there's a valid number
                    if (value === '' || value === null || value === undefined) {
                      handleInputChange('basePrice', 0)
                    } else {
                      const numValue = parseFloat(value)
                      if (!isNaN(numValue) && numValue >= 0) {
                        handleInputChange('basePrice', numValue)
                      }
                    }
                  }}
                  onBlur={() => {
                    // On blur, sync the input with formData
                    if (formData.basePrice === 0 || formData.basePrice === undefined) {
                      setBasePriceInput('')
                    } else {
                      setBasePriceInput(formData.basePrice.toString())
                    }
                  }}
                  className={`
                    w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.basePrice ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
                {errors.basePrice && (
                  <p className="mt-1 text-xs text-red-600">{errors.basePrice}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compare at Price
                </label>
                <input
                  type="number"
                  value={formData.compareAtPrice || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    // If empty string or only whitespace, set to undefined
                    if (!value || value.trim() === '') {
                      handleInputChange('compareAtPrice', undefined)
                    } else {
                      const numValue = parseFloat(value)
                      // Only set if it's a valid number
                      handleInputChange('compareAtPrice', !isNaN(numValue) ? numValue : undefined)
                    }
                  }}
                  className={`
                    w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    ${errors.compareAtPrice ? 'border-red-300' : 'border-gray-300'}
                  `}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
                {errors.compareAtPrice && (
                  <p className="mt-1 text-xs text-red-600">{errors.compareAtPrice}</p>
                )}
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
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Your cost for profit calculations
                </p>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {currentStepId === 'inventory' && (
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="trackInventory"
                  checked={formData.trackInventory}
                  onChange={(e) => handleInputChange('trackInventory', e.target.checked)}
                  className="mr-2"
                  disabled={loading}
                />
                <label htmlFor="trackInventory" className="text-sm font-medium text-gray-700">
                  Track inventory for this product
                </label>
              </div>

              {formData.trackInventory && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.inventoryQuantity}
                      onChange={(e) => handleInputChange('inventoryQuantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Current inventory stock level
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.minimumQuantity}
                      onChange={(e) => handleInputChange('minimumQuantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1"
                      min="1"
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Minimum quantity per order
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.maximumQuantity}
                      onChange={(e) => handleInputChange('maximumQuantity', parseInt(e.target.value) || 99999)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="99999"
                      min="1"
                      disabled={loading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum quantity per order
                    </p>
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
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.0"
                    step="0.1"
                    min="0"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight Unit
                  </label>
                  <select
                    value={formData.weightUnit}
                    onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
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

          {/* Variants Tab */}
          {currentStepId === 'variants' && (
            <div className="">
              {/* <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Manage product variants for different options like size, color, or material. Each variant can have its own SKU, price, and inventory.
                </p>
              </div> */}
              <VariantManager
                variants={formData.variants || []}
                onVariantsChange={(variants: ProductVariant[]) => handleInputChange('variants', variants)}
                onEditingStateChange={(hasUnsaved, editingIndex) => {
                  setHasUnsavedVariant(hasUnsaved)
                  setEditingVariantIndex(editingIndex)
                }}
                triggerShake={triggerVariantShake}
              />
            </div>
          )}

          {/* Media Tab */}
          {currentStepId === 'media' && (
            <div className="space-y-4">
              <MediaManager
                productId={product.id}
                media={productMedia}
                onMediaChange={(newMedia) => {
                  setProductMedia(newMedia)
                  handleInputChange('media', newMedia)
                  // Update thumbnail URL if primary image changes
                  const primaryImage = newMedia.find(m => m.isPrimary)
                  if (primaryImage) {
                    handleInputChange('thumbnailUrl', primaryImage.url)
                  }
                }}
                onUpload={async (file) => {
                  // Create temporary preview URL (do NOT upload to server yet)
                  const tempId = `temp-${Date.now()}-${Math.random()}`
                  const previewUrl = URL.createObjectURL(file)

                  // Check if this is the first image being added
                  const currentImages = productMedia.filter(m => m.type === 'image' || !m.type)
                  const isFirstImage = currentImages.length === 0

                  // Add temporary media to state for preview
                  const tempMedia: ProductMedia = {
                    id: tempId as any,
                    url: previewUrl,
                    type: 'image' as const,
                    altText: '',
                    displayOrder: productMedia.length,
                    isPrimary: isFirstImage, // Auto-set as primary if it's the first image
                    isListingThumbnail: false,
                    isDetailThumbnail: false,
                    thumbnailUrl: previewUrl,
                    isTemporary: true // Flag to identify temp uploads
                  }

                  setProductMedia(prev => [...prev, tempMedia])

                  // Store the file for later upload on submit
                  setTempUploadedMedia(prev => [...prev, file])

                  return tempMedia
                }}
                onDelete={async (mediaId) => {
                  try {
                    const headers: any = {}
                    if (apiKey) headers['x-api-key'] = apiKey
                    if (appSecretKey) headers['x-app-secret'] = appSecretKey
                    
                    const response = await apiService.deleteProductMedia(product.id, mediaId)
                    return response.ok
                  } catch (err) {
                    logger.error('Delete failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                    return false
                  }
                }}
                onSetPrimary={async (mediaId) => {
                  try {
                    console.log('[onSetPrimary] Starting - will set both listing and detail thumbnails for mediaId:', mediaId)
                    const headers: any = {}
                    if (apiKey) headers['x-api-key'] = apiKey
                    if (appSecretKey) headers['x-app-secret'] = appSecretKey

                    // Set both listing and detail thumbnails to make it fully primary
                    console.log('[onSetPrimary] Calling setProductMediaAsThumbnail...')
                    const listingResponse = await apiService.setProductMediaAsThumbnail(product.id, mediaId)
                    console.log('[onSetPrimary] Listing response:', listingResponse.ok)

                    console.log('[onSetPrimary] Calling setProductMediaAsDetailThumbnail...')
                    const detailResponse = await apiService.setProductMediaAsDetailThumbnail(product.id, mediaId)
                    console.log('[onSetPrimary] Detail response:', detailResponse.ok)

                    const finalResult = listingResponse.ok && detailResponse.ok
                    console.log('[onSetPrimary] Final result:', finalResult)
                    return finalResult
                  } catch (err) {
                    console.error('[onSetPrimary] ERROR:', err)
                    logger.error('Set primary failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                    return false
                  }
                }}
                onSetListingThumbnail={async (mediaId) => {
                  try {
                    const headers: any = {}
                    if (apiKey) headers['x-api-key'] = apiKey
                    if (appSecretKey) headers['x-app-secret'] = appSecretKey
                    
                    const response = await apiService.setProductMediaAsThumbnail(product.id, mediaId)
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
                    
                    const response = await apiService.setProductMediaAsDetailThumbnail(product.id, mediaId)
                    return response.ok
                  } catch (err) {
                    logger.error('Set detail thumbnail failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                    return false
                  }
                }}
                loading={loading}
                disabled={loading}
              />
            </div>
          )}

          {/* Categories Tab */} {currentStepId === 'categories' && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Categories *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    disabled={creatingCategory}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FolderPlus className="h-3 w-3" />
                    <span>Add Category</span>
                  </button>
                </div>

                {/* Add Category Form */}
                {showAddCategory && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                        maxLength={50}
                        disabled={creatingCategory}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                      />
                      <select
                        value={selectedParentCategory || ""}
                        onChange={(e) => setSelectedParentCategory(e.target.value ? Number(e.target.value) : null)}
                        disabled={creatingCategory}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                      >
                        <option value="">No parent (Top level)</option>
                        {getCategoriesForDropdown().map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {'  '.repeat(cat.depth)}
                            {cat.depth > 0 ? '└ ' : ''}
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          disabled={creatingCategory || !newCategoryName.trim()}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {creatingCategory ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                              Creating...
                            </>
                          ) : (
                            'Add'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCategory(false);
                            setNewCategoryName("");
                            setSelectedParentCategory(null);
                          }}
                          disabled={creatingCategory}
                          className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
                  {localCategories.length === 0 ? (
                    <p className="text-sm text-gray-500">No categories available. Add one above.</p>
                  ) : (
                    <div className="space-y-1">
                      {getCategoryTree().map((category) => (
                        <div key={category.id}>
                          <div className="flex items-center group hover:bg-gray-50 rounded px-1 py-0.5">
                            <input
                              type="checkbox"
                              checked={formData.categoryIds?.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleInputChange('categoryIds', [...(formData.categoryIds || []), category.id])
                                } else {
                                  handleInputChange('categoryIds', formData.categoryIds?.filter(id => id !== category.id) || [])
                                }
                              }}
                              className="h-4 w-4 text-orange-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            {editingCategory === category.id ? (
                              <div className="flex items-center ml-2 flex-1">
                                <input
                                  type="text"
                                  value={editCategoryName}
                                  onChange={(e) => setEditCategoryName(e.target.value)}
                                  onBlur={() => handleUpdateCategory(category.id)}
                                  onKeyPress={(e) => e.key === "Enter" && handleUpdateCategory(category.id)}
                                  className="px-1 py-0.5 text-sm border border-gray-300 rounded"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <>
                                <span className="ml-2 text-sm text-gray-700 flex-1">
                                  {category.name}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCategory(category.id);
                                      setEditCategoryName(category.name);
                                    }}
                                    className="p-1 text-gray-500 hover:text-orange-600"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="p-1 text-gray-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          {/* Render subcategories */}
                          {category.children && category.children.length > 0 && (
                            <div className="ml-6">
                              {category.children.map((subcat) => (
                                <div key={subcat.id} className="flex items-center group hover:bg-gray-50 rounded px-1 py-0.5">
                                  <input
                                    type="checkbox"
                                    checked={formData.categoryIds?.includes(subcat.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        handleInputChange('categoryIds', [...(formData.categoryIds || []), subcat.id])
                                      } else {
                                        handleInputChange('categoryIds', formData.categoryIds?.filter(id => id !== subcat.id) || [])
                                      }
                                    }}
                                    className="h-4 w-4 text-orange-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  {editingCategory === subcat.id ? (
                                    <div className="flex items-center ml-2 flex-1">
                                      <input
                                        type="text"
                                        value={editCategoryName}
                                        onChange={(e) => setEditCategoryName(e.target.value)}
                                        onBlur={() => handleUpdateCategory(subcat.id)}
                                        onKeyPress={(e) => e.key === "Enter" && handleUpdateCategory(subcat.id)}
                                        className="px-1 py-0.5 text-sm border border-gray-300 rounded"
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <>
                                      <span className="ml-2 text-sm text-gray-600 flex-1">
                                        — {subcat.name}
                                      </span>
                                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingCategory(subcat.id);
                                            setEditCategoryName(subcat.name);
                                          }}
                                          className="p-1 text-gray-500 hover:text-orange-600"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteCategory(subcat.id)}
                                          className="p-1 text-gray-500 hover:text-red-600"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      maxLength={20}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add tag"
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <CharacterCount
                    current={tagInput.length}
                    max={20}
                    className="text-xs"
                  />
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Extra Info Tab */}
          {currentStepId === 'extras' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra Info</label>
                <ExtraInfoEditor
                  metadata={(formData as any).metadata || {}}
                  onChange={(meta: any) => handleInputChange('metadata' as any, meta)}
                />
              </div>
            </div>
          )}

          {/* Shipping Tab */}
          {currentStepId === 'shipping' && (
            <div className="space-y-2">
              {!formData.isDigital && (
                <>
                  <div className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      id="requiresShipping"
                      checked={formData.requiresShipping}
                      onChange={(e) => handleInputChange('requiresShipping', e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <label htmlFor="requiresShipping" className="ml-2 text-sm font-medium text-gray-700">
                      This product requires shipping
                    </label>
                  </div>

                  {formData.requiresShipping && (
                    <>
                      {/* Dimensions */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Package Dimensions
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
                            <input
                              type="number"
                              value={formData.shippingInfo?.length || ''}
                              onChange={(e) => handleInputChange('shippingInfo', {
                                ...formData.shippingInfo,
                                length: e.target.value ? parseFloat(e.target.value) : undefined
                              })}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="0"
                              step="0.01"
                              min="0"
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                            <input
                              type="number"
                              value={formData.shippingInfo?.width || ''}
                              onChange={(e) => handleInputChange('shippingInfo', {
                                ...formData.shippingInfo,
                                width: e.target.value ? parseFloat(e.target.value) : undefined
                              })}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="0"
                              step="0.01"
                              min="0"
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                            <input
                              type="number"
                              value={formData.shippingInfo?.height || ''}
                              onChange={(e) => handleInputChange('shippingInfo', {
                                ...formData.shippingInfo,
                                height: e.target.value ? parseFloat(e.target.value) : undefined
                              })}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              placeholder="0"
                              step="0.01"
                              min="0"
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <select
                              value={formData.shippingInfo?.dimensionUnit || 'cm'}
                              onChange={(e) => handleInputChange('shippingInfo', {
                                ...formData.shippingInfo,
                                dimensionUnit: e.target.value
                              })}
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              disabled={loading}
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
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            disabled={loading}
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
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="1-2 business days"
                            disabled={loading}
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
                            disabled={loading}
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
                            disabled={loading}
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
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            disabled={loading}
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
                  rows={2}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Describe your return policy..."
                  disabled={loading}
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
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Warranty details (e.g., 1 year manufacturer warranty)"
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 mt-4 pt-3 pb-3 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e)}
            disabled={loading}
            className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            style={{ position: 'relative', zIndex: 50 }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white mr-2" />
                Updating...
              </>
            ) : (
              'Update Product'
            )}
          </button>
        </div>
      </div>
    </Modal>

    {/* Add Category Modal */}
    <AddCategoryModal
      isOpen={showAddCategoryModal}
      onClose={handleCloseAddCategoryModal}
      appId={currentAppId}
      parentCategories={parentCategoriesForModal}
      onSuccess={handleCategoryCreated}
      onSubmit={createCategoryFromHook}
    />
    </>
  )
}
