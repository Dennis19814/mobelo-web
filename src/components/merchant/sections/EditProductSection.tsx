'use client'
import { logger } from '@/lib/logger'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Upload, Plus, Trash2, Loader2, Package, DollarSign, Box, Layers, Image, FolderTree, Truck, Edit2, Check, XCircle, Tags, ChevronLeft, ChevronRight, FolderPlus, Image as ImageIcon, LayoutGrid, AlertCircle, ArrowLeft, ChevronRight as ChevronRightIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import type { UpdateProductDto, Product, ProductCategory, ProductVariant, ProductMedia } from '@/types/product.types'
import VariantManager from '../VariantManager'
import ShopifyVariantManager from '../ShopifyVariantManager'
import MediaManager from '../MediaManager'
import BrandSelectorWithImages from '../../ui/BrandSelectorWithImages'
import { AddCategoryModal } from '../modals/AddCategoryModal'
import type { Category } from '@/types/category'
import { useCategories } from '@/hooks/useCategories'
import { useMerchantAuth } from '@/hooks'
import { UnifiedAssetPicker } from '@/components/ui/UnifiedAssetPicker'
import { UnifiedAssetData } from '@/lib/unified-asset-loader'
import { CategoryIcon } from '@/components/ui/icons/LocalCategoryIcon'
import { LocalEmoji } from '@/components/ui/emojis/LocalEmoji'

interface EditProductSectionProps {
  appId: number
  productId: number
  apiKey?: string
  appSecretKey?: string
  onSuccess?: () => void
}

export default function EditProductSection({ appId, productId, apiKey, appSecretKey, onSuccess }: EditProductSectionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null)
  // Category display feature state
  const [categoryDisplayMode, setCategoryDisplayMode] = useState<'image' | 'icon'>('image')
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null)
  const [categoryImagePreview, setCategoryImagePreview] = useState<string | null>(null)
  const [categorySelectedIcon, setCategorySelectedIcon] = useState<any>(null)
  const [categorySelectedEmoji, setCategorySelectedEmoji] = useState<any>(null)
  const [isCategoryIconPickerOpen, setIsCategoryIconPickerOpen] = useState(false)
  const [categorySelectedAsset, setCategorySelectedAsset] = useState<UnifiedAssetData | undefined>()
  const categoryFileInputRef = useRef<HTMLInputElement>(null)
  const availableCategoriesRef = useRef<HTMLDivElement>(null)
  const categoryErrorRef = useRef<HTMLDivElement>(null)
  const [categoryReplacementWarning, setCategoryReplacementWarning] = useState<string | null>(null)
  const [showCategoryReplacementWarning, setShowCategoryReplacementWarning] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [newlyCreatedCategoryId, setNewlyCreatedCategoryId] = useState<number | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [productMedia, setProductMedia] = useState<ProductMedia[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(true)
  const [tempUploadedMedia, setTempUploadedMedia] = useState<File[]>([]) // Track temporary uploads
  const [pendingMediaDeletions, setPendingMediaDeletions] = useState<number[]>([]) // Track media IDs to delete
  const [pendingListingThumbnail, setPendingListingThumbnail] = useState<number | string | null>(null)
  const [pendingDetailThumbnail, setPendingDetailThumbnail] = useState<number | string | null>(null)
  const [isBrandValid, setIsBrandValid] = useState(true)
  const [basePriceInput, setBasePriceInput] = useState<string>('') // Local state for base price input
  const [hasUnsavedVariant, setHasUnsavedVariant] = useState(false)
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [triggerVariantShake, setTriggerVariantShake] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false)
  const [categoryPickerPath, setCategoryPickerPath] = useState<number[]>([]) // Track navigation path
  const categoryPickerRef = useRef<HTMLDivElement>(null)
  const [additionalPricesExpanded, setAdditionalPricesExpanded] = useState(false)
  const [shippingDetailsExpanded, setShippingDetailsExpanded] = useState(false)
  const [inventoryExpanded, setInventoryExpanded] = useState(false) // Collapsed by default

  const [formData, setFormData] = useState<UpdateProductDto>({
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

  // Auto-hide replacement warning after 5 seconds
  useEffect(() => {
    if (categoryReplacementWarning) {
      setShowCategoryReplacementWarning(true);
      const timer = setTimeout(() => {
        setShowCategoryReplacementWarning(false);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    } else {
      setShowCategoryReplacementWarning(false);
    }
  }, [categoryReplacementWarning]);

  // Auto-scroll to error when it appears
  useEffect(() => {
    if (categoryError && categoryErrorRef.current) {
      categoryErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [categoryError])

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (categoryError) {
      const timer = setTimeout(() => {
        setCategoryError(null)
      }, 5000) // Hide after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [categoryError])

  // Category image/icon handlers
  const handleCategoryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Only show warning if user actually selected an icon/emoji (not default)
    const hadIconOrEmoji = (categorySelectedIcon && categorySelectedIcon.name !== 'Folder') || 
                           categorySelectedEmoji;

    if (hadIconOrEmoji) {
      setCategoryReplacementWarning('Uploading an image will replace the currently selected icon or emoji.');
    } else {
      setCategoryReplacementWarning(null);
    }

    // Clear icon/emoji when image is selected
    setCategorySelectedIcon(null);
    setCategorySelectedEmoji(null);

    setCategoryImageFile(file);
    setCategoryDisplayMode('image');

    const reader = new FileReader();
    reader.onloadend = () => {
      setCategoryImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryModeSwitch = (mode: 'image' | 'icon') => {
    setCategoryDisplayMode(mode);
    // Don't clear imageFile or imagePreview when switching tabs
    // They will be cleared when user actually selects icon/emoji
    // Don't clear icon/emoji fields when switching tabs either
    // They will be cleared when user actually uploads an image
    
    // If switching to image mode and we have imageFile but no preview, recreate preview
    if (mode === 'image' && categoryImageFile && !categoryImagePreview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategoryImagePreview(reader.result as string);
      };
      reader.readAsDataURL(categoryImageFile);
    }
    
    // When switching tabs, don't show warnings - warnings will show when user actually uploads/selects
    setCategoryReplacementWarning(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || creatingCategory) return

    // Clear previous error
    setCategoryError(null)

    // Check for duplicate category name (case-insensitive, same parent)
    const trimmedName = newCategoryName.trim()
    const duplicateCategory = categories.find(cat => 
      cat.name.toLowerCase() === trimmedName.toLowerCase() && 
      cat.parentId === selectedParentCategory
    )

    if (duplicateCategory) {
      setCategoryError('A category with this name already exists in the same parent category.')
      return
    }

    setCreatingCategory(true)
    try {
      // Prepare category data based on display mode
      let categoryData: any = {
        name: trimmedName,
        description: newCategoryDescription.trim() || undefined,
        parentId: selectedParentCategory || undefined,
        appId: appId,
        isActive: true,
        displayOrder: 0,
      }

      if (categoryDisplayMode === 'image' && categoryImageFile) {
        // Will upload image after category creation
        categoryData.displayType = 'image';
      } else if (categoryDisplayMode === 'icon') {
        if (categorySelectedIcon) {
          categoryData.iconName = categorySelectedIcon.name;
          categoryData.iconLibrary = categorySelectedIcon.libraryKey;
          categoryData.iconUrl = categorySelectedIcon.filePath;
          categoryData.displayType = 'icon';
        } else if (categorySelectedEmoji) {
          categoryData.emojiUnicode = categorySelectedEmoji.unicode;
          categoryData.emojiShortcode = categorySelectedEmoji.shortcode;
          categoryData.emojiSource = categorySelectedEmoji.sourceKey;
          categoryData.displayType = 'emoji';
        } else {
          // Default icon
          categoryData.iconName = 'Folder';
          categoryData.iconLibrary = 'lucide-react';
          categoryData.iconUrl = 'lucide-react:Folder';
          categoryData.displayType = 'icon';
        }
      }

      const response = await apiService.createCategory(categoryData)

      if (response.ok && response.data) {
        const newCategoryId = response.data.id;
        
        // Clear error on success
        setCategoryError(null)

        // Upload image if provided
        if (categoryImageFile && newCategoryId) {
          try {
            await apiService.uploadCategoryImage(newCategoryId, categoryImageFile, appId);
          } catch (uploadError) {
            logger.error('Failed to upload category image:', { error: uploadError instanceof Error ? uploadError.message : String(uploadError) });
          }
        }

        // Refresh categories list to include the newly created category
        // First refresh from hook to ensure global state is updated
        await refetchCategories()
        // Then fetch categories to update local state
        await fetchCategories()
        
        // Set newly created category ID for highlighting
        setNewlyCreatedCategoryId(response.data.id)
        
        // Clear form and collapse
        setNewCategoryName('')
        setNewCategoryDescription('')
        setSelectedParentCategory(null)
        setCategoryDisplayMode('image')
        setCategoryImageFile(null)
        setCategoryImagePreview(null)
        setCategorySelectedIcon(null)
        setCategorySelectedEmoji(null)
        setCategoryReplacementWarning(null)
        setShowCategoryReplacementWarning(false)
        setShowAddCategory(false) // Collapse the form
        if (categoryFileInputRef.current) {
          categoryFileInputRef.current.value = '';
        }
        
        // Scroll to Available Categories section after a short delay
        setTimeout(() => {
          if (availableCategoriesRef.current) {
            availableCategoriesRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          setNewlyCreatedCategoryId(null)
        }, 3000)
      } else {
        // Handle API error response
        const errorMessage = (response.data as any)?.message || (response.data as any)?.error || 'Failed to create category. A category with this name may already exist.'
        setCategoryError(errorMessage)
      }
    } catch (error) {
      logger.error('Failed to add category:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category. A category with this name may already exist.'
      setCategoryError(errorMessage)
    } finally {
      setCreatingCategory(false)
    }
  }

  const handleUpdateCategory = async (categoryId: number) => {
    if (!editingCategoryName.trim()) return
    
    // Find the original category to check if name has changed
    const originalCategory = categories.find(cat => cat.id === categoryId)
    if (!originalCategory || editingCategoryName.trim() === originalCategory.name) {
      // No change, just cancel editing
      setEditingCategoryId(null)
      setEditingCategoryName('')
      return
    }
    
    try {
      // Use the hook's updateCategory method which handles API call and global refresh
      const updatedCategory = await updateCategoryFromHook(categoryId, {
        name: editingCategoryName.trim()
      })
      
      if (updatedCategory) {
        // Update local state immediately
        setCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId 
              ? { ...cat, name: editingCategoryName.trim() }
              : cat
          )
        )
        
        // Refresh categories globally to ensure all components see the update
        await refetchCategories()
        await fetchCategories()
        
        setEditingCategoryId(null)
        setEditingCategoryName('')
      }
    } catch (error) {
      logger.error('Failed to update category:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      // Revert on error
      setEditingCategoryId(null)
      setEditingCategoryName('')
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    setDeletingCategoryId(categoryId)
    try {
      const response = await apiService.deleteCategory(categoryId, appId)
      
      if (response.ok) {
        // Refresh categories from both hook and local fetch
        await refetchCategories()
        await fetchCategories()
        // Remove the deleted category from selected categories
        if (formData.categoryIds?.includes(categoryId)) {
          handleInputChange('categoryIds', formData.categoryIds.filter(id => id !== categoryId))
        }
      } else {
        alert('Failed to delete category. It may have products assigned to it.')
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

  // Load product data on mount
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return
      
      setLoadingProduct(true)
      try {
        const headers: any = {}
        if (apiKey) headers['x-api-key'] = apiKey
        if (appSecretKey) headers['x-app-secret'] = appSecretKey
        
        const response = await apiService.getProduct(productId)
        if (response.ok && response.data) {
          const productData = response.data
          setProduct(productData)
          
          // Map variants to ensure all fields are properly set
          const mappedVariants: ProductVariant[] = (productData.variants || []).map((v: any) => ({
            id: v.id,
            sku: v.sku || '',
            option1Name: v.option1Name || '',
            option1Value: v.option1Value || '',
            option2Name: v.option2Name || '',
            option2Value: v.option2Value || '',
            option3Name: v.option3Name || '',
            option3Value: v.option3Value || '',
            price: typeof v.price === 'number' ? v.price : (v.price ? parseFloat(v.price) : undefined),
            inventoryQuantity: typeof v.inventoryQuantity === 'number' ? v.inventoryQuantity : (v.inventoryQuantity ? parseInt(v.inventoryQuantity) : 0),
            position: v.position,
            isDefault: v.isDefault || false
          }))
          
          logger.debug('EditProductSection: Loaded product with variants', {
            productId: productData.id,
            variantCount: mappedVariants.length,
            variants: mappedVariants
          })
          
          // Initialize formData with product data
          setFormData({
            name: productData.name,
            brand: productData.brand || '',
            brandId: productData.brandId,
            description: productData.description || '',
            shortDescription: productData.shortDescription || '',
            sku: productData.sku || '',
            barcode: productData.barcode || '',
            basePrice: productData.basePrice,
            compareAtPrice: productData.compareAtPrice === null ? undefined : productData.compareAtPrice,
            costPrice: productData.costPrice === null ? undefined : productData.costPrice,
            thumbnailUrl: productData.thumbnailUrl || '',
            weight: productData.weight === null ? undefined : productData.weight,
            weightUnit: productData.weightUnit || 'kg',
            status: productData.status,
            featured: productData.featured || false,
            isDigital: productData.isDigital || false,
            isNew: productData.isNew || false,
            requiresShipping: productData.requiresShipping || false,
            shippingInfo: productData.shippingInfo || {
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
            returnPolicy: productData.returnPolicy || '',
            warranty: productData.warranty || '',
            categoryIds: productData.categories?.map(c => c.id) || [],
            tags: productData.tags || [],
            trackInventory: productData.trackInventory || false,
            inventoryQuantity: productData.inventoryQuantity || 0,
            minimumQuantity: productData.minimumQuantity || 1,
            maximumQuantity: productData.maximumQuantity || undefined,
            variants: mappedVariants,
            media: productData.media || [],
            metadata: productData.metadata || {}
          })
          
          // Set base price input
          if (productData.basePrice === 0 || productData.basePrice === undefined) {
            setBasePriceInput('')
          } else {
            setBasePriceInput(productData.basePrice.toString())
          }
          
          // Load media
          const mediaResponse = await apiService.getProductMedia(productId)
          if (mediaResponse.ok && mediaResponse.data?.media) {
            const mappedMedia = mediaResponse.data.media.map((m: any) => ({
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
          }
        }
      } catch (error) {
        logger.error('Failed to load product:', { error: error instanceof Error ? error.message : String(error) })
        setErrors({ submit: 'Failed to load product data' })
      } finally {
        setLoadingProduct(false)
      }
    }
    
    loadProduct()
    fetchCategories()
  }, [productId, apiKey, appSecretKey, fetchCategories])
  
  // Sync basePriceInput when formData.basePrice changes externally
  useEffect(() => {
    if (formData.basePrice === 0 && basePriceInput !== '') {
      // Only update if input is not empty (user might be typing)
      // This prevents clearing while user is typing
    } else if (formData.basePrice !== 0 && basePriceInput !== formData.basePrice.toString()) {
      // Sync if formData changed externally and input doesn't match
      setBasePriceInput(formData.basePrice.toString())
    }
  }, [formData.basePrice])

  // Close category picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryPickerRef.current && !categoryPickerRef.current.contains(event.target as Node)) {
        setCategoryPickerOpen(false)
        setCategoryPickerPath([])
      }
    }

    if (categoryPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [categoryPickerOpen])

  // Clear variants error when there's no unsaved variant
  useEffect(() => {
    if (!hasUnsavedVariant && errors.variants) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.variants
        return newErrors
      })
    }
  }, [hasUnsavedVariant, errors.variants])

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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      handleInputChange('tags', [...(formData.tags || []), tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    handleInputChange('tags', formData.tags?.filter(t => t !== tag) || [])
  }

  const validateStep = (stepId: string): boolean => {
    // If there's an unsaved variant on variants step, prevent validation
    if (stepId === 'variants' && hasUnsavedVariant) {
      setErrors({ variants: 'Please save or cancel the current variant before proceeding to the next step' })
      // Trigger shake animation
      setTriggerVariantShake(true)
      setTimeout(() => setTriggerVariantShake(false), 100)
      // Clear error after 4 seconds
      setTimeout(() => {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.variants
          return newErrors
        })
      }, 4000)
      return false
    }
    
    const newErrors: Record<string, string> = {}
    const stepFields: string[] = []
    
    switch (stepId) {
      case 'basic':
        stepFields.push('name')
        if (!formData.name.trim()) {
          newErrors.name = 'Product name is required'
        }
        break
      case 'pricing':
        stepFields.push('basePrice')
        if (formData.basePrice <= 0) {
          newErrors.basePrice = 'Price must be greater than 0'
        }
        break
      case 'inventory':
        stepFields.push('minimumQuantity')
        if (formData.trackInventory && formData.minimumQuantity && formData.minimumQuantity < 0) {
          newErrors.minimumQuantity = 'Minimum quantity cannot be negative'
        }
        break
      default:
        // Other steps don't have required fields
        break
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }))
      return false
    }
    
    // Clear errors for this step's fields if validation passes
    if (stepFields.length > 0) {
      setErrors(prev => {
        const updated = { ...prev }
        stepFields.forEach(key => delete updated[key])
        return updated
      })
    }
    
    return true
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

  const handleSubmit = async () => {
    // If there's an unsaved variant being edited, prevent submission
    if (hasUnsavedVariant) {
      setErrors({ variants: 'Please save or cancel the current variant before updating the product' })
      setTriggerVariantShake(true)
      setTimeout(() => setTriggerVariantShake(false), 100)
      setTimeout(() => {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.variants
          return newErrors
        })
      }, 4000)
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})
    try {
      const headers: any = {}
      if (apiKey) headers['x-api-key'] = apiKey
      if (appSecretKey) headers['x-app-secret'] = appSecretKey
      
      // Step 1: Upload all temporary media files first
      let uploadedRealMedia: ProductMedia[] = []
      if (tempUploadedMedia.length > 0) {
        for (const file of tempUploadedMedia) {
          try {
            const uploadFormData = new FormData()
            uploadFormData.append('files', file)
            const response = await apiService.uploadProductMedia(productId, uploadFormData)
            if (response.ok && response.data?.media && response.data.media.length > 0) {
              const uploadedMedia = response.data.media[0]
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
          }
        }
      }

      // Step 2: Match temp media to uploaded media
      const buildMediaStrictKey = (media: ProductMedia) =>
        `${media.originalFileName || ''}|${media.fileSize || ''}|${media.mimeType || ''}`
      const buildMediaNameKey = (media: ProductMedia) => media.originalFileName || ''
      const tempMediaList = productMedia.filter((m: any) => m.isTemporary)
      const tempToRealIdMap = new Map<string | number, number>()
      
      uploadedRealMedia.forEach((realMedia) => {
        const strictKey = buildMediaStrictKey(realMedia)
        let tempMedia = tempMediaList.find((m: any) => 
          m.isTemporary && buildMediaStrictKey(m) === strictKey
        )
        if (!tempMedia) {
          const nameKey = buildMediaNameKey(realMedia)
          if (nameKey) {
            tempMedia = tempMediaList.find((m: any) => 
              m.isTemporary && buildMediaNameKey(m) === nameKey
            )
          }
        }
        if (tempMedia) {
          realMedia.isPrimary = tempMedia.isPrimary
          realMedia.isListingThumbnail = tempMedia.isListingThumbnail
          realMedia.isDetailThumbnail = tempMedia.isDetailThumbnail
          if (tempMedia.id && typeof realMedia.id === 'number') {
            tempToRealIdMap.set(tempMedia.id, realMedia.id)
          }
        }
      })

      let finalMedia = productMedia.filter(m => !(m as any).isTemporary)
      finalMedia.push(...uploadedRealMedia)
      
      // Ensure single image is marked as primary
      const images = finalMedia.filter(m => m.type === 'image' || !m.type)
      if (images.length === 1 && !images[0].isPrimary) {
        finalMedia = finalMedia.map(m =>
          m.id === images[0].id ? { ...m, isPrimary: true } : m
        )
      }

      // Normalize variants
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

      const normalizedVariants = (formData.variants || []).map(normalizeVariant)

      // Validate variants
      const invalidOpt1 = normalizedVariants.find(v => !v.option1Name || !v.option1Value)
      if (invalidOpt1) {
        setErrors({ submit: 'Each variant requires Option 1 name and value (e.g., Size: 8).' })
        setLoading(false)
        return
      }

      const skuSet = new Set<string>()
      for (const v of normalizedVariants) {
        const sku = trimVal(v.sku)
        if (!sku) continue
        const k = sku.toLowerCase()
        if (skuSet.has(k)) {
          setErrors({ submit: 'Duplicate SKU detected. Each variant must have a unique SKU.' })
          setLoading(false)
          return
        }
        skuSet.add(k)
      }

      const signatureOf = (v: ProductVariant) => {
        const p = (n?: string, val?: string) => `${trimVal(n).toLowerCase()}:${trimVal(val).toLowerCase()}`
        return [p(v.option1Name, v.option1Value), p(v.option2Name, v.option2Value), p(v.option3Name, v.option3Value)].join('||')
      }

      const sigSet = new Set<string>()
      for (const v of normalizedVariants) {
        const sig = signatureOf(v)
        if (sigSet.has(sig)) {
          setErrors({ submit: 'Duplicate variant combination detected. Ensure each row has a unique set of options.' })
          setLoading(false)
          return
        }
        sigSet.add(sig)
      }

      // Prepare update data
      const updateData: any = {
        ...formData,
        variants: normalizedVariants,
        compareAtPrice: formData.compareAtPrice === undefined || formData.compareAtPrice === null || formData.compareAtPrice === 0 ? null : formData.compareAtPrice,
        costPrice: formData.costPrice === undefined || formData.costPrice === null || formData.costPrice === 0 ? null : formData.costPrice,
        weight: formData.weight === undefined || formData.weight === null || formData.weight === 0 ? null : formData.weight,
        brandId: (formData as any).brandId === -1 ? null : (formData as any).brandId,
        thumbnailUrl: productMedia.find(m => m.isPrimary)?.url || formData.thumbnailUrl
      }
      delete updateData.media

      const response = await apiService.updateProduct(productId, updateData)

      if (response.ok) {
        // Step 3: Process pending media operations (deletions and thumbnail settings)
        
        // Delete pending media
        if (pendingMediaDeletions.length > 0) {
          for (const mediaId of pendingMediaDeletions) {
            try {
              if (typeof mediaId === 'number') {
                await apiService.deleteProductMedia(productId, mediaId)
              }
            } catch (deleteErr) {
              logger.error(`Error deleting media ${mediaId}:`, { error: deleteErr instanceof Error ? deleteErr.message : String(deleteErr) })
            }
          }
        }

        // Set listing thumbnail if pending
        if (pendingListingThumbnail !== null) {
          try {
            let realMediaId: number | null = null
            if (typeof pendingListingThumbnail === 'number') {
              const existingMedia = finalMedia.find(m => m.id === pendingListingThumbnail && typeof m.id === 'number')
              if (existingMedia) {
                realMediaId = existingMedia.id as number
              }
            } else {
              realMediaId = tempToRealIdMap.get(pendingListingThumbnail) || null
              if (realMediaId === null) {
                const tempMedia = productMedia.find((m: any) => m.isTemporary && m.id === pendingListingThumbnail)
                if (tempMedia) {
                  const matchedUploaded = uploadedRealMedia.find(uploaded => {
                    const strictMatch = buildMediaStrictKey(tempMedia) === buildMediaStrictKey(uploaded)
                    const nameMatch = buildMediaNameKey(tempMedia) && buildMediaNameKey(tempMedia) === buildMediaNameKey(uploaded)
                    return strictMatch || nameMatch
                  })
                  if (matchedUploaded && typeof matchedUploaded.id === 'number') {
                    realMediaId = matchedUploaded.id
                  }
                }
              }
            }
            if (realMediaId !== null) {
              await apiService.setProductMediaAsThumbnail(productId, realMediaId)
            }
          } catch (thumbErr) {
            logger.error(`Error setting listing thumbnail:`, { error: thumbErr instanceof Error ? thumbErr.message : String(thumbErr) })
          }
        }

        // Set detail thumbnail if pending
        if (pendingDetailThumbnail !== null) {
          try {
            let realMediaId: number | null = null
            if (typeof pendingDetailThumbnail === 'number') {
              const existingMedia = finalMedia.find(m => m.id === pendingDetailThumbnail && typeof m.id === 'number')
              if (existingMedia) {
                realMediaId = existingMedia.id as number
              }
            } else {
              realMediaId = tempToRealIdMap.get(pendingDetailThumbnail) || null
              if (realMediaId === null) {
                const tempMedia = productMedia.find((m: any) => m.isTemporary && m.id === pendingDetailThumbnail)
                if (tempMedia) {
                  const matchedUploaded = uploadedRealMedia.find(uploaded => {
                    const strictMatch = buildMediaStrictKey(tempMedia) === buildMediaStrictKey(uploaded)
                    const nameMatch = buildMediaNameKey(tempMedia) && buildMediaNameKey(tempMedia) === buildMediaNameKey(uploaded)
                    return strictMatch || nameMatch
                  })
                  if (matchedUploaded && typeof matchedUploaded.id === 'number') {
                    realMediaId = matchedUploaded.id
                  }
                }
              }
            }
            if (realMediaId !== null) {
              await apiService.setProductMediaAsDetailThumbnail(productId, realMediaId)
            }
          } catch (thumbErr) {
            logger.error(`Error setting detail thumbnail:`, { error: thumbErr instanceof Error ? thumbErr.message : String(thumbErr) })
          }
        }

        // Clear pending operations
        setPendingMediaDeletions([])
        setPendingListingThumbnail(null)
        setPendingDetailThumbnail(null)
        setTempUploadedMedia([])

        // Clean up blob URLs
        productMedia.forEach(m => {
          if ((m as any).isTemporary && m.url.startsWith('blob:')) {
            URL.revokeObjectURL(m.url)
          }
        })

        onSuccess?.()
        router.back()
      } else {
        setErrors({ submit: response.data?.message || 'Failed to update product' })
      }
    } catch (error) {
      logger.error('Error updating product:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      setErrors({ submit: 'An error occurred while updating the product' })
    } finally {
      setLoading(false)
    }
  }

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

  const { createCategory: createCategoryFromHook, updateCategory: updateCategoryFromHook, refetch: refetchCategories, categories: categoriesFromHook } = useCategories({
    appId,
    headers: merchantHeaders || undefined
  })

  // Sync categories from useCategories hook to local state
  useEffect(() => {
    if (categoriesFromHook && Array.isArray(categoriesFromHook)) {
      if (categoriesFromHook.length > 0 || categories.length === 0) {
        setCategories(categoriesFromHook)
      }
    }
  }, [categoriesFromHook, categories.length])

  // Handle opening Add Category modal
  const handleOpenAddCategoryModal = () => {
    setShowAddCategoryModal(true)
  }

  // Handle closing Add Category modal
  const handleCloseAddCategoryModal = () => {
    setShowAddCategoryModal(false)
  }

  // Handle category creation success
  const handleCategoryCreated = async (category: Category) => {
    // Add the newly created category to the list
    const newCategory: ProductCategory = {
      id: category.id,
      name: category.name,
      parentId: category.parentId
    }

    setCategories(prev => [...prev, newCategory])

    // Refresh categories list
    await fetchCategories()

    // Close Add Category modal and show Add Product modal
    handleCloseAddCategoryModal()
  }

  // Build category tree for hierarchical structure
  const getCategoryTree = () => {
    const tree: (ProductCategory & { children?: ProductCategory[] })[] = []
    const categoryMap = new Map<number, ProductCategory & { children?: ProductCategory[] }>()
    
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })
    
    categories.forEach(cat => {
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

  // Get parent categories for AddCategoryModal (same as EditProductModal)
  const parentCategoriesForModal = useMemo(() => {
    return getCategoryTree().map(cat => ({
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId,
      imageUrl: (cat as any).imageUrl,
      iconUrl: (cat as any).iconUrl,
      displayType: (cat as any).displayType,
      isActive: (cat as any).isActive ?? true,
      displayOrder: (cat as any).displayOrder ?? 0,
      description: (cat as any).description,
      createdAt: (cat as any).createdAt,
      updatedAt: (cat as any).updatedAt,
      appId: appId
    } as Category))
  }, [categories, appId])



  const handleBack = () => {
    // If there's an unsaved variant, prevent navigation
    if (hasUnsavedVariant) {
      setErrors({ variants: 'Please save or cancel the current variant before leaving this page' })
      setTriggerVariantShake(true)
      setTimeout(() => setTriggerVariantShake(false), 100)
      return
    }
    router.back()
  }

  return (
    <div className="w-full max-w-full min-w-0">
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center ">
        <div className="flex items-center gap-2 text-gray-900">
          <Tags className="w-6 h-6 text-gray-700" />
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          <h2 className="text-2xl font-semibold text-gray-900">Edit Product</h2>
        </div>
      </div>

      {/* Main Layout - Shopify Style: Two Column Grid */}
      <div className="grid grid-cols-12 gap-6 bg-gray-50">
        {/* Main Content Area - Left Column */}
        <div className="col-span-12 lg:col-span-8 pt-4">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}
          {errors.variants && (
            <div className="sticky top-0 z-50 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm flex items-center space-x-2 shadow-md">
              <span className="font-medium">âš ï¸</span>
              <span>{errors.variants}</span>
            </div>
          )}

          {/* Product Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Product Information</h2>
            <div className="space-y-4">
          

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-2.5 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter product name"
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
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
                    className="!py-1.5"
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
                    disabled={loading}
                  />
                </div>

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
                    disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              </div>
          </div>

          {/* Media Section */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4 p-4">
            <h2 className="text-sm font-semibold text-gray-900">Media</h2>
                          <p className="text-xs text-gray-500  mb-4">Upload and manage product images and videos</p>

            <MediaManager
              productId={productId}
              media={productMedia}
              onMediaChange={(newMedia) => {
                setProductMedia(newMedia)
                const primaryImage = newMedia.find(m => m.isPrimary)
                if (primaryImage) {
                  handleInputChange('thumbnailUrl', primaryImage.url)
                }
              }}
              onUpload={async (file) => {
                if (productId) {
                  try {
                    const headers: any = {}
                    if (apiKey) headers['x-api-key'] = apiKey
                    if (appSecretKey) headers['x-app-secret'] = appSecretKey
                    
                    const formData = new FormData()
                    formData.append('files', file)
                    
                    const response = await apiService.uploadProductMedia(productId, formData)
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
                    type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
                    altText: '',
                    displayOrder: productMedia.length,
                    isPrimary: isFirstImage,
                    isListingThumbnail: false,
                    isDetailThumbnail: false,
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
                if (productId && typeof mediaId === 'number') {
                  // Track for deletion on submit
                  setPendingMediaDeletions(prev => [...prev, mediaId])
                  // Remove from UI immediately
                  setProductMedia(prev => prev.filter(m => m.id !== mediaId))
                  return true
                } else {
                  // Temporary media - remove immediately
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
                if (!productId || typeof mediaId !== 'number') return true
                try {
                  const headers: any = {}
                  if (apiKey) headers['x-api-key'] = apiKey
                  if (appSecretKey) headers['x-app-secret'] = appSecretKey
                  const response = await apiService.setProductMediaAsThumbnail(productId, mediaId)
                  return response.ok
                } catch (err) {
                  logger.error('Set primary failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                  return false
                }
              }}
              onSetListingThumbnail={async (mediaId) => {
                // Track for setting on submit
                setPendingListingThumbnail(mediaId)
                // Update UI immediately
                setProductMedia(prev => prev.map(m => ({
                  ...m,
                  isListingThumbnail: m.id === mediaId
                })))
                return true
              }}
              onSetDetailThumbnail={async (mediaId) => {
                // Track for setting on submit
                setPendingDetailThumbnail(mediaId)
                // Update UI immediately
                setProductMedia(prev => prev.map(m => ({
                  ...m,
                  isDetailThumbnail: m.id === mediaId
                })))
                return true
              }}
              loading={loading}
                disabled={loading}
              />
          </div>

          {/* Price Section */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Price</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={basePriceInput}
                  onChange={(e) => {
                    const value = e.target.value
                    setBasePriceInput(value)
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
                    if (formData.basePrice === 0) {
                      setBasePriceInput('')
                    } else {
                      setBasePriceInput(formData.basePrice.toString())
                    }
                  }}
                  className={`w-full px-2.5 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    errors.basePrice ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={loading}
                />
                {errors.basePrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.basePrice}</p>
                )}
              </div>

              {/* Additional display prices - Collapsible */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAdditionalPricesExpanded(!additionalPricesExpanded)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-gray-100 transition-colors rounded-lg"
                  disabled={loading}
                >
                  <span className="text-sm font-medium text-gray-700">Additional display prices</span>
                  {additionalPricesExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                
                {additionalPricesExpanded && (
                  <div className="px-3 pb-3 space-y-4 border-t border-gray-200 pt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Compare at Price
                      </label>
                      <input
                        type="number"
                        value={formData.compareAtPrice || ''}
                        onChange={(e) => handleInputChange('compareAtPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost Price
                      </label>
                      <input
                        type="number"
                        value={formData.costPrice || ''}
                        onChange={(e) => handleInputChange('costPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Inventory Section */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Inventory</h2>
            
            {/* Collapsible Inventory Content */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setInventoryExpanded(!inventoryExpanded)}
                className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-gray-100 transition-colors rounded-lg"
                disabled={loading}
              >
                <span className="text-sm font-medium text-gray-700">Inventory settings</span>
                {inventoryExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                )}
              </button>
              
              {inventoryExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-gray-200 pt-3">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="trackInventory"
                      checked={formData.trackInventory}
                      onChange={(e) => handleInputChange('trackInventory', e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                      disabled={loading}
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
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                            min="1"
                            disabled={loading}
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
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                            min="1"
                            placeholder="No limit"
                            disabled={loading}
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
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
            </div>
          </div>

          {/* Shipping Section */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Shipping</h2>
            <div className="space-y-4">
              {!formData.isDigital && (
                <>
                  {/* Important fields - Always visible */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requiresShipping"
                      checked={formData.requiresShipping}
                      onChange={(e) => handleInputChange('requiresShipping', e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <label htmlFor="requiresShipping" className="ml-2 text-sm font-medium text-gray-700">
                      Physical product
                    </label>
                  </div>

                  {formData.requiresShipping && (
                    <>
                      {/* Dimensions - Always visible */}
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
                              disabled={loading}
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
                              disabled={loading}
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
                              disabled={loading}
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

                      {/* Collapsible section for additional shipping details */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setShippingDetailsExpanded(!shippingDetailsExpanded)}
                          className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-gray-100 transition-colors rounded-lg"
                          disabled={loading}
                        >
                          <span className="text-sm font-medium text-gray-700">Additional shipping details</span>
                          {shippingDetailsExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        
                        {shippingDetailsExpanded && (
                          <div className="px-3 pb-3 space-y-4 border-t border-gray-200 pt-3">
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
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
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
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
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
                                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  disabled={loading}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Warranty details (e.g., 1 year manufacturer warranty)"
                  disabled={loading}
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
          </div>

          {/* Variants Section */}
          <div className="bg-white border border-gray-200 rounded-lg mb-4 p-4">
            <ShopifyVariantManager
              variants={formData.variants || []}
              onVariantsChange={(variants) => handleInputChange('variants', variants)}
              onEditingStateChange={(hasUnsaved, editingIndex) => {
                // Debug: Log when editing state changes
                console.log('[AddProductSection] Variant editing state changed:', { hasUnsaved, editingIndex })
                setHasUnsavedVariant(hasUnsaved)
                setEditingVariantIndex(editingIndex)
              }}
              triggerShake={triggerVariantShake}
            />
          </div>

          {/* Search Engine Listing Section */}
          {/* <div className="bg-white border border-gray-200 rounded-lg mb-4 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Search engine listing</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Add a title and description to see how this product might appear in a search engine listing.
              </p>
              <button
                type="button"
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit website SEO</span>
              </button>
            </div>
          </div> */}

          {/* Bottom Right Action Buttons */}
     
        </div>

        {/* Right Sidebar - Product Options & Categorization */}
        <aside className="col-span-12 lg:col-span-4 bg-white border border-gray-200 rounded-lg p-4 space-y-6 sticky top-[3rem] h-fit">
          {/* Product Options */}
          <div className="bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Product Options</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isNew || false}
                  onChange={(e) => handleInputChange('isNew', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700">New Product</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDigital}
                  onChange={(e) => {
                    handleInputChange('isDigital', e.target.checked)
                    if (e.target.checked) {
                      handleInputChange('requiresShipping', false)
                    }
                  }}
                  className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700">Digital Product</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="ml-2 text-sm text-gray-700">Featured Product</span>
              </label>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Category</h3>
            <div className="relative" ref={categoryPickerRef}>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={formData.categoryIds && formData.categoryIds.length > 0 
                  ? categories.find(c => c.id === formData.categoryIds![0])?.name || ''
                  : ''}
                onClick={() => setCategoryPickerOpen(!categoryPickerOpen)}
                placeholder="Choose a product category"
                className={`w-full px-2.5 py-1.5 border rounded-lg text-sm cursor-pointer ${
                  categoryPickerOpen 
                    ? 'border-blue-500 ring-2 ring-blue-500' 
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                }`}
                disabled={loading}
              />
              {formData.categoryIds && formData.categoryIds.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInputChange('categoryIds', []);
                    setCategoryPickerOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Hierarchical Category Picker Dropdown */}
            {categoryPickerOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
                {/* Breadcrumb Navigation - full path, each segment clickable */}
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCategoryPickerPath([])}
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    All
                  </button>
                  {categoryPickerPath.map((categoryId, index) => {
                    const category = categories.find(c => c.id === categoryId);
                    const isLast = index === categoryPickerPath.length - 1;
                    return (
                      <span key={categoryId} className="flex items-center gap-1">
                        <span className="text-gray-400">/</span>
                        <button
                          type="button"
                          onClick={() => setCategoryPickerPath(categoryPickerPath.slice(0, index + 1))}
                          className={`text-sm font-medium ${isLast ? 'text-gray-900 cursor-default' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                          {category?.name || 'Category'}
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* Category List */}
                <div className="overflow-y-auto flex-1">
                  {(() => {
                    const currentParentId = categoryPickerPath.length > 0 
                      ? categoryPickerPath[categoryPickerPath.length - 1] 
                      : null;
                    
                    const currentCategories = categories.filter(cat => {
                      if (currentParentId === null) {
                        return !cat.parentId;
                      }
                      return cat.parentId === currentParentId;
                    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

                    if (currentCategories.length === 0) {
                      return (
                        <div className="px-3 py-4 text-sm text-gray-500 text-center">
                          No categories available
                        </div>
                      );
                    }

                    return currentCategories.map(category => {
                      const hasChildren = categories.some(c => c.parentId === category.id);
                      const isSelected = formData.categoryIds?.includes(category.id);

                      return (
                        <div
                          key={category.id}
                          className={`px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between group ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            if (hasChildren) {
                              // Navigate into subcategory
                              setCategoryPickerPath([...categoryPickerPath, category.id]);
                            } else {
                              // Select this category
                              handleInputChange('categoryIds', [category.id]);
                              setCategoryPickerOpen(false);
                              setCategoryPickerPath([]);
                            }
                          }}
                        >
                          <span className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                            {category.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            {isSelected && (
                              <Check className="w-4 h-4 text-gray-900" />
                            )}
                            {hasChildren && (
                              <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Product Tags */}
          <div className="bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Product Tags</h3>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              maxLength={30}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Enter tag name"
              disabled={loading}
            />
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Remove tag"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

           <div className="flex justify-end items-center space-x-3 mt-6 pb-6">
            {/* <button
              onClick={() => handleSubmit('draft')}
              disabled={loading}
              className="px-4 py-2.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save as Draft'}
            </button> */}
            <button
              onClick={() => handleSubmit()}
              disabled={loading || loadingProduct}
              className="px-5 py-2.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Update Product</span>
                </>
              )}
            </button>
          </div>

          {/* Old Media Step - Remove duplicate */}
          {false && (
            <div className="space-y-3">
              <MediaManager
                productId={productId}
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
                  // If product is already created, upload immediately
                  if (productId) {
                    try {
                      const headers: any = {}
                      if (apiKey) headers['x-api-key'] = apiKey
                      if (appSecretKey) headers['x-app-secret'] = appSecretKey
                      
                      const formData = new FormData()
                      formData.append('files', file)
                      
                      const response = await apiService.uploadProductMedia(productId, formData)
                      if (response.ok && response.data?.media && response.data.media.length > 0) {
                        return response.data.media[0]
                      }
                      return null
                    } catch (err) {
                      logger.error('Upload failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return null
                    }
                  } else {
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
                      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const,
                      altText: '',
                      displayOrder: productMedia.length,
                      isPrimary: isFirstImage, // Auto-set as primary if it's the first image
                      isListingThumbnail: false,
                      isDetailThumbnail: false,
                      thumbnailUrl: previewUrl,
                      originalFileName: file.name,
                      fileSize: file.size,
                      mimeType: file.type,
                      isTemporary: true // Flag to identify temp uploads
                    }

                    setProductMedia(prev => [...prev, tempMedia])

                    // Store the file for later upload on submit
                    setTempUploadedMedia(prev => [...prev, file])

                    return tempMedia
                  }
                }}
                onDelete={async (mediaId) => {
                  // If product exists, delete from server
                  if (productId) {
                    try {
                      const headers: any = {}
                      if (apiKey) headers['x-api-key'] = apiKey
                      if (appSecretKey) headers['x-app-secret'] = appSecretKey
                      
                      const response = await apiService.deleteProductMedia(productId, mediaId)
                      return response.ok
                    } catch (err) {
                      logger.error('Delete failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return false
                    }
                  } else {
                    // Remove temporary media
                    setProductMedia(prev => {
                      const mediaToDelete = prev.find(m => m.id === mediaId)
                      if (mediaToDelete?.isTemporary && mediaToDelete.url.startsWith('blob:')) {
                        URL.revokeObjectURL(mediaToDelete.url)
                      }
                      
                      // Find the index of the temporary media to remove corresponding file
                      const tempMediaIndex = prev.findIndex(m => m.id === mediaId && m.isTemporary)
                      if (tempMediaIndex !== -1) {
                        // Remove corresponding file from tempUploadedMedia
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
                    if (!productId || typeof mediaId !== 'number') {
                      return true
                    }
                    try {
                      const headers: any = {}
                      if (apiKey) headers['x-api-key'] = apiKey
                      if (appSecretKey) headers['x-app-secret'] = appSecretKey
                      
                      const response = await apiService.setProductMediaAsThumbnail(productId, mediaId)
                      return response.ok
                    } catch (err) {
                      logger.error('Set primary failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return false
                    }
                  }}
                  onSetListingThumbnail={async (mediaId) => {
                    if (!productId || typeof mediaId !== 'number') {
                      return true
                    }
                    try {
                      const headers: any = {}
                      if (apiKey) headers['x-api-key'] = apiKey
                      if (appSecretKey) headers['x-app-secret'] = appSecretKey
                      
                      const response = await apiService.setProductMediaAsThumbnail(productId, mediaId)
                      return response.ok
                    } catch (err) {
                      logger.error('Set listing thumbnail failed:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
                      return false
                    }
                  }}
                  onSetDetailThumbnail={async (mediaId) => {
                    if (!productId || typeof mediaId !== 'number') {
                      return true
                    }
                    try {
                      const headers: any = {}
                      if (apiKey) headers['x-api-key'] = apiKey
                      if (appSecretKey) headers['x-app-secret'] = appSecretKey
                      
                      const response = await apiService.setProductMediaAsDetailThumbnail(productId, mediaId)
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

  
          {/* Old Categories Step - Already handled above */}
          {false && (
            <div className="space-y-4">
              {/* Selected Categories List */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Categories
                  </label>
                {formData.categoryIds && formData.categoryIds.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.categoryIds.map(categoryId => {
                      const category = categories.find(c => c.id === categoryId);
                      return category ? (
                        <div key={categoryId} className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-lg">
                          <span className="text-xs text-gray-700">{category.name}</span>
                  <button
                    type="button"
                            onClick={() => handleInputChange('categoryIds', formData.categoryIds?.filter(id => id !== categoryId))}
                            className="text-gray-400 hover:text-red-600"
                            disabled={loading}
                  >
                            <X className="w-3 h-3" />
                  </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No categories selected. Add categories below.</p>
                )}
                </div>

              {/* Add Category Card */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FolderPlus className="w-4 h-4 text-orange-600" />
                    <h3 className="text-sm font-medium text-gray-700">Add New Category</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(!showAddCategory);
                      if (showAddCategory) {
                        // Reset form when closing
                        setNewCategoryName('');
                        setNewCategoryDescription('');
                        setSelectedParentCategory(null);
                        setCategoryDisplayMode('image');
                        setCategoryImageFile(null);
                        setCategoryImagePreview(null);
                          setCategorySelectedIcon(null);
                          setCategorySelectedEmoji(null);
                          setCategoryReplacementWarning(null);
                          setShowCategoryReplacementWarning(false);
                          setCategoryError(null);
                          if (categoryFileInputRef.current) {
                            categoryFileInputRef.current.value = '';
                          }
                        }
                      }}
                    className="text-xs text-gray-600 hover:text-gray-900"
                    disabled={loading}
                  >
                    {showAddCategory ? 'Cancel' : 'Add'}
                  </button>
                </div>

                {showAddCategory && (
                  <div className="p-4 space-y-4 bg-white">
                    {/* Category Error Message */}
                    {categoryError && (
                      <div ref={categoryErrorRef} className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-orange-800 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-orange-800 flex-1">{categoryError}</p>
                        <button
                          type="button"
                          onClick={() => setCategoryError(null)}
                          className="flex-shrink-0 p-0.5 hover:bg-orange-100 rounded transition-colors"
                          aria-label="Close error"
                        >
                          <X className="w-3.5 h-3.5 text-orange-800" />
                        </button>
                      </div>
                    )}

                    {/* Replacement Warning - Sticky at top */}
                    {showCategoryReplacementWarning && categoryReplacementWarning && (
                      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-4 px-4 pt-4 animate-in slide-in-from-top duration-300 bg-white">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-sm px-3 py-2 flex items-center gap-2">
                          <div className="flex-shrink-0">
                            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <p className="text-xs text-amber-800 flex-1">{categoryReplacementWarning}</p>
                          <button
                            type="button"
                            onClick={() => setShowCategoryReplacementWarning(false)}
                            className="flex-shrink-0 p-0.5 hover:bg-amber-100 rounded transition-colors"
                            aria-label="Close warning"
                          >
                            <X className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Parent Category and Category Name - One Row on Large Screens */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Parent Category *
                        </label>
                        <select
                          value={selectedParentCategory || ""}
                          onChange={(e) => setSelectedParentCategory(e.target.value ? Number(e.target.value) : null)}
                          disabled={creatingCategory || loading}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:bg-gray-100"
                        >
                          <option value="">No parent (Top level)</option>
                          {getCategoriesForDropdown().map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {'  '.repeat(cat.depth)}
                              {cat.depth > 0 ? 'â”” ' : ''}
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter category name"
                          maxLength={30}
                          disabled={creatingCategory || loading}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:bg-gray-100"
                        />
                      </div>
                    </div>

                    {/* Category Display */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Category Display
                      </label>
                      <p className="text-xs text-gray-500 mb-2">Choose one: Upload image OR select icon/emoji</p>
                      
                      {/* Display Mode Toggle */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => handleCategoryModeSwitch('image')}
                          disabled={loading}
                          className={`relative flex items-center justify-center space-x-2 p-2.5 border rounded-lg transition-all ${
                            categoryDisplayMode === 'image'
                              ? 'border-orange-500 bg-orange-50 shadow-sm'
                              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {categoryDisplayMode === 'image' && (
                            <div className="absolute top-1 right-1">
                              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            </div>
                          )}
                          <ImageIcon className={`w-4 h-4 ${categoryDisplayMode === 'image' ? 'text-orange-600' : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium ${categoryDisplayMode === 'image' ? 'text-orange-600' : 'text-gray-700'}`}>
                            Upload Image
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCategoryModeSwitch('icon')}
                          disabled={loading}
                          className={`relative flex items-center justify-center space-x-2 p-2.5 border rounded-lg transition-all ${
                            categoryDisplayMode === 'icon'
                              ? 'border-orange-500 bg-orange-50 shadow-sm'
                              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {categoryDisplayMode === 'icon' && (
                            <div className="absolute top-1 right-1">
                              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            </div>
                          )}
                          <Tags className={`w-4 h-4 ${categoryDisplayMode === 'icon' ? 'text-orange-600' : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium ${categoryDisplayMode === 'icon' ? 'text-orange-600' : 'text-gray-700'}`}>
                            Icon/Emoji
                          </span>
                        </button>
                      </div>

                      {/* Image Upload Section */}
                      {categoryDisplayMode === 'image' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <input
                            ref={categoryFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCategoryImageChange}
                            className="hidden"
                          />
                          {!categoryImagePreview ? (
                            <button
                              type="button"
                              onClick={() => categoryFileInputRef.current?.click()}
                              disabled={loading}
                              className="w-full flex items-center justify-center space-x-2 px-3 py-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-white transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Upload className="w-5 h-5 text-orange-500" />
                              <span className="text-sm font-medium text-gray-700">Click to upload</span>
                              <span className="text-xs text-gray-500">â€¢ Max 5MB</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="relative inline-block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={categoryImagePreview}
                                  alt="Category preview"
                                  className="w-24 h-24 object-cover rounded-lg border-2 border-orange-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCategoryImageFile(null);
                                    setCategoryImagePreview(null);
                                    if (categoryFileInputRef.current) {
                                      categoryFileInputRef.current.value = '';
                                    }
                                  }}
                                  disabled={loading}
                                  className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remove image"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-2 text-xs text-gray-600 mb-1">
                                  <span className="truncate">{categoryImageFile?.name}</span>
                                  <span className="text-gray-400">â€¢</span>
                                  <span>{(categoryImageFile?.size ? (categoryImageFile.size / 1024).toFixed(1) : '0')} KB</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => categoryFileInputRef.current?.click()}
                                  disabled={loading}
                                  className="text-xs text-orange-600 hover:text-orange-700 font-medium text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Change image
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Icon/Emoji Selection Section */}
                      {categoryDisplayMode === 'icon' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          {(categorySelectedIcon || categorySelectedEmoji) ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-orange-200">
                                <div className="flex items-center justify-center w-10 h-10 border border-orange-200 rounded-lg bg-white">
                                  {categorySelectedIcon ? (
                                    <CategoryIcon iconUrl={categorySelectedIcon.filePath} size={24} />
                                  ) : categorySelectedEmoji ? (
                                    <LocalEmoji emojiData={categorySelectedEmoji} size={24} />
                                  ) : null}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-700 truncate">
                                    {categorySelectedIcon?.name || categorySelectedEmoji?.name || 'Selected'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {categorySelectedIcon ? 'Icon' : 'Emoji'} selected
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsCategoryIconPickerOpen(true)}
                                disabled={loading}
                                className="w-full px-3 py-1.5 text-sm font-medium text-orange-600 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Change Selection
                        </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsCategoryIconPickerOpen(true)}
                              disabled={loading}
                              className="w-full flex items-center justify-center space-x-2 px-3 py-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-white transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Tags className="w-5 h-5 text-orange-500" />
                              <span className="text-sm font-medium text-gray-700">Click to select</span>
                              <span className="text-xs text-gray-500">â€¢ Browse library</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCategory(false);
                          setNewCategoryName('');
                          setNewCategoryDescription('');
                            setSelectedParentCategory(null);
                          setCategoryDisplayMode('image');
                          setCategoryImageFile(null);
                          setCategoryImagePreview(null);
                          setCategorySelectedIcon(null);
                          setCategorySelectedEmoji(null);
                          setCategoryReplacementWarning(null);
                          setShowCategoryReplacementWarning(false);
                          setCategoryError(null);
                          if (categoryFileInputRef.current) {
                            categoryFileInputRef.current.value = '';
                          }
                        }}
                        disabled={creatingCategory || loading}
                        className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={creatingCategory || loading || !newCategoryName.trim()}
                        className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {creatingCategory ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Creating...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Create Category</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Available Categories List */}
              <div ref={availableCategoriesRef} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">Available Categories</h3>
                </div>
                <div className="max-h-64 overflow-y-auto p-3 bg-white">
                  {categories.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No categories available. Create one above.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                      {categories.map(category => (
                        <div 
                          key={category.id} 
                          className={`flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-all ${
                            newlyCreatedCategoryId === category.id 
                              ? 'bg-green-50 border border-green-300 animate-pulse' 
                              : ''
                          }`}
                        >
                          <label className="flex items-center flex-1 cursor-pointer">
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
                            disabled={loading}
                          />
                          {editingCategoryId === category.id ? (
                            <div className="ml-2 flex items-center space-x-2 flex-1">
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && editingCategoryName.trim() !== category.name && editingCategoryName.trim() !== '' && handleUpdateCategory(category.id)}
                                className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                                autoFocus
                                maxLength={30}
                                disabled={loading}
                              />
                              {editingCategoryName.trim() !== category.name && editingCategoryName.trim() !== '' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCategory(category.id)}
                                  className="p-1 hover:bg-green-100 rounded text-green-600"
                                  title="Save changes"
                                  disabled={loading}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategoryId(null)
                                  setEditingCategoryName('')
                                }}
                                className="p-1 hover:bg-red-100 rounded text-red-600"
                                title="Cancel editing"
                                disabled={loading}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="ml-2 text-sm text-gray-700 flex-1 truncate">{category.name}</span>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCategoryId(category.id)
                                    setEditingCategoryName(category.name)
                                  }}
                                  className="p-1 hover:bg-blue-100 rounded text-orange-600"
                                  disabled={loading}
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


{/* Add Category Modal */}
<AddCategoryModal
  isOpen={showAddCategoryModal}
  onClose={handleCloseAddCategoryModal}
  appId={appId}
  parentCategories={parentCategoriesForModal}
  onSuccess={handleCategoryCreated}
  onSubmit={createCategoryFromHook}
/>

{/* Unified Asset Picker for Category Icon / Emoji */}
<UnifiedAssetPicker
  isOpen={isCategoryIconPickerOpen}
  onClose={() => setIsCategoryIconPickerOpen(false)}
  onSelect={(asset) => {
    // Show warning only if an image is already uploaded
    if (categoryImageFile) {
      setCategoryReplacementWarning(
        'Selecting an icon/emoji will replace the currently uploaded image.'
      );
    } else {
      setCategoryReplacementWarning(null);
    }

    if (asset.type === 'icon') {
      setCategorySelectedIcon({
        name: asset.name,
        library: asset.libraryKey,
        libraryKey: asset.libraryKey,
        filePath: asset.filePath,
        title: asset.title,
        description: asset.description || '',
        keywords: asset.keywords,
        category: asset.category,
        license: asset.license || '',
        website: asset.website || '',
        optimized: asset.optimized || false,
      });

      setCategorySelectedEmoji(null);
      setCategorySelectedAsset(asset);
    }

    if (asset.type === 'emoji') {
      setCategorySelectedEmoji({
        name: asset.name,
        unicode: asset.unicode || '',
        shortcode: asset.shortcode || '',
        category: asset.category,
        sourceKey: asset.libraryKey || '',
        source: asset.library || '',
        subcategory: '',
        keywords: asset.keywords || [],
        tags: [],
        version: '',
        license: asset.license || '',
        website: asset.website || '',
        filePath: asset.filePath || '',
        optimized: asset.optimized || false,
      });

      setCategorySelectedIcon(null);
      setCategorySelectedAsset(asset);
    }

    // Clear uploaded image when icon or emoji is selected
    setCategoryImageFile(null);
    setCategoryImagePreview(null);

    if (categoryFileInputRef.current) {
      categoryFileInputRef.current.value = '';
    }

    setIsCategoryIconPickerOpen(false);
  }}
  selectedAsset={categorySelectedAsset}
  title="Select Category Icon or Emoji"
/>

    </div>
  )
}
//latest