'use client'
import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMerchantAuth } from '@/hooks'
import Image from 'next/image'
import {
  ArrowLeft, Search, Edit, Save, X, AlertCircle,
  Package, ChevronRight, ChevronDown, Loader2, Check
} from 'lucide-react'
import { apiService } from '@/lib/api-service'
import type { Product, ProductVariant } from '@/types/product.types'
import InventoryHistoryModal from '@/components/merchant/modals/InventoryHistoryModal'

interface InventoryManagementSectionProps {
  appId: number
  apiKey?: string
  appSecretKey?: string
}

interface InventoryLocation {
  id: number | null  // ProductLocationInventory record ID (null if no record exists)
  locationId: number  // Actual Location ID
  name: string
  address?: string
  unavailable?: number
  committed?: number
  available?: number
  onHand?: number
}

export default function InventoryManagementSection({ appId, apiKey, appSecretKey }: InventoryManagementSectionProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { headers } = useMerchantAuth(apiKey, appSecretKey)
  
  const productId = searchParams.get('productId') ? parseInt(searchParams.get('productId')!) : null
  
  const [product, setProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  // Dynamic filters based on variant options
  const [optionFilters, setOptionFilters] = useState<Record<string, string>>({})
  const [openFilterDropdown, setOpenFilterDropdown] = useState<string | null>(null)
  
  // Inventory state for the selected variant
  const [inventoryQuantity, setInventoryQuantity] = useState<number>(0)
  const [isEditing, setIsEditing] = useState(false)
  const [originalQuantity, setOriginalQuantity] = useState<number>(0)

  // Modal state for inventory history
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Location inventory data
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)

  // Location quantities for editing
  const [locationQuantities, setLocationQuantities] = useState<Record<number, number>>({})
  const [originalLocationQuantities, setOriginalLocationQuantities] = useState<Record<number, number>>({})

  // Fetch product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        setError('No product ID provided')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const response = await apiService.getProduct(productId)
        if (response.ok && response.data) {
          const productData = response.data
          console.log('[InventoryManagementSection] Loaded product data:', {
            productId: productData.id,
            variantsCount: productData.variants?.length || 0,
            variants: productData.variants?.map((v: ProductVariant) => ({ id: v.id }))
          })
          setProduct(productData)

          // If product has variants, select first one by default
          if (productData.variants && productData.variants.length > 0) {
            // Check if currently selected variant is still valid (exists in loaded variants)
            let variantToSelect = productData.variants[0]
            if (selectedVariant) {
              const isValidVariant = productData.variants.some((v: ProductVariant) => v.id === selectedVariant.id)
              if (isValidVariant) {
                // Keep the currently selected variant if it's still valid
                const validVariant = productData.variants.find((v: ProductVariant) => v.id === selectedVariant.id)
                if (validVariant) {
                  variantToSelect = validVariant
                  console.log('[InventoryManagementSection] Keeping current variant (still valid):', {
                    id: validVariant.id
                  })
                }
              } else {
                console.warn('[InventoryManagementSection] ⚠️ Selected variant ID', selectedVariant.id, 'is no longer valid. Resetting to first variant.')
              }
            }

            // Log the variant being selected
            console.log('[InventoryManagementSection] Selecting variant:', {
              id: variantToSelect.id
            })
            setSelectedVariant(variantToSelect)
            setInventoryQuantity(variantToSelect.inventoryQuantity || 0)
            setOriginalQuantity(variantToSelect.inventoryQuantity || 0)
          } else {
            // No variants - use product inventory quantity
            setSelectedVariant(null)
            setInventoryQuantity(productData.inventoryQuantity || 0)
            setOriginalQuantity(productData.inventoryQuantity || 0)
          }
        } else {
          const errorMsg = response.data?.message || response.data?.error || 'Failed to load product'
          logger.error('Failed to load product:', {
            productId,
            status: response.status,
            error: errorMsg,
            response: response.data
          })
          setError(`Unable to load product #${productId}. ${errorMsg}. This product may not exist or may have invalid data.`)
        }
      } catch (err) {
        logger.error('Failed to load product:', {
          productId,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        })
        setError(`Unable to load product #${productId}. This product may not exist or may have invalid data.`)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [productId])

  // Update inventory quantity when variant changes
  useEffect(() => {
    if (selectedVariant) {
      setInventoryQuantity(selectedVariant.inventoryQuantity || 0)
      setOriginalQuantity(selectedVariant.inventoryQuantity || 0)
      setIsEditing(false)
    } else if (product && (!product.variants || product.variants.length === 0)) {
      setInventoryQuantity(product.inventoryQuantity || 0)
      setOriginalQuantity(product.inventoryQuantity || 0)
      setIsEditing(false)
    }
  }, [selectedVariant, product])

  // Fetch location-based inventory when product or variant changes
  useEffect(() => {
    const loadLocationInventory = async () => {
      if (!product) {
        console.log('[InventoryManagementSection] loadLocationInventory - No product, skipping')
        return
      }

      console.log('[InventoryManagementSection] loadLocationInventory - Starting', {
        productId: product.id,
        variantId: selectedVariant?.id
      })

      setLoadingLocations(true)
      try {
        const response = await apiService.getProductInventoryByLocations({
          productId: product.id,
          variantId: selectedVariant?.id
        })

        console.log('[InventoryManagementSection] API Response:', {
          ok: response.ok,
          status: response.status,
          dataType: typeof response.data,
          isArray: Array.isArray(response.data),
          data: response.data
        })

        if (response.ok && response.data) {
          const locationsData = Array.isArray(response.data)
            ? response.data
            : response.data.data || []

          console.log('[InventoryManagementSection] Extracted locationsData:', {
            length: locationsData.length,
            data: locationsData
          })

          // Map API response to InventoryLocation interface
          const mappedLocations: InventoryLocation[] = locationsData.map((inv: any) => ({
            id: inv.id,  // ProductLocationInventory record ID
            locationId: inv.locationId,  // Actual location ID
            name: inv.location.name,
            address: [
              inv.location.address,
              inv.location.apartment,
              inv.location.city,
              inv.location.state,
              inv.location.country
            ].filter(Boolean).join(', '),
            unavailable: inv.quantityUnavailable || 0,
            committed: inv.quantityCommitted || 0,
            available: inv.quantityAvailable || 0,
            onHand: inv.quantityOnHand || 0
          }))

          console.log('[InventoryManagementSection] Mapped locations:', mappedLocations)
          setLocations(mappedLocations)

          // Initialize location quantities for editing using locationId as key
          const quantities: Record<number, number> = {}
          mappedLocations.forEach(loc => {
            quantities[loc.locationId] = loc.available || 0
            console.log(`[InventoryManagementSection] Init location ${loc.locationId} (${loc.name}): available=${loc.available}`)
          })
          console.log('[InventoryManagementSection] Initialized locationQuantities:', quantities)
          setLocationQuantities(quantities)
          setOriginalLocationQuantities(quantities)
        } else {
          console.log('[InventoryManagementSection] Response not OK or no data')
        }
      } catch (err) {
        console.error('[InventoryManagementSection] Error loading location inventory:', err)
        logger.error('Failed to load location inventory:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
      } finally {
        setLoadingLocations(false)
      }
    }

    loadLocationInventory()
  }, [product, selectedVariant])

  // Get option names dynamically from variants
  const optionNames = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return []
    
    const firstVariant = product.variants[0]
    const names: Array<{ name: string; key: string }> = []
    
    if (firstVariant.option1Name) names.push({ name: firstVariant.option1Name, key: 'option1' })
    if (firstVariant.option2Name) names.push({ name: firstVariant.option2Name, key: 'option2' })
    if (firstVariant.option3Name) names.push({ name: firstVariant.option3Name, key: 'option3' })
    
    return names
  }, [product?.variants])

  // Get unique values for each option dynamically
  const optionValues = useMemo(() => {
    if (!product?.variants) return {}
    
    const values: Record<string, Set<string>> = {}
    
    product.variants.forEach(v => {
      if (v.option1Name && v.option1Value) {
        if (!values['option1']) values['option1'] = new Set()
        values['option1'].add(v.option1Value)
      }
      if (v.option2Name && v.option2Value) {
        if (!values['option2']) values['option2'] = new Set()
        values['option2'].add(v.option2Value)
      }
      if (v.option3Name && v.option3Value) {
        if (!values['option3']) values['option3'] = new Set()
        values['option3'].add(v.option3Value)
      }
    })
    
    // Convert Sets to sorted arrays
    const result: Record<string, string[]> = {}
    Object.keys(values).forEach(key => {
      result[key] = Array.from(values[key]).sort()
    })
    
    return result
  }, [product?.variants])

  // Filter variants
  const filteredVariants = useMemo(() => {
    if (!product?.variants) return []
    
    return product.variants.filter(variant => {
      const matchesSearch = !searchTerm || 
        `${variant.option1Value || ''} ${variant.option2Value || ''} ${variant.option3Value || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Check each option filter
      const matchesFilters = optionNames.every(option => {
        const filterValue = optionFilters[option.key]
        if (!filterValue) return true // No filter set for this option
        
        if (option.key === 'option1') return variant.option1Value === filterValue
        if (option.key === 'option2') return variant.option2Value === filterValue
        if (option.key === 'option3') return variant.option3Value === filterValue
        return true
      })
      
      return matchesSearch && matchesFilters
    })
  }, [product?.variants, searchTerm, optionFilters, optionNames])

  const handleSave = async () => {
    console.log('🔧 [handleSave] UPDATED CODE VERSION - with validation')
    if (!product) return

    console.log('[handleSave] Starting save...')
    console.log('[handleSave] Product:', {
      id: product.id,
      hasVariants: !!(product.variants && product.variants.length > 0),
      variantsCount: product.variants?.length || 0,
      variantIds: product.variants?.map((v: ProductVariant) => v.id) || []
    })
    console.log('[handleSave] Selected Variant:', selectedVariant ? {
      id: selectedVariant.id
    } : 'null')
    console.log('[handleSave] locationQuantities:', locationQuantities)
    console.log('[handleSave] originalLocationQuantities:', originalLocationQuantities)
    console.log('[handleSave] locations:', locations)

    // Validate selectedVariant if product has variants
    if (product.variants && product.variants.length > 0 && selectedVariant) {
      const isValidVariant = product.variants.some((v: ProductVariant) => v.id === selectedVariant.id)
      if (!isValidVariant) {
        const errorMsg = `❌ Cannot save: Selected variant ID ${selectedVariant.id} does not exist in product variants [${product.variants.map(v => v.id).join(', ')}]. Please refresh the page.`
        console.error('[handleSave]', errorMsg)
        setError(errorMsg)
        return
      }
      console.log('✅ [handleSave] Variant validation passed')
    }

    setSaving(true)
    setError(null)

    try {
      // Update location inventories first
      console.log('[handleSave] Product details:', { productId: product.id, variantId: selectedVariant?.id })
      console.log('[handleSave] All locations:', locations)

      const locationUpdatePromises = Object.entries(locationQuantities).map(async ([locationIdStr, quantity]) => {
        const locationId = parseInt(locationIdStr)
        const originalQty = originalLocationQuantities[locationId]
        console.log(`[handleSave] Processing location ${locationId}: quantity=${quantity}, originalQty=${originalQty}`)

        // Only update if changed
        if (quantity !== originalQty) {
          console.log(`[handleSave] Updating location ${locationId} to ${quantity}`)
          console.log(`[handleSave] API call params:`, {
            productId: product.id,
            locationId: locationId,
            quantityAvailable: quantity,
            variantId: selectedVariant?.id
          })

          try {
            const result = await apiService.updateLocationInventory({
              productId: product.id,
              locationId: locationId,
              quantityAvailable: quantity,
              variantId: selectedVariant?.id
            })
            console.log(`[handleSave] ✅ Update SUCCESS for location ${locationId}:`, result)
            return result
          } catch (error) {
            console.error(`[handleSave] ❌ Update FAILED for location ${locationId}:`, error)
            throw error
          }
        } else {
          console.log(`[handleSave] ⏭️  Skipping location ${locationId} (no change)`)
        }
        return Promise.resolve({ ok: true })
      })

      const results = await Promise.all(locationUpdatePromises)
      console.log('[handleSave] All location updates completed:', results)

      // Update locations state using locationId
      const updatedLocations = locations.map(loc => ({
        ...loc,
        available: locationQuantities[loc.locationId] ?? loc.available
      }))
      console.log('[handleSave] Updated locations:', updatedLocations)

      setLocations(updatedLocations)
      setOriginalLocationQuantities(locationQuantities)

      // Update product/variant inventory if needed
      if (selectedVariant) {
        // Update variant inventory
        const updatedVariants = product.variants?.map(v =>
          v.id === selectedVariant.id
            ? { ...v, inventoryQuantity }
            : v
        ) || []

        const response = await apiService.updateProduct(product.id, {
          variants: updatedVariants.map(v => ({
            id: v.id, // CRITICAL: Include ID to prevent variant deletion/recreation
            option1Name: v.option1Name,
            option1Value: v.option1Value,
            option2Name: v.option2Name,
            option2Value: v.option2Value,
            option3Name: v.option3Name,
            option3Value: v.option3Value,
            price: v.price,
            inventoryQuantity: v.inventoryQuantity,
            sku: v.sku
          }))
        })

        if (response.ok) {
          // Update local state
          setProduct(prev => prev ? {
            ...prev,
            variants: updatedVariants
          } : null)
          setSelectedVariant(updatedVariants.find(v => v.id === selectedVariant.id) || null)
          setOriginalQuantity(inventoryQuantity)
          setIsEditing(false)
        } else {
          setError('Failed to update inventory')
        }
      } else {
        // Update product inventory (no variants)
        const response = await apiService.updateProduct(product.id, {
          inventoryQuantity
        })

        if (response.ok) {
          setProduct(prev => prev ? { ...prev, inventoryQuantity } : null)
          setOriginalQuantity(inventoryQuantity)
          setIsEditing(false)
        } else {
          setError('Failed to update inventory')
        }
      }
    } catch (err) {
      logger.error('Failed to save inventory:', { error: err instanceof Error ? err.message : String(err) })
      setError('Failed to save inventory')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setInventoryQuantity(originalQuantity)
    setLocationQuantities(originalLocationQuantities)
    setIsEditing(false)
  }

  const handleBack = () => {
    const currentPath = window.location.pathname
    const pathMatch = currentPath.match(/\/merchant-panel\/([^\/]+)/)
    if (pathMatch && pathMatch[1]) {
      const hashedAppId = pathMatch[1]
      router.push(`/merchant-panel/${hashedAppId}?section=inventory`)
    } else {
      router.back()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Not Found</h3>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mb-6">
            Please check the URL or select a different product from the inventory list.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Back to Inventory
          </button>
        </div>
      </div>
    )
  }

  if (!product) return null

  const currentInventory = selectedVariant 
    ? (selectedVariant.inventoryQuantity || 0)
    : (product.inventoryQuantity || 0)

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Inventory</span>
        </button>
        
        <div className="flex items-start gap-4">
          {/* Product Image */}
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.thumbnailUrl ? (
              <Image
                src={product.thumbnailUrl}
                alt={product.name}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <Package className="w-8 h-8 text-gray-400" />
            )}
          </div>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">{product.name}</h1>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                product.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {product.status === 'active' ? 'Active' : 'Draft'}
              </span>
              {product.variants && product.variants.length > 0 && (
                <span className="text-sm text-gray-600">
                  {product.variants.length} variants
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Variant List */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search variants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            {/* Filter Buttons and Active Filters */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                {/* Filter Dropdown Buttons */}
                <div className="flex flex-wrap gap-2">
                  {optionNames.map(option => {
                    const optionKey = option.key
                    const values = optionValues[optionKey] || []
                    
                    if (values.length === 0) return null
                    
                    const isOpen = openFilterDropdown === optionKey
                    const selectedValue = optionFilters[optionKey]
                    
                    return (
                      <div key={optionKey} className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenFilterDropdown(isOpen ? null : optionKey)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <span>{option.name}</span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {isOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setOpenFilterDropdown(null)}
                            />
                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] max-h-60 overflow-y-auto">
                              {values.map(value => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => {
                                    setOptionFilters(prev => ({
                                      ...prev,
                                      [optionKey]: prev[optionKey] === value ? '' : value
                                    }))
                                    setOpenFilterDropdown(null)
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                    selectedValue === value ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                                  }`}
                                >
                                  {value}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Active Filter Chips */}
                {(Object.keys(optionFilters).some(key => optionFilters[key])) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
                    {optionNames.map(option => {
                      const optionKey = option.key
                      const filterValue = optionFilters[optionKey]
                      
                      if (!filterValue) return null
                      
                      return (
                        <div
                          key={optionKey}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-md text-sm text-gray-700"
                        >
                          <span>{option.name} is {filterValue}</span>
                          <button
                            type="button"
                            onClick={() => setOptionFilters(prev => {
                              const updated = { ...prev }
                              delete updated[optionKey]
                              return updated
                            })}
                            className="hover:text-gray-900 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )
                    })}
                    
                    {/* Clear All Link */}
                    <button
                      type="button"
                      onClick={() => setOptionFilters({})}
                      className="text-sm text-gray-600 hover:text-gray-900  ml-auto"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Variant List */}
          <div className="flex-1 overflow-y-auto">
            {product.variants && product.variants.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredVariants.map((variant) => {
                  const variantName = [
                    variant.option1Value,
                    variant.option2Value,
                    variant.option3Value
                  ].filter(Boolean).join(' / ')
                  
                  const isSelected = selectedVariant?.id === variant.id
                  
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant)
                        // Scroll to top when variant is selected
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isSelected ? 'text-orange-900' : 'text-gray-900'
                          }`}>
                            {variantName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Stock: {variant.inventoryQuantity || 0}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-orange-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No variants. This product uses a single inventory quantity.
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Variant Details */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          {selectedVariant ? (
            <>
              {/* Variant Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {[
                        selectedVariant.option1Value,
                        selectedVariant.option2Value,
                        selectedVariant.option3Value
                      ].filter(Boolean).join(' / ')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedVariant.sku && `SKU: ${selectedVariant.sku}`}
                    </p>
                  </div>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        console.log('[Edit button clicked - Variant] Current locationQuantities:', locationQuantities)
                        console.log('[Edit button clicked - Variant] Current locations:', locations)
                        setIsEditing(true)
                      }}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {/* Variant Options - Display all options dynamically */}
                {optionNames.length > 0 && (
                  <div className={`grid gap-4 mb-6 ${optionNames.length === 1 ? 'grid-cols-1' : optionNames.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {optionNames.map(option => {
                      const optionKey = option.key
                      let optionValue = ''
                      
                      if (optionKey === 'option1') {
                        optionValue = selectedVariant.option1Value || ''
                      } else if (optionKey === 'option2') {
                        optionValue = selectedVariant.option2Value || ''
                      } else if (optionKey === 'option3') {
                        optionValue = selectedVariant.option3Value || ''
                      }
                      
                      return (
                        <div key={optionKey}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {option.name}
                          </label>
                          <input
                            type="text"
                            value={optionValue}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Inventory Section */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-gray-900">Inventory</h3>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={product.trackInventory}
                      disabled
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Inventory tracked</span>
                  </label>
                </div>

                {/* Inventory Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Unavailable</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Committed</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Available</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">On hand</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {loadingLocations ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                            Loading locations...
                          </td>
                        </tr>
                      ) : locations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                            No locations found. Please add a location first.
                          </td>
                        </tr>
                      ) : (
                        locations.map((location) => (
                          <tr key={location.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              <div className="font-medium">{location.name}</div>
                              {location.address && (
                                <div className="text-xs text-gray-500">{location.address}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{location.unavailable || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{location.committed || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={locationQuantities[location.locationId] ?? location.available}
                                  onChange={(e) => {
                                    const newValue = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                                    const validValue = isNaN(newValue) ? 0 : Math.max(0, newValue)
                                    console.log(`[Input onChange] Location ${location.locationId}: "${e.target.value}" -> ${validValue}`)
                                    setLocationQuantities(prev => {
                                      const updated = {
                                        ...prev,
                                        [location.locationId]: validValue
                                      }
                                      console.log(`[Input onChange] Updated locationQuantities:`, updated)
                                      return updated
                                    })
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              ) : (
                                <span>{location.available || 0}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{location.onHand || 0}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* View adjustment history link */}
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="mt-3 text-sm text-orange-600 hover:text-orange-700"
                >
                  View adjustment history
                </button>

                {/* Additional Info */}
                <div className="mt-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={selectedVariant.sku || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <input
                      type="text"
                      value={product.barcode || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sellWhenOutOfStock"
                      disabled
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="sellWhenOutOfStock" className="ml-2 text-sm text-gray-700">
                      Sell when out of stock
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No Variants - Product Level Inventory */
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        console.log('[Edit button clicked - No Variant] Current locationQuantities:', locationQuantities)
                        console.log('[Edit button clicked - No Variant] Current locations:', locations)
                        setIsEditing(true)
                      }}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                <label className="flex items-center mb-6">
                  <input
                    type="checkbox"
                    checked={product.trackInventory}
                    disabled
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory tracked</span>
                </label>
              </div>

              {/* Inventory Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Unavailable</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Committed</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Available</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">On hand</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingLocations ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Loading locations...
                        </td>
                      </tr>
                    ) : locations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                          No locations found. Please add a location first.
                        </td>
                      </tr>
                    ) : (
                      locations.map((location) => (
                        <tr key={location.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-medium">{location.name}</div>
                            {location.address && (
                              <div className="text-xs text-gray-500">{location.address}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{location.unavailable || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{location.committed || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={locationQuantities[location.locationId] ?? location.available}
                                onChange={(e) => {
                                  const newValue = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                                  const validValue = isNaN(newValue) ? 0 : Math.max(0, newValue)
                                  console.log(`[Input onChange - No Variant] Location ${location.locationId}: "${e.target.value}" -> ${validValue}`)
                                  setLocationQuantities(prev => {
                                    const updated = {
                                      ...prev,
                                      [location.locationId]: validValue
                                    }
                                    console.log(`[Input onChange - No Variant] Updated locationQuantities:`, updated)
                                    return updated
                                  })
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            ) : (
                              <span>{location.available || 0}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">{location.onHand || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* View adjustment history link */}
              <button
                onClick={() => setShowHistoryModal(true)}
                className="mt-3 text-sm text-orange-600 hover:text-orange-700"
              >
                View adjustment history
              </button>

              {/* Additional Info */}
              <div className="mt-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={product.sku || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={product.barcode || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sellWhenOutOfStock"
                    disabled
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="sellWhenOutOfStock" className="ml-2 text-sm text-gray-700">
                    Sell when out of stock
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Inventory History Modal */}
      {product && (
        <InventoryHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          productId={product.id}
          variantId={selectedVariant?.id}
          productName={product.name}
          variantName={selectedVariant ? [
            selectedVariant.option1Value,
            selectedVariant.option2Value,
            selectedVariant.option3Value
          ].filter(Boolean).join(' / ') : undefined}
        />
      )}
    </div>
  )
}
