'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, Plus, Check } from 'lucide-react'

interface BrandSelectorProps {
  value: string
  onChange: (value: string) => void
  onFetchBrands: (search?: string) => Promise<string[]>
  onCreateBrand?: (brandName: string) => Promise<boolean>
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
  onValidationChange?: (isValid: boolean) => void
  requireExplicitCreation?: boolean
}

export default function BrandSelector({
  value,
  onChange,
  onFetchBrands,
  onCreateBrand,
  placeholder = 'Enter or select brand',
  disabled = false,
  className = '',
  error,
  onValidationChange,
  requireExplicitCreation = false
}: BrandSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value || '')
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [explicitlyCreatedBrands, setExplicitlyCreatedBrands] = useState<Set<string>>(new Set())

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<(HTMLDivElement | null)[]>([])

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchBrands = useCallback(async (search?: string) => {
    setLoading(true)
    try {
      const result = await onFetchBrands(search)
      const fetchedBrands = result || []
      
      // Merge fetched brands with explicitly created brands
      setBrands(prev => {
        const explicitlyCreated = Array.from(explicitlyCreatedBrands)
        const combined = [...fetchedBrands]
        
        // Add explicitly created brands that aren't already in fetched results
        explicitlyCreated.forEach(brand => {
          if (!fetchedBrands.some(b => b.toLowerCase() === brand.toLowerCase())) {
            combined.unshift(brand) // Add at the beginning
          }
        })
        
        return combined.sort()
      })
    } catch (error) {
      logger.error('Failed to fetch brands:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      // Keep explicitly created brands even if fetch fails
      setBrands(prev => Array.from(explicitlyCreatedBrands).sort())
    } finally {
      setLoading(false)
    }
  }, [onFetchBrands, explicitlyCreatedBrands])

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

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

  // Validation logic
  const isBrandValid = useCallback((brandName: string) => {
    if (!brandName.trim()) return true // Empty is valid (optional field)
    if (!requireExplicitCreation) return true // If not requiring explicit creation, any value is valid
    
    const trimmedBrand = brandName.trim()
    // Valid if it exists in the fetched brands or was explicitly created
    return brands.some(b => b.toLowerCase() === trimmedBrand.toLowerCase()) || 
           explicitlyCreatedBrands.has(trimmedBrand)
  }, [brands, explicitlyCreatedBrands, requireExplicitCreation])

  // Notify parent component about validation status
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isBrandValid(value))
    }
  }, [value, isBrandValid, onValidationChange])


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setHighlightedIndex(-1)
    
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
    if (brands.length === 0) {
      fetchBrands()
    }
  }

  const handleBlur = useCallback(() => {
    // Small delay to allow for option selection
    setTimeout(() => {
      setIsOpen(false)
      // Update the actual value when focusing out
      const trimmedInput = inputValue.trim()
      if (trimmedInput && trimmedInput !== value) {
        logger.debug('Updating brand on blur:', { value: trimmedInput })
        onChange(trimmedInput)
        
        // Only auto-add to local brands list if not requiring explicit creation
        if (!requireExplicitCreation && !brands.some(b => b.toLowerCase() === trimmedInput.toLowerCase())) {
          setBrands(prev => [trimmedInput, ...prev].sort())
        }
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

  const selectBrand = async (brand: string, isExplicitCreation = false) => {
    const trimmedBrand = brand.trim()
    logger.debug('Selecting brand:', { brand: trimmedBrand, explicitCreation: isExplicitCreation })
    
    // Mark as explicitly created if this was a creation action
    if (isExplicitCreation && trimmedBrand) {
      // Call onCreateBrand if provided
      if (onCreateBrand) {
        try {
          setLoading(true)
          const success = await onCreateBrand(trimmedBrand)
          if (success) {
            logger.debug('Brand created successfully via API:', { value: trimmedBrand })
            // Refresh brands list to get the newly created brand from server
            await fetchBrands()
          } else {
            logger.error('Failed to create brand via API:', { value: trimmedBrand })
          }
        } catch (error) {
          logger.error('Error creating brand via API:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
        } finally {
          setLoading(false)
        }
      }
      
      setExplicitlyCreatedBrands(prev => {
        const newSet = new Set([...Array.from(prev), trimmedBrand])
        logger.debug('Added to explicitly created brands:', { brand: trimmedBrand, total: newSet.size })
        
        // Immediately add to brands list for immediate feedback
        setBrands(current => {
          const updated = current.some(b => b.toLowerCase() === trimmedBrand.toLowerCase()) 
            ? current 
            : [trimmedBrand, ...current].sort()
          logger.debug('Updated brands list:', { value: updated })
          return updated
        })
        
        return newSet
      })
      
      // Show success feedback by briefly reopening dropdown after a short delay
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          // Small delay to show the created brand in dropdown
          setTimeout(() => {
            setIsOpen(true)
            logger.debug('Reopening dropdown to show created brand')
          }, 100)
        }
      }, 200)
    } else if (trimmedBrand && !brands.some(b => b.toLowerCase() === trimmedBrand.toLowerCase())) {
      // Add existing brand to local list if not already there
      setBrands(prev => [trimmedBrand, ...prev].sort())
    }
    
    setInputValue(trimmedBrand)
    onChange(trimmedBrand)
    setIsOpen(false)
    setHighlightedIndex(-1)
    
    if (!isExplicitCreation) {
      inputRef.current?.focus()
    }
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
          logger.debug('Creating brand via keyboard:', { value: inputValue.trim() })
          selectBrand(inputValue.trim(), true)
        } else if (inputValue.trim() && shouldShowCreateOption()) {
          // If no option is highlighted but there's input, create the brand
          logger.debug('Creating brand from input:', { value: inputValue.trim() })
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
        brand.toLowerCase().includes(searchLower)
      )
      .slice(0, 10) // Limit to 10 results for performance
  }

  const shouldShowCreateOption = () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput) return false
    
    // Don't show create option if exact match exists
    const exactMatch = brands.some(brand => 
      brand.toLowerCase() === trimmedInput.toLowerCase()
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
            w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error || (requireExplicitCreation && value && !isBrandValid(value)) ? 'border-red-300' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
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
      
      {requireExplicitCreation && value && !isBrandValid(value) && !error && (
        <p className="mt-1 text-sm text-red-600">
          Brand must be selected from dropdown or created using the "+ Create" option
        </p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
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
                      key={brand}
                      ref={(el) => { optionsRef.current[index] = el }}
                      onClick={() => selectBrand(brand)}
                      className={`
                        px-3 py-2 text-sm cursor-pointer flex items-center justify-between
                        ${highlightedIndex === index 
                          ? 'bg-orange-50 text-slate-900' 
                          : 'hover:bg-gray-50 text-gray-900'
                        }
                      `}
                    >
                      <span>{brand}</span>
                      {value === brand && (
                        <Check className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                  ))}
                  
                  {shouldShowCreateOption() && (
                    <div
                      ref={(el) => { optionsRef.current[filteredBrands.length] = el }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        logger.debug('Creating brand:', { value: inputValue.trim() })
                        selectBrand(inputValue.trim(), true)
                      }}
                      className={`
                        px-3 py-2 text-sm cursor-pointer flex items-center border-t border-gray-100
                        ${highlightedIndex === filteredBrands.length
                          ? 'bg-orange-50 text-slate-900'
                          : 'hover:bg-gray-50 text-gray-900'
                        }
                      `}
                    >
                      <Plus className="w-4 h-4 mr-2 text-gray-400" />
                      <span>Create "{inputValue.trim()}"</span>
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