'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { X, Package, DollarSign, Box, Image, FolderTree, Layers, FolderPlus, Edit2, Trash2, Plus, Truck, Sparkles, Check, XCircle, Upload, Loader2, Tags, Image as ImageIcon, ChevronRight, ChevronDown } from 'lucide-react'
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
import { UnifiedAssetPicker } from '@/components/ui/UnifiedAssetPicker'
import { UnifiedAssetData } from '@/lib/unified-asset-loader'
import { CategoryIcon } from '@/components/ui/icons/LocalCategoryIcon'
import { LocalEmoji } from '@/components/ui/emojis/LocalEmoji'

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
  onSuccess?: () => void
  apiKey?: string
  appSecretKey?: string
  onCategoriesUpdate?: (categories: any[]) => void
}

type ProductCategoryNode = ProductCategory & { children?: ProductCategoryNode[] }

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

  const totalVariantInventory = useMemo(() => {
    const variants = formData.variants || []
    if (!variants.length) return 0
    return variants.reduce((sum, variant) => {
      const qty =
        typeof variant.inventoryQuantity === 'number'
          ? variant.inventoryQuantity
          : parseInt((variant.inventoryQuantity as any) || '0') || 0
      return sum + qty
    }, 0)
  }, [formData.variants])

  const [productMedia, setProductMedia] = useState<ProductMedia[]>(product.media || [])
  const [tempUploadedMedia, setTempUploadedMedia] = useState<File[]>([]) // Track temporary uploads
  const [pendingMediaDeletions, setPendingMediaDeletions] = useState<number[]>([]) // Track media IDs to delete
  const [pendingListingThumbnail, setPendingListingThumbnail] = useState<number | string | null>(null) // Track listing thumbnail change (can be temp ID)
  const [pendingDetailThumbnail, setPendingDetailThumbnail] = useState<number | string | null>(null) // Track detail thumbnail change (can be temp ID)

  const [errors, setErrors] = useState<Partial<Record<keyof UpdateProductDto, string>>>({})
  const [tagInput, setTagInput] = useState('')
  const [isBrandValid, setIsBrandValid] = useState(true)
  const [hasUnsavedVariant, setHasUnsavedVariant] = useState(false)
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null)
  const [triggerVariantShake, setTriggerVariantShake] = useState(false)

  // Category management state
  const [localCategories, setLocalCategories] = useState<ProductCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [selectedParentCategory, setSelectedParentCategory] = useState<number | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(true)
  const [editingCategory, setEditingCategory] = useState<number | null>(null)
  const [editCategoryName, setEditCategoryName] = useState('')
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [originalCategoryName, setOriginalCategoryName] = useState<string>('')
  const [creatingCategory, setCreatingCategory] = useState(false)
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
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

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

  useEffect(() => {
    if (!(formData.variants || []).length) return
    setFormData(prev => {
      if (prev.inventoryQuantity === totalVariantInventory) return prev
      return { ...prev, inventoryQuantity: totalVariantInventory }
    })
  }, [formData.variants, totalVariantInventory])

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

      // Prepare category data based on display mode
      let categoryData: any = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        parentId: selectedParentCategory || undefined,
        appId: currentAppId,
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
            await apiService.uploadCategoryImage(newCategoryId, categoryImageFile, currentAppId);
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

  const handleUpdateCategory = async (categoryId: number) => {
    if (!editingCategoryName.trim()) return
    
    // Find the original category to check if name has changed
    const originalCategory = flattenedCategories.find(cat => cat.id === categoryId)
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
      const response = await apiService.deleteCategory(categoryId, currentAppId)
      
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

  const getCategoryTree = () => {
    const categoriesWithChildren = localCategories as ProductCategoryNode[]
    const hasNestedChildren = categoriesWithChildren.some(
      cat => cat.children && cat.children.length > 0
    )
    if (hasNestedChildren) {
      return categoriesWithChildren
    }

    const tree: ProductCategoryNode[] = []
    const categoryMap = new Map<number, ProductCategoryNode>()
    
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

  const flattenedCategories = useMemo(() => {
    const result: ProductCategory[] = []
    const stack = [...getCategoryTree()]
    while (stack.length > 0) {
      const current = stack.shift()
      if (!current) continue
      const { children, ...categoryWithoutChildren } = current
      result.push(categoryWithoutChildren as ProductCategory)
      if (children && children.length > 0) {
        stack.unshift(...children)
      }
    }
    return result
  }, [localCategories])


  // Helper function to get categories with proper nesting indication for dropdown
  const getCategoriesForDropdown = () => {
    const result: Array<{ id: number; name: string; depth: number; parentId?: number }> = []
    
    const sortCategories = (items: ProductCategoryNode[]) => {
      return [...items].sort((a, b) => {
        const orderA = a.displayOrder ?? 0
        const orderB = b.displayOrder ?? 0
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name)
      })
    }

    const addCategoryWithDepth = (category: ProductCategory & { children?: ProductCategory[] }, depth: number = 0) => {
      result.push({
        id: category.id,
        name: category.name,
        depth,
        parentId: category.parentId
      })
      
      if (category.children && category.children.length > 0) {
        sortCategories(category.children as ProductCategoryNode[]).forEach(child => {
          addCategoryWithDepth(child, depth + 1)
        })
      }
    }
    
    sortCategories(getCategoryTree()).forEach(category => {
      addCategoryWithDepth(category)
    })
    
    return result
  }

  const categoryOptions = useMemo(() => getCategoriesForDropdown(), [localCategories])
  const categoryNameById = useMemo(() => {
    return new Map(flattenedCategories.map(category => [category.id, category.name]))
  }, [flattenedCategories])

  // Build grouped categories by top-level parent, keeping children together.
  // Only show children when parent is expanded.
  const groupedCategoryOptions = useMemo(() => {
    const sortByOrder = (items: ProductCategoryNode[]) => {
      return [...items].sort((a, b) => {
        const orderA = a.displayOrder ?? 0
        const orderB = b.displayOrder ?? 0
        if (orderA !== orderB) return orderA - orderB
        return a.name.localeCompare(b.name)
      })
    }

    const buildFlat = (
      nodes: ProductCategoryNode[],
      depth: number,
      acc: Array<{ node: ProductCategoryNode; depth: number }>
    ) => {
      sortByOrder(nodes).forEach(node => {
        acc.push({ node, depth })
        if (node.children && node.children.length > 0 && expandedCategories.has(node.id)) {
          buildFlat(node.children as ProductCategoryNode[], depth + 1, acc)
        }
      })
    }

    return sortByOrder(getCategoryTree()).map(parent => {
      const items: Array<{ node: ProductCategoryNode; depth: number }> = []
      buildFlat([parent], 0, items)
      return {
        parentId: parent.id,
        items
      }
    })
  }, [localCategories, expandedCategories])

  // Toggle expand/collapse for a category
  const toggleCategoryExpand = useCallback((categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  // Auto-expand categories that have selected children
  useEffect(() => {
    if (!formData.categoryIds || formData.categoryIds.length === 0 || localCategories.length === 0) {
      return
    }

    const tree = getCategoryTree()
    const categoriesToExpand = new Set<number>()

    const findParentsOfSelected = (nodes: ProductCategoryNode[]) => {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          // Check if any child or descendant is selected
          const hasSelectedDescendant = (cat: ProductCategoryNode): boolean => {
            if (formData.categoryIds?.includes(cat.id)) {
              return true
            }
            if (cat.children && cat.children.length > 0) {
              return cat.children.some(child => hasSelectedDescendant(child))
            }
            return false
          }

          if (hasSelectedDescendant(node)) {
            categoriesToExpand.add(node.id)
          }

          // Recursively check children
          findParentsOfSelected(node.children as ProductCategoryNode[])
        }
      })
    }

    findParentsOfSelected(tree)
    
    if (categoriesToExpand.size > 0) {
      setExpandedCategories(prev => {
        const newSet = new Set(prev)
        categoriesToExpand.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }, [formData.categoryIds, localCategories])

  const renderCategoryRow = (category: ProductCategoryNode, depth: number) => (
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
            <div className="ml-2 flex items-center flex-1 min-w-0">
              {/* Expand/Collapse Button for categories with children */}
              {category.children && category.children.length > 0 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCategoryExpand(category.id)
                  }}
                  className="flex-shrink-0 hover:bg-orange-50 rounded transition-colors flex items-center justify-center h-5 w-5 mr-1"
                  title={expandedCategories.has(category.id) ? 'Collapse children' : 'Expand children'}
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="h-3 w-3 text-orange-600" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-orange-600" />
                  )}
                </button>
              ) : (
                <div className="w-5 mr-1" /> // Spacer when no expand button
              )}
              <span className="flex-1 min-w-0">
                {depth > 0 && category.parentId && (
                  <span className="block text-[11px] text-gray-400 truncate">
                    {categoryNameById.get(category.parentId)}
                  </span>
                )}
                <span
                  className="block text-sm text-gray-700 truncate"
                  style={{ paddingLeft: `${depth * 10}px` }}
                >
                  {depth > 0 ? '↳ ' : ''}
                  {category.name}
                </span>
              </span>
            </div>
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
  )

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

      // Step 2: Replace temporary media with uploaded real media and create ID mapping
      let finalMedia = productMedia.filter(m => !(m as any).isTemporary) // Remove temp media
      const tempToRealIdMap = new Map<string | number, number>() // Map temp IDs to real IDs

      // Helper functions to match temp media to uploaded media by file properties
      const buildMediaStrictKey = (media: ProductMedia) =>
        `${media.originalFileName || ''}|${media.fileSize || ''}|${media.mimeType || ''}`
      const buildMediaNameKey = (media: ProductMedia) => media.originalFileName || ''

      // Get all temporary media for matching
      const tempMediaList = productMedia.filter((m: any) => m.isTemporary)

      // Add uploaded media with correct isPrimary flags from temp media
      uploadedRealMedia.forEach((realMedia, index) => {
        // Try to match by strict key first (fileName + fileSize + mimeType)
        const strictKey = buildMediaStrictKey(realMedia)
        let tempMedia = tempMediaList.find((m: any) => 
          m.isTemporary && buildMediaStrictKey(m) === strictKey
        )

        // If no strict match, try matching by filename only
        if (!tempMedia) {
          const nameKey = buildMediaNameKey(realMedia)
          if (nameKey) {
            tempMedia = tempMediaList.find((m: any) => 
              m.isTemporary && buildMediaNameKey(m) === nameKey
            )
          }
        }

        // Fallback to displayOrder if still no match
        if (!tempMedia) {
          tempMedia = tempMediaList.find((m: any) => m.isTemporary && m.displayOrder === realMedia.displayOrder)
        }

        if (tempMedia) {
          realMedia.isPrimary = tempMedia.isPrimary
          realMedia.isListingThumbnail = tempMedia.isListingThumbnail
          realMedia.isDetailThumbnail = tempMedia.isDetailThumbnail
          // Map temporary ID to real ID
          if (tempMedia.id && typeof realMedia.id === 'number') {
            tempToRealIdMap.set(tempMedia.id, realMedia.id)
          }
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
        // Step 3: Process pending media operations (deletions and thumbnail settings)
        
        // Delete pending media (only delete existing media, not newly uploaded ones)
        if (pendingMediaDeletions.length > 0) {
          logger.debug(`Deleting ${pendingMediaDeletions.length} media items...`)
          for (const mediaId of pendingMediaDeletions) {
            try {
              // Only delete if it's not a temporary ID (temporary media was never uploaded)
              if (typeof mediaId === 'number') {
                const deleteResponse = await apiService.deleteProductMedia(product.id, mediaId)
                if (!deleteResponse.ok) {
                  logger.error(`Failed to delete media ${mediaId}:`, { error: deleteResponse.data?.message || 'Unknown error' })
                }
              }
            } catch (deleteErr) {
              logger.error(`Error deleting media ${mediaId}:`, { error: deleteErr instanceof Error ? deleteErr.message : String(deleteErr) })
            }
          }
        }

        // Set listing thumbnail if pending
        if (pendingListingThumbnail !== null) {
          try {
            // Resolve the real media ID (might be a temporary ID that needs mapping)
            let realMediaId: number | null = null
            if (typeof pendingListingThumbnail === 'number') {
              // Check if it's an existing media ID
              const existingMedia = finalMedia.find(m => m.id === pendingListingThumbnail && typeof m.id === 'number')
              if (existingMedia) {
                realMediaId = existingMedia.id as number
              }
            } else {
              // It's a temporary ID, try to map it to real ID
              realMediaId = tempToRealIdMap.get(pendingListingThumbnail) || null
              
              // If mapping failed, try to find in uploadedRealMedia by matching properties
              if (realMediaId === null) {
                const tempMedia = productMedia.find((m: any) => m.isTemporary && m.id === pendingListingThumbnail)
                if (tempMedia) {
                  // Try to find uploaded media with matching properties
                  const matchedUploaded = uploadedRealMedia.find(uploaded => {
                    const strictMatch = buildMediaStrictKey(tempMedia) === buildMediaStrictKey(uploaded)
                    const nameMatch = buildMediaNameKey(tempMedia) && buildMediaNameKey(tempMedia) === buildMediaNameKey(uploaded)
                    return strictMatch || nameMatch
                  })
                  if (matchedUploaded && typeof matchedUploaded.id === 'number') {
                    realMediaId = matchedUploaded.id
                    logger.debug(`Found listing thumbnail media by property matching: ${realMediaId}`)
                  }
                }
              } else {
                logger.debug(`Mapped listing thumbnail temp ID ${pendingListingThumbnail} to real ID ${realMediaId}`)
              }
            }

            if (realMediaId !== null) {
              const thumbnailResponse = await apiService.setProductMediaAsThumbnail(product.id, realMediaId)
              if (!thumbnailResponse.ok) {
                logger.error(`Failed to set listing thumbnail for media ${realMediaId}:`, { error: thumbnailResponse.data?.message || 'Unknown error' })
              } else {
                logger.debug(`Successfully set listing thumbnail for media ${realMediaId}`)
              }
            } else {
              logger.warn(`Could not resolve listing thumbnail ID: ${pendingListingThumbnail}`)
            }
          } catch (thumbErr) {
            logger.error(`Error setting listing thumbnail:`, { error: thumbErr instanceof Error ? thumbErr.message : String(thumbErr) })
          }
        }

        // Set detail thumbnail if pending
        if (pendingDetailThumbnail !== null) {
          try {
            // Resolve the real media ID (might be a temporary ID that needs mapping)
            let realMediaId: number | null = null
            if (typeof pendingDetailThumbnail === 'number') {
              // Check if it's an existing media ID
              const existingMedia = finalMedia.find(m => m.id === pendingDetailThumbnail && typeof m.id === 'number')
              if (existingMedia) {
                realMediaId = existingMedia.id as number
              }
            } else {
              // It's a temporary ID, try to map it to real ID
              realMediaId = tempToRealIdMap.get(pendingDetailThumbnail) || null
              
              // If mapping failed, try to find in uploadedRealMedia by matching properties
              if (realMediaId === null) {
                const tempMedia = productMedia.find((m: any) => m.isTemporary && m.id === pendingDetailThumbnail)
                if (tempMedia) {
                  // Try to find uploaded media with matching properties
                  const matchedUploaded = uploadedRealMedia.find(uploaded => {
                    const strictMatch = buildMediaStrictKey(tempMedia) === buildMediaStrictKey(uploaded)
                    const nameMatch = buildMediaNameKey(tempMedia) && buildMediaNameKey(tempMedia) === buildMediaNameKey(uploaded)
                    return strictMatch || nameMatch
                  })
                  if (matchedUploaded && typeof matchedUploaded.id === 'number') {
                    realMediaId = matchedUploaded.id
                    logger.debug(`Found detail thumbnail media by property matching: ${realMediaId}`)
                  }
                }
              } else {
                logger.debug(`Mapped detail thumbnail temp ID ${pendingDetailThumbnail} to real ID ${realMediaId}`)
              }
            }

            if (realMediaId !== null) {
              const thumbnailResponse = await apiService.setProductMediaAsDetailThumbnail(product.id, realMediaId)
              if (!thumbnailResponse.ok) {
                logger.error(`Failed to set detail thumbnail for media ${realMediaId}:`, { error: thumbnailResponse.data?.message || 'Unknown error' })
              } else {
                logger.debug(`Successfully set detail thumbnail for media ${realMediaId}`)
              }
            } else {
              logger.warn(`Could not resolve detail thumbnail ID: ${pendingDetailThumbnail}`)
            }
          } catch (thumbErr) {
            logger.error(`Error setting detail thumbnail:`, { error: thumbErr instanceof Error ? thumbErr.message : String(thumbErr) })
          }
        }

        // Clear pending operations
        setPendingMediaDeletions([])
        setPendingListingThumbnail(null)
        setPendingDetailThumbnail(null)

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
    
    // Clear pending media operations
    setPendingMediaDeletions([])
    setPendingListingThumbnail(null)
    setPendingDetailThumbnail(null)

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
    // Prioritize product.appId since we're editing an existing product
    if (product.appId) {
      return product.appId
    }
    
    // Fallback to URL extraction
    const pathSegments = window.location.pathname.split('/')
    const merchantPanelIndex = pathSegments.indexOf('merchant-panel')
    if (merchantPanelIndex !== -1 && pathSegments[merchantPanelIndex + 1]) {
      const appIdFromUrl = parseInt(pathSegments[merchantPanelIndex + 1])
      if (!isNaN(appIdFromUrl) && appIdFromUrl > 0) {
        return appIdFromUrl
      }
    }
    
    // If we still don't have a valid appId, log an error
    logger.error('EditProductModal: No valid appId found', { 
      productAppId: product.appId, 
      url: window.location.pathname 
    })
    return 0
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

  const { createCategory: createCategoryFromHook, updateCategory: updateCategoryFromHook, refetch: refetchCategories, categories: categoriesFromHook } = useCategories({
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    maxLength={255}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Options
                  </label>
                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => handleInputChange('featured', e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                        disabled={loading}
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
                        disabled={loading}
                      />
                      <span className="ml-1.5 text-sm text-gray-700">Digital Product</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isNew || false}
                        onChange={(e) => handleInputChange('isNew', e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="ml-1.5 text-sm text-gray-700">New Product</span>
                    </label>
                  </div>
                </div>
              </div>


                   <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    maxLength={30}
                    className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter tag name"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim() || loading}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
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
                      value={(formData.variants || []).length ? totalVariantInventory : formData.inventoryQuantity}
                      onChange={(e) => handleInputChange('inventoryQuantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                      min="0"
                      disabled={loading || (formData.variants || []).length > 0}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {(formData.variants || []).length
                        ? 'Total stock from all variants'
                        : 'Current inventory stock level'}
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
            <div className="space-y-3">
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
                }}
                onDelete={async (mediaId) => {
                  // If it's a temporary media (not yet uploaded), just remove from state
                  const mediaToDelete = productMedia.find(m => m.id === mediaId)
                  if (mediaToDelete && (mediaToDelete as any).isTemporary) {
                    // Remove temporary media
                    setProductMedia(prev => {
                      const mediaItem = prev.find(m => m.id === mediaId)
                      if (mediaItem?.isTemporary && mediaItem.url.startsWith('blob:')) {
                        URL.revokeObjectURL(mediaItem.url)
                      }
                      
                      // Find the index of the temporary media to remove corresponding file
                      const tempMediaIndex = prev.findIndex(m => m.id === mediaId && (m as any).isTemporary)
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
                  
                  // For existing media, track for deletion on submit
                  if (typeof mediaId === 'number') {
                    setPendingMediaDeletions(prev => [...prev, mediaId])
                    // Clear pending thumbnails if this media was set as thumbnail
                    setPendingListingThumbnail(prev => prev === mediaId ? null : prev)
                    setPendingDetailThumbnail(prev => prev === mediaId ? null : prev)
                    // Remove from local state immediately for UI feedback
                    setProductMedia(prev => prev.filter(m => m.id !== mediaId))
                    return true
                  }
                  
                  // Handle temporary media ID (string) - also clear pending thumbnails
                  if (typeof mediaId === 'string') {
                    setPendingListingThumbnail(prev => prev === mediaId ? null : prev)
                    setPendingDetailThumbnail(prev => prev === mediaId ? null : prev)
                  }
                  
                  return false
                }}
                onSetPrimary={async (mediaId) => {
                  // Just update state - API call will happen on submit
                  // Accept both number (existing media) and string (temporary media) IDs
                  setPendingListingThumbnail(mediaId as any)
                  setPendingDetailThumbnail(mediaId as any)
                  // Update local state for UI feedback
                  setProductMedia(prev => prev.map(m => ({
                    ...m,
                    isPrimary: m.id === mediaId,
                    isListingThumbnail: m.id === mediaId,
                    isDetailThumbnail: m.id === mediaId
                  })))
                  return true
                }}
                onSetListingThumbnail={async (mediaId) => {
                  // Just update state - API call will happen on submit
                  // Accept both number (existing media) and string (temporary media) IDs
                  setPendingListingThumbnail(mediaId as any)
                  // Update local state for UI feedback
                  setProductMedia(prev => prev.map(m => ({
                    ...m,
                    isListingThumbnail: m.id === mediaId
                  })))
                  return true
                }}
                onSetDetailThumbnail={async (mediaId) => {
                  // Just update state - API call will happen on submit
                  // Accept both number (existing media) and string (temporary media) IDs
                  setPendingDetailThumbnail(mediaId as any)
                  // Update local state for UI feedback
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
                      const category = flattenedCategories.find(c => c.id === categoryId);
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

              {/* Add Category Card - Commented out for later use */}
              {false && (
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
                                  src={categoryImagePreview || undefined}
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
                                  <span>{((categoryImageFile?.size ?? 0) / 1024).toFixed(1)} KB</span>
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
              )}


              {/* Available Categories List */}
              <div ref={availableCategoriesRef} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700">Available Categories</h3>
                </div>
                <div className="p-3 bg-white">
                  {categoryOptions.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No categories available. Create one above.</p>
                  ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-3 [column-fill:_balance]">
                      {groupedCategoryOptions.map(group => (
                        <div key={group.parentId} className="mb-2 break-inside-avoid space-y-1">
                          {group.items.map(({ node, depth }) => (
                            <div
                              key={node.id}
                              style={{ marginLeft: depth * 12 }}
                            >
                              {renderCategoryRow(node, depth)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

