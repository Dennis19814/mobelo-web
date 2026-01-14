'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { X, Upload, Plus, Trash2, Loader2, Package, DollarSign, Box, Layers, Image, FolderTree, Truck, Edit2, Check, XCircle, Tags, ChevronLeft, ChevronRight, FolderPlus, Image as ImageIcon, LayoutGrid, AlertCircle } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import type { CreateProductDto, ProductCategory, ProductVariant, ProductMedia } from '@/types/product.types'
import VariantManager from '../VariantManager'
import MediaManager from '../MediaManager'
import BrandSelectorWithImages from '../../ui/BrandSelectorWithImages'
import { AddCategoryModal } from './AddCategoryModal'
import type { Category } from '@/types/category'
import { useCategories } from '@/hooks/useCategories'
import { useMerchantAuth } from '@/hooks'
import { UnifiedAssetPicker } from '@/components/ui/UnifiedAssetPicker'
import { UnifiedAssetData } from '@/lib/unified-asset-loader'
import { CategoryIcon } from '@/components/ui/icons/LocalCategoryIcon'
import { LocalEmoji } from '@/components/ui/emojis/LocalEmoji'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  appId: number
  apiKey?: string
  appSecretKey?: string
}

export default function AddProductModal({ isOpen, onClose, onSuccess, appId, apiKey, appSecretKey }: AddProductModalProps) {
  const [activeStep, setActiveStep] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [isAddModalVisible, setIsAddModalVisible] = useState(true)
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
  const [categoryReplacementWarning, setCategoryReplacementWarning] = useState<string | null>(null)
  const [showCategoryReplacementWarning, setShowCategoryReplacementWarning] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [newlyCreatedCategoryId, setNewlyCreatedCategoryId] = useState<number | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [productMedia, setProductMedia] = useState<ProductMedia[]>([])
  const [createdProductId, setCreatedProductId] = useState<number | null>(null)
  const [tempUploadedMedia, setTempUploadedMedia] = useState<File[]>([]) // Track temporary uploads
  const [isBrandValid, setIsBrandValid] = useState(true)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [basePriceInput, setBasePriceInput] = useState<string>('') // Local state for base price input
  const [hasUnsavedVariant, setHasUnsavedVariant] = useState(false)
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [triggerVariantShake, setTriggerVariantShake] = useState(false)

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

    setCreatingCategory(true)
    try {
      // Prepare category data based on display mode
      let categoryData: any = {
        name: newCategoryName.trim(),
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
      }
    } catch (error) {
      logger.error('Failed to add category:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
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
      const response = await apiService.deleteCategory(categoryId)
      
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

  useEffect(() => {
    if (isOpen) {
      setIsAddModalVisible(true)
      setShowAddCategoryModal(false)
      fetchCategories()
      // Sync basePriceInput with formData when modal opens
      if (formData.basePrice === 0) {
        setBasePriceInput('')
      } else {
        setBasePriceInput(formData.basePrice.toString())
      }
    }
  }, [isOpen, fetchCategories])
  
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

  const handleSubmit = async (status: 'draft' | 'active') => {
    if (!validateForm()) {
      // Switch to the step with the first error
      const errorFields = Object.keys(errors)
      if (errorFields.includes('name') || errorFields.includes('description')) {
        goToStep(0) // basic step
      } else if (errorFields.includes('basePrice')) {
        goToStep(1) // pricing step
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
        const newProductId = response.data.id
        setCreatedProductId(newProductId)

        // Upload temporary media files if any
        if (tempUploadedMedia.length > 0 && newProductId) {
          try {
            const uploadFormData = new FormData()
            tempUploadedMedia.forEach(file => {
              uploadFormData.append('files', file)
            })
            
            const uploadResponse = await apiService.uploadProductMedia(newProductId, uploadFormData)
            if (uploadResponse.ok && uploadResponse.data?.media) {
              // Update productMedia with uploaded media IDs
              const uploadedMedia = uploadResponse.data.media
              setProductMedia(prev => {
                const tempMedia = prev.filter(m => m.isTemporary)
                const permanentMedia = prev.filter(m => !m.isTemporary)
                
                // Replace temporary media with uploaded media
                const updatedMedia = [...permanentMedia, ...uploadedMedia]
                
                // Clean up blob URLs
                tempMedia.forEach(m => {
                  if (m.url.startsWith('blob:')) {
                    URL.revokeObjectURL(m.url)
                  }
                })
                
                return updatedMedia
              })
              
              // Clear temporary files
              setTempUploadedMedia([])
            }
          } catch (uploadError) {
            logger.error('Error uploading temporary media:', { error: uploadError instanceof Error ? uploadError.message : String(uploadError), stack: uploadError instanceof Error ? uploadError.stack : undefined })
            // Don't fail the whole operation if media upload fails
          }
        }

        // Defer user-facing success message to parent section (shows inline banner like SettingsGeneralSection)
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
    setIsAddModalVisible(false)
    setShowAddCategoryModal(true)
  }

  // Handle closing Add Category modal and showing Add Product modal again
  const handleCloseAddCategoryModal = () => {
    setShowAddCategoryModal(false)
    setIsAddModalVisible(true)
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
    setActiveStep(0)
    setCompletedSteps(new Set())
    setShowAddCategory(false)
    setNewCategoryName('')
    setNewCategoryDescription('')
    setEditingCategoryId(null)
    setEditingCategoryName('')
    setDeletingCategoryId(null)
    setProductMedia([])
    setCreatedProductId(null)
    setTempUploadedMedia([])
    setBasePriceInput('')
    setHasUnsavedVariant(false)
    // Clean up any blob URLs
    productMedia.forEach(m => {
      if (m.isTemporary && m.url.startsWith('blob:')) {
        URL.revokeObjectURL(m.url)
      }
    })
  }

  if (!isOpen) return null

  const steps = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'variants', label: 'Variants', icon: Layers },
    { id: 'media', label: 'Media', icon: Image },
    { id: 'categories', label: 'Categories', icon: FolderTree }
  ]

  const currentStepId = steps[activeStep]?.id || 'basic'

  const nextStep = () => {
    // If there's an unsaved variant being edited, prevent navigation
    if (currentStepId === 'variants' && hasUnsavedVariant) {
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
      return
    }
    
    // Validate current step before proceeding
    if (validateStep(currentStepId)) {
      // Mark current step as completed
      setCompletedSteps(prev => new Set(prev).add(activeStep))
      
      // Move to next step if available
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1)
      }
    }
  }

  const previousStep = () => {
    // If there's an unsaved variant being edited on variants step, prevent navigation
    if (currentStepId === 'variants' && hasUnsavedVariant) {
      setErrors({ variants: 'Please save or cancel the current variant before going back to the previous step' })
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
      return
    }
    
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    // If there's an unsaved variant being edited on variants step, prevent navigation to any other step
    if (currentStepId === 'variants' && hasUnsavedVariant && stepIndex !== activeStep) {
      const direction = stepIndex > activeStep ? 'proceeding to the next step' : 'going back to the previous step'
      setErrors({ variants: `Please save or cancel the current variant before ${direction}` })
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
      return
    }
    
    // Only allow navigation to completed steps, previous steps, or the immediate next step (if current is valid)
    if (stepIndex >= 0 && stepIndex < steps.length) {
      const isCompleted = completedSteps.has(stepIndex)
      const isPrevious = stepIndex < activeStep
      const isCurrent = stepIndex === activeStep
      const isImmediateNext = stepIndex === activeStep + 1
      
      // Allow going to: completed steps, previous steps, current step, or immediate next step (if current is valid)
      if (isCompleted || isPrevious || isCurrent || (isImmediateNext && validateStep(currentStepId))) {
        if (isImmediateNext && validateStep(currentStepId)) {
          setCompletedSteps(prev => new Set(prev).add(activeStep))
        }
        setActiveStep(stepIndex)
      }
    }
  }

  const handleClose = () => {
    // If there's an unsaved variant, prevent closing
    if (hasUnsavedVariant) {
      setErrors({ variants: 'Please save or cancel the current variant before closing the modal' })
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
      // Navigate to variants step if not already there
      if (currentStepId !== 'variants') {
        const variantsStepIndex = steps.findIndex(s => s.id === 'variants')
        if (variantsStepIndex !== -1) {
          setActiveStep(variantsStepIndex)
        }
      }
      return
    }

    // Call the original onClose
    onClose()
  }

  return (
    <>
    <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto ${!isAddModalVisible ? 'hidden' : ''}`}>
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
          <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Package className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Add New Product</h2>
              <p className="text-xs text-gray-500">Step {activeStep + 1} of {steps.length}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
          >
            <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between overflow-x-auto" style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = activeStep === index
                const isCompleted = completedSteps.has(index)
                const isPrevious = index < activeStep
                const isCurrent = index === activeStep
                const isImmediateNext = index === activeStep + 1
                // Allow clicking on completed steps, previous steps, current step, or immediate next step
                const isClickable = isCompleted || isPrevious || isCurrent || isImmediateNext
                
                return (
                  <div key={step.id} className="flex items-center flex-shrink-0 pt-2">
                    <button
                      onClick={() => isClickable && goToStep(index)}
                      disabled={!isClickable}
                      className={`flex flex-col items-center min-w-[80px] transition-all ${
                        isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
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
                        {step.id === 'variants' && formData.variants && formData.variants.length > 0 && (
                          <span className="absolute -top-1 -right-1 z-10 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-semibold rounded-full border-2 border-white">
                            {formData.variants.length}
                          </span>
                        )}
                        {step.id === 'categories' && formData.categoryIds && formData.categoryIds.length > 0 && (
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
                      <div className={`mx-2 h-0.5 w-8 md:w-14 transition-all ${
                        completedSteps.has(index) ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 relative">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}
          {errors.variants && (
            <div className="sticky top-0 z-50 mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm flex items-center space-x-2 shadow-md">
              <span className="font-medium">⚠️</span>
              <span>{errors.variants}</span>
            </div>
          )}

          {/* Basic Info Step */}
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

          {/* Pricing Step */}
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

          {/* Inventory Step */}
          {currentStepId === 'inventory' && (
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

          {/* Shipping Step */}
          {currentStepId === 'shipping' && (
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

          {/* Variants Step */}
          {currentStepId === 'variants' && (
            <div className="">
              {/* <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Add product variants for different options like size, color, or material. Each variant can have its own SKU, price, and inventory.
                </p>
              </div> */}
              <VariantManager
                variants={formData.variants || []}
                onVariantsChange={(variants) => handleInputChange('variants', variants)}
                onEditingStateChange={(hasUnsaved, editingIndex) => {
                  setHasUnsavedVariant(hasUnsaved)
                  setEditingVariantIndex(editingIndex)
                }}
                triggerShake={triggerVariantShake}
              />
            </div>
          )}

          {/* Media Step */}
          {currentStepId === 'media' && (
            <div className="space-y-3">
              <MediaManager
                productId={createdProductId || undefined}
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
                  if (createdProductId) {
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
                  if (createdProductId) {
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
                    if (!createdProductId) return false
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
                    if (!createdProductId) return false
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
                    if (!createdProductId) return false
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
            </div>
          )}

  
          {/* Categories Step */}
          {currentStepId === 'categories' && (
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
                          if (categoryFileInputRef.current) {
                            categoryFileInputRef.current.value = '';
                          }
                        }
                      }}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    {showAddCategory ? 'Cancel' : 'Add'}
                  </button>
                </div>

                {showAddCategory && (
                  <div className="p-4 space-y-4 bg-white">
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
                          disabled={creatingCategory}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:bg-gray-100"
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
                          disabled={creatingCategory}
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
                          className={`relative flex items-center justify-center space-x-2 p-2.5 border rounded-lg transition-all ${
                            categoryDisplayMode === 'image'
                              ? 'border-orange-500 bg-orange-50 shadow-sm'
                              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                          }`}
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
                          className={`relative flex items-center justify-center space-x-2 p-2.5 border rounded-lg transition-all ${
                            categoryDisplayMode === 'icon'
                              ? 'border-orange-500 bg-orange-50 shadow-sm'
                              : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                          }`}
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
                              className="w-full flex items-center justify-center space-x-2 px-3 py-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-white transition-colors bg-white"
                            >
                              <Upload className="w-5 h-5 text-orange-500" />
                              <span className="text-sm font-medium text-gray-700">Click to upload</span>
                              <span className="text-xs text-gray-500">• Max 5MB</span>
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
                                  className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                  title="Remove image"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center space-x-2 text-xs text-gray-600 mb-1">
                                  <span className="truncate">{categoryImageFile?.name}</span>
                                  <span className="text-gray-400">•</span>
                                  <span>{(categoryImageFile?.size ? (categoryImageFile.size / 1024).toFixed(1) : '0')} KB</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => categoryFileInputRef.current?.click()}
                                  className="text-xs text-orange-600 hover:text-orange-700 font-medium text-left"
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
                                className="w-full px-3 py-1.5 text-sm font-medium text-orange-600 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                              >
                                Change Selection
                        </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsCategoryIconPickerOpen(true)}
                              className="w-full flex items-center justify-center space-x-2 px-3 py-4 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-400 hover:bg-white transition-colors bg-white"
                            >
                              <Tags className="w-5 h-5 text-orange-500" />
                              <span className="text-sm font-medium text-gray-700">Click to select</span>
                              <span className="text-xs text-gray-500">• Browse library</span>
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
                          if (categoryFileInputRef.current) {
                            categoryFileInputRef.current.value = '';
                          }
                        }}
                        disabled={creatingCategory}
                        className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={creatingCategory || !newCategoryName.trim()}
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
                              />
                              {editingCategoryName.trim() !== category.name && editingCategoryName.trim() !== '' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCategory(category.id)}
                                  className="p-1 hover:bg-green-100 rounded text-green-600"
                                  title="Save changes"
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

              {/* Tags Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Tags
                </label>
                <input
                  type="text"
                  value={formData.tags?.join(', ')}
                  onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                  placeholder="Enter tags separated by commas"
                />
                <p className="mt-1 text-xs text-gray-500">Separate tags with commas</p>
              </div>
            </div>
          )}

        </div>

        {/* Footer - Fixed at bottom */}
        <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <div className="flex items-center space-x-3">
            {/* Previous Button */}
            {activeStep > 0 && (
              <button
                onClick={previousStep}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            )}
            
            {/* Next Button */}
            {activeStep < steps.length - 1 ? (
              <button
                onClick={nextStep}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                {/* Save as Draft and Add Product - Only show on last step */}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Add Category Modal */}
    <AddCategoryModal
      isOpen={showAddCategoryModal}
      onClose={handleCloseAddCategoryModal}
      appId={appId}
      parentCategories={parentCategoriesForModal}
      onSuccess={handleCategoryCreated}
      onSubmit={createCategoryFromHook}
    />

    {/* Unified Asset Picker for Category Icon/Emoji */}
    <UnifiedAssetPicker
      isOpen={isCategoryIconPickerOpen}
      onClose={() => setIsCategoryIconPickerOpen(false)}
      onSelect={(asset) => {
        // Only show warning if image is actually uploaded (not null)
        if (categoryImageFile) {
          setCategoryReplacementWarning('Selecting an icon/emoji will replace the currently uploaded image.');
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
            optimized: asset.optimized || false
          });
          setCategorySelectedEmoji(null);
          setCategorySelectedAsset(asset);
          // Clear image when icon is selected
          setCategoryImageFile(null);
          setCategoryImagePreview(null);
          if (categoryFileInputRef.current) {
            categoryFileInputRef.current.value = '';
          }
        } else if (asset.type === 'emoji') {
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
            optimized: asset.optimized || false
          });
          setCategorySelectedIcon(null);
          setCategorySelectedAsset(asset);
          // Clear image when emoji is selected
          setCategoryImageFile(null);
          setCategoryImagePreview(null);
          if (categoryFileInputRef.current) {
            categoryFileInputRef.current.value = '';
          }
        }
        setIsCategoryIconPickerOpen(false);
      }}
      selectedAsset={categorySelectedAsset}
      title="Select Category Icon or Emoji"
    />
    </>
  )
}