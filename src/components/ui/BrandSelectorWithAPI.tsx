'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import BrandSelector from './BrandSelector'
import { Brand } from '@/types/brand.types'

interface BrandSelectorWithAPIProps {
  value: string | number
  onChange: (brandId: number | null, brandName: string) => void
  apiKey: string
  appSecretKey: string
  appId: number
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: string
  onValidationChange?: (isValid: boolean) => void
}

export default function BrandSelectorWithAPI({
  value,
  onChange,
  apiKey,
  appSecretKey,
  appId,
  placeholder,
  disabled,
  className,
  error,
  onValidationChange
}: BrandSelectorWithAPIProps) {
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrandName, setSelectedBrandName] = useState('')

  // Convert value (brandId or brandName) to brand name for display
  useEffect(() => {
    const fetchInitialBrand = async () => {
      if (typeof value === 'number' && value > 0) {
        // It's a brandId, fetch the brand name
        try {
          const response = await fetch(`/api/proxy/v1/merchant/brands/${value}`, {
            headers: {
              'x-api-key': apiKey,
              'x-app-secret': appSecretKey,
            },
          })
          if (response.ok) {
            const brand = await response.json()
            setSelectedBrandName(brand.name)
          }
        } catch (error) {
          logger.error('Failed to fetch brand:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
        }
      } else if (typeof value === 'string' && value) {
        setSelectedBrandName(value)
      }
    }

    fetchInitialBrand()
  }, [value, apiKey, appSecretKey])

  const fetchBrands = async (search?: string): Promise<string[]> => {
    try {
      const queryParams = new URLSearchParams()
      if (search) queryParams.append('search', search)
      queryParams.append('limit', '50')

      const response = await fetch(`/api/proxy/v1/merchant/brands?${queryParams}`, {
        headers: {
          'x-api-key': apiKey,
          'x-app-secret': appSecretKey,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBrands(data.data || [])
        return (data.data || []).map((b: Brand) => b.name)
      }
      return []
    } catch (error) {
      logger.error('Failed to fetch brands:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      return []
    }
  }

  const createBrand = async (brandName: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/proxy/v1/merchant/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'x-app-secret': appSecretKey,
        },
        body: JSON.stringify({
          appId,
          name: brandName,
          isActive: true,
        }),
      })

      if (response.ok) {
        const newBrand = await response.json()
        // Add to local brands list
        setBrands(prev => [...prev, newBrand])
        // Set the brand
        onChange(newBrand.id, newBrand.name)
        setSelectedBrandName(newBrand.name)
        return true
      }
      return false
    } catch (error) {
      logger.error('Failed to create brand:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      return false
    }
  }

  const handleBrandChange = (brandName: string) => {
    // Find the brand ID from the brands list
    const brand = brands.find(b => b.name === brandName)
    if (brand) {
      onChange(brand.id, brand.name)
    } else {
      // If brand doesn't exist in our list, it might be newly created
      onChange(null, brandName)
    }
    setSelectedBrandName(brandName)
  }

  return (
    <BrandSelector
      value={selectedBrandName}
      onChange={handleBrandChange}
      onFetchBrands={fetchBrands}
      onCreateBrand={createBrand}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      error={error}
      onValidationChange={onValidationChange}
      requireExplicitCreation={true}
    />
  )
}