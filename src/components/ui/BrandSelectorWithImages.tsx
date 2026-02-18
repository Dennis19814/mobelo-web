'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { ChevronDown, Plus, Check, Building2 } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Brand {
  id: number
  name: string
  slug: string
  description?: string
  imageUrl?: string
  logoUrl?: string
  website?: string
  isActive: boolean
  displayOrder: number
}

interface BrandSelectorWithImagesProps {
  value: string | number | null
  onChange: (brandId: number | null, brandName: string) => void
  onFetchBrands?: (search?: string) => Promise<{ data: Brand[], total: number } | Brand[]>
  onCreateBrand?: (brandName: string) => Promise<{ success: boolean; brandId?: number }>
  apiKey?: string
  appSecretKey?: string
  appId?: number
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
  onValidationChange?: (isValid: boolean) => void
  requireExplicitCreation?: boolean
}

export default function BrandSelectorWithImages({
  value,
  onChange,
  onFetchBrands,
  onCreateBrand,
  apiKey,
  appSecretKey,
  appId,
  placeholder = 'Enter or select brand',
  disabled = false,
  className = '',
  error,
  onValidationChange,
  requireExplicitCreation = false
}: BrandSelectorWithImagesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [explicitlyCreatedBrands, setExplicitlyCreatedBrands] = useState<Set<string>>(new Set())

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<(HTMLDivElement | null)[]>([])
  const lastSyncedValueRef = useRef<string | number | null>(null)

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchBrands = useCallback(async (search?: string) => {
    setLoading(true)
    try {
      let result

      // If onFetchBrands is provided, use it
      if (onFetchBrands) {
        result = await onFetchBrands(search)
      } else if (apiKey && appSecretKey) {
        // Otherwise, fetch directly from API
        const headers: any = {}
        headers['x-api-key'] = apiKey
        headers['x-app-secret'] = appSecretKey

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        params.append('limit', '50')
        if (appId) params.append('appId', appId.toString())

        const queryString = params.toString()
        const endpoint = queryString ? `/v1/merchant/brands?${queryString}` : '/v1/merchant/brands?limit=50'

        const response = await fetch(`/api/proxy${endpoint}`, {
          headers
        })

        if (response.ok) {
          const data = await response.json()
          result = data
        } else {
          logger.error('Failed to fetch brands', { error: response.statusText })
          result = { data: [], total: 0 }
        }
      } else {
        logger.warn('No fetch method available for brands')
        result = { data: [], total: 0 }
      }

      // Handle both response formats (with or without pagination)
      let fetchedBrands: Brand[] = []
      if (Array.isArray(result)) {
        // Simple array response (for backward compatibility)
        fetchedBrands = result
      } else if (result && 'data' in result && Array.isArray(result.data)) {
        // Paginated response from brands API
        fetchedBrands = result.data
      }

      // Merge fetched brands with explicitly created brands
      setBrands(prev => {
        const explicitlyCreated = Array.from(explicitlyCreatedBrands)
        const combined = [...fetchedBrands]

        // Add explicitly created brands that aren't already in fetched results
        explicitlyCreated.forEach(brandName => {
          if (!fetchedBrands.some(b => b.name.toLowerCase() === brandName.toLowerCase())) {
            // Create a temporary brand object for newly created brands
            combined.unshift({
              id: -1,
              name: brandName,
              slug: brandName.toLowerCase().replace(/\s+/g, '-'),
              isActive: true,
              displayOrder: 0
            } as Brand)
          }
        })

        return combined.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
      })
    } catch (error) {
      console.error('Failed to fetch brands:', error)
      // Keep explicitly created brands even if fetch fails
      setBrands(prev => {
        return Array.from(explicitlyCreatedBrands).map(brandName => ({
          id: -1,
          name: brandName,
          slug: brandName.toLowerCase().replace(/\s+/g, '-'),
          isActive: true,
          displayOrder: 0
        } as Brand)).sort((a, b) => a.name.localeCompare(b.name))
      })
    } finally {
      setLoading(false)
    }
  }, [onFetchBrands, explicitlyCreatedBrands, apiKey, appSecretKey, appId])

  // Initial load of brands
  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  // Debounced search when input changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      if (searchTerm !== inputValue && isOpen) {
        setSearchTerm(inputValue)
        fetchBrands(inputValue)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue, isOpen, fetchBrands, searchTerm])

  // Sync displayed value from prop only when the prop actually changes (e.g. new product loaded), not when user is typing/erasing
  useEffect(() => {
    const propDisplayValue =
      typeof value === 'string'
        ? (value ?? '')
        : typeof value === 'number'
          ? (brands.find(b => b.id === value)?.name ?? '')
          : ''
    if (lastSyncedValueRef.current === value) return
    lastSyncedValueRef.current = value
    setInputValue(propDisplayValue)
  }, [value, brands])

  // Validation logic
  const isBrandValid = useCallback((brandName: string) => {
    if (!brandName.trim()) return true // Empty is valid (optional field)
    if (!requireExplicitCreation) return true // If not requiring explicit creation, any value is valid

    const trimmedBrand = brandName.trim()
    // Valid if it exists in the fetched brands or was explicitly created
    return brands.some(b => b.name.toLowerCase() === trimmedBrand.toLowerCase()) ||
           explicitlyCreatedBrands.has(trimmedBrand)
  }, [brands, explicitlyCreatedBrands, requireExplicitCreation])

  // Notify parent component about validation status
  useEffect(() => {
    if (onValidationChange) {
      const valueStr = typeof value === 'string' ? value : (value?.toString() || '')
      onValidationChange(isBrandValid(valueStr))
    }
  }, [value, isBrandValid, onValidationChange])


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setHighlightedIndex(-1)
    lastSyncedValueRef.current = newValue
    onChange(null, newValue)

    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleInputFocus = () => {
    // Fetch brands if needed
    if (brands.length === 0) {
      fetchBrands()
    }
    // Always open dropdown when input is focused
    setIsOpen(true)
  }

  const handleBlur = useCallback(() => {
    // Small delay to allow for option selection
    setTimeout(() => {
      setIsOpen(false)
      const trimmedInput = inputValue.trim()
      const currentValueStr = typeof value === 'string' ? value : (typeof value === 'number' ? brands.find(b => b.id === value)?.name : '') ?? ''
      if (trimmedInput !== currentValueStr) {
        onChange(null, trimmedInput)
      }
      if (trimmedInput && !requireExplicitCreation && !brands.some(b => b.name.toLowerCase() === trimmedInput.toLowerCase())) {
        setBrands(prev => [{
          id: -1,
          name: trimmedInput,
          slug: trimmedInput.toLowerCase().replace(/\s+/g, '-'),
          isActive: true,
          displayOrder: 999
        } as Brand, ...prev].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)))
      }
    }, 150)
  }, [inputValue, value, onChange, brands, requireExplicitCreation])

  // Handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        handleBlur()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, handleBlur])

  const selectBrand = async (brand: Brand | string, isExplicitCreation = false) => {
    const brandName = typeof brand === 'string' ? brand : brand.name
    const brandId = typeof brand === 'string' ? null : brand.id
    const trimmedBrand = brandName.trim()
    console.log('Selecting brand:', trimmedBrand, 'ID:', brandId, 'Explicit creation:', isExplicitCreation)

    // Set the input value immediately when a brand is selected
    setInputValue(trimmedBrand)

    // Mark as explicitly created if this was a creation action
    if (isExplicitCreation && trimmedBrand) {
      // OPTIMISTIC UPDATE: Add to state IMMEDIATELY for instant feedback
      setExplicitlyCreatedBrands(prev => {
        const newSet = new Set([...Array.from(prev), trimmedBrand])
        console.log('Added to explicitly created brands:', trimmedBrand, 'Total:', newSet.size)

        // Immediately add to brands list for immediate feedback
        setBrands(current => {
          const existingBrand = current.find(b => b.name.toLowerCase() === trimmedBrand.toLowerCase())
          if (existingBrand) {
            return current
          }

          const newBrand: Brand = {
            id: -1,
            name: trimmedBrand,
            slug: trimmedBrand.toLowerCase().replace(/\s+/g, '-'),
            isActive: true,
            displayOrder: 999
          }

          const updated = [newBrand, ...current].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
          console.log('Updated brands list:', updated)
          return updated
        })

        return newSet
      })

      // Close dropdown and update parent INSTANTLY (no blocking)
      onChange(brandId, trimmedBrand)
      setIsOpen(false)
      setHighlightedIndex(-1)

      // Call API in background (non-blocking) - removed await
      if (onCreateBrand) {
        onCreateBrand(trimmedBrand)
          .then(result => {
            if (result.success && result.brandId) {
              console.log('Brand created successfully via API:', trimmedBrand, 'ID:', result.brandId)
              // Update the brand in state with the real ID
              setBrands(current =>
                current.map(b =>
                  b.name.toLowerCase() === trimmedBrand.toLowerCase() && b.id === -1
                    ? { ...b, id: result.brandId! }
                    : b
                )
              )
              // Call onChange again with the real brand ID
              onChange(result.brandId, trimmedBrand)
            } else {
              console.error('Failed to create brand via API:', trimmedBrand)
              // Brand stays in dropdown, user can continue
            }
          })
          .catch(error => {
            console.error('Error creating brand via API:', error)
            // Brand stays in dropdown, user can continue
          })
      }

      // Exit early - already handled UI updates above
      return
    } else if (trimmedBrand && !brands.some(b => b.name.toLowerCase() === trimmedBrand.toLowerCase())) {
      // Add existing brand to local list if not already there
      setBrands(prev => [{
        id: -1,
        name: trimmedBrand,
        slug: trimmedBrand.toLowerCase().replace(/\s+/g, '-'),
        isActive: true,
        displayOrder: 999
      } as Brand, ...prev].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)))
    }

    onChange(brandId, trimmedBrand)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        return
      }
      return
    }

    const filteredBrands = getFilteredBrands()
    const optionsCount = filteredBrands.length + (shouldShowCreateOption() ? 1 : 0)

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < optionsCount - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : optionsCount - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredBrands.length) {
          selectBrand(filteredBrands[highlightedIndex])
        } else if (shouldShowCreateOption() && highlightedIndex === filteredBrands.length) {
          // Create new brand
          console.log('Creating brand via keyboard:', inputValue.trim())
          selectBrand(inputValue.trim(), true)
        } else if (inputValue.trim() && shouldShowCreateOption()) {
          // If no option is highlighted but there's input, create the brand
          console.log('Creating brand from input:', inputValue.trim())
          selectBrand(inputValue.trim(), true)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setHighlightedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const getFilteredBrands = () => {
    if (!inputValue.trim()) {
      return brands.slice(0, 20) // Show first 20 brands when no search
    }

    const searchLower = inputValue.toLowerCase().trim()
    return brands
      .filter(brand =>
        brand.name.toLowerCase().includes(searchLower)
      )
      .slice(0, 10) // Limit to 10 results for performance
  }

  const shouldShowCreateOption = () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput) return false

    // Don't show create option if exact match exists
    const exactMatch = brands.some(brand =>
      brand.name.toLowerCase() === trimmedInput.toLowerCase()
    )

    return !exactMatch
  }

  const filteredBrands = getFilteredBrands()

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [highlightedIndex])

  const BrandImage = ({ brand }: { brand: Brand }) => {
    const [imageError, setImageError] = useState(false)

    if (!brand.logoUrl || imageError) {
      // Placeholder icon for brands without logo
      return (
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-indigo-500" />
        </div>
      )
    }

    return (
      <div className="relative w-10 h-10 rounded-lg border border-gray-200 bg-white p-1 flex-shrink-0">
        <Image
          src={brand.logoUrl}
          alt={brand.name}
          fill
          className="object-contain"
          onError={() => setImageError(true)}
          unoptimized={true}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200
            ${error || (requireExplicitCreation && value && !isBrandValid(typeof value === 'string' ? value : value?.toString() || '')) ? 'border-red-300' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
            ${className}
          `}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              setIsOpen(false)
            } else {
              setIsOpen(true)
              inputRef.current?.focus()
            }
          }}
          disabled={disabled}
          className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {requireExplicitCreation && value && !isBrandValid(typeof value === 'string' ? value : value?.toString() || '') && !error && (
        <p className="mt-1 text-sm text-red-600">
          Brand must be selected from dropdown or created using the "+ Create" option
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2" />
              Loading brands...
            </div>
          ) : (
            <>
              {filteredBrands.length === 0 && !shouldShowCreateOption() ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {inputValue.trim() ? 'No brands found' : 'No brands available'}
                </div>
              ) : (
                <>
                  {filteredBrands.map((brand, index) => (
                    <div
                      key={brand.id}
                      ref={(el) => { optionsRef.current[index] = el }}
                      onClick={() => selectBrand(brand)}
                      className={`
                        px-3 py-3 text-sm cursor-pointer flex items-center justify-between gap-3 transition-all duration-150 border-b border-gray-50 last:border-b-0
                        ${highlightedIndex === index
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-slate-900'
                          : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <BrandImage brand={brand} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{brand.name}</div>
                          {brand.description && (
                            <div className="text-xs text-gray-500 truncate">{brand.description}</div>
                          )}
                        </div>
                      </div>
                      {value === brand.name && (
                        <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      )}
                    </div>
                  ))}

                  {shouldShowCreateOption() && (
                    <div
                      ref={(el) => { optionsRef.current[filteredBrands.length] = el }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Creating brand:', inputValue.trim())
                        selectBrand(inputValue.trim(), true)
                      }}
                      className={`
                        px-3 py-3 text-sm cursor-pointer flex items-center border-t-2 border-gray-100 transition-all duration-150
                        ${highlightedIndex === filteredBrands.length
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-900'
                          : 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 text-gray-900'
                        }
                      `}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 flex items-center justify-center flex-shrink-0 mr-3">
                        <Plus className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">Create new brand</div>
                        <div className="text-xs text-gray-500">"{inputValue.trim()}"</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}