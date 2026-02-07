'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { useActiveLocations } from '@/hooks/useLocations'
import type { Location } from '@/types/purchase-order.types'

interface LocationSelectorProps {
  value: number | null
  onChange: (locationId: number | null) => void
  placeholder?: string
  className?: string
}

export default function LocationSelector({
  value,
  onChange,
  placeholder = 'Select destination',
  className = '',
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<(HTMLDivElement | null)[]>([])

  const { data: locationsData, isLoading } = useActiveLocations()

  const locations = locationsData?.data || []
  const selectedLocation = locations.find((l: Location) => l.id === value)

  // Handle outside clicks
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    // Use setTimeout to ensure the click event that opened the dropdown doesn't immediately close it
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < locations.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < locations.length) {
            handleSelect(locations[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, highlightedIndex, locations])

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [highlightedIndex])

  const handleSelect = (location: Location) => {
    onChange(location.id)
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div
        className="relative cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
          inputRef.current?.focus()
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={selectedLocation?.name || ''}
          readOnly
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          placeholder={placeholder}
          className="w-full px-2.5 py-1.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
        />
        <ChevronDown
          className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 text-center">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
            </div>
          )}

          {/* Options List */}
          {!isLoading && (
            <>
              {locations.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No locations found
                </div>
              ) : (
                <div className="py-1">
                  {locations.map((location: Location, index: number) => (
                    <div
                      key={location.id}
                      ref={(el) => {
                        optionsRef.current[index] = el
                      }}
                      onClick={() => handleSelect(location)}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                        index === highlightedIndex ? 'bg-gray-50' : ''
                      } ${value === location.id ? 'bg-orange-50' : ''}`}
                    >
                      <div className="font-medium text-gray-900">{location.name}</div>
                      {location.address && (
                        <div className="text-xs text-gray-500">{location.address}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
