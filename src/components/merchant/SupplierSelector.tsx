'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, Search, Loader2, X } from 'lucide-react'
import { useActiveSuppliers } from '@/hooks/useSuppliers'
import { useCreateSupplier } from '@/hooks/useSuppliers'
import type { Supplier, CreateSupplierDto } from '@/types/purchase-order.types'
import toast from 'react-hot-toast'

interface SupplierSelectorProps {
  value: number | null
  onChange: (supplierId: number | null) => void
  onCreateSupplier?: (supplier: Supplier) => void
  placeholder?: string
  className?: string
}

// Supplier Modal Component (extracted from SuppliersSection)
interface SupplierModalProps {
  supplier: Supplier | null
  onClose: () => void
  onSave: (data: CreateSupplierDto) => void
  isSaving: boolean
}

function SupplierModal({ supplier, onClose, onSave, isSaving }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    company: supplier?.company || '',
    contactName: supplier?.contactName || '',
    email: supplier?.email || '',
    phoneCountryCode: supplier?.phoneCountryCode || '+94',
    phoneNumber: supplier?.phoneNumber || '',
    address: supplier?.address || '',
    apartment: supplier?.apartment || '',
    city: supplier?.city || '',
    country: supplier?.country || 'Sri Lanka',
    postalCode: supplier?.postalCode || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">Create supplier</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Company Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Enter company name"
                required
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country/region
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="Sri Lanka">Sri Lanka</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="India">India</option>
                <option value="Australia">Australia</option>
                <option value="Canada">Canada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Search for an address"
                  className="w-full pl-10 pr-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apartment, suite, etc
              </label>
              <input
                type="text"
                value={formData.apartment}
                onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                placeholder="Apartment, suite, etc"
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  required
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal code
                </label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="Postal code"
                  required
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact name
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Contact name"
                required
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email address"
                required
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone number
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.phoneCountryCode}
                  onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="+94">🇱🇰 +94</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+61">🇦🇺 +61</option>
                  <option value="+1">🇨🇦 +1</option>
                </select>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="Phone number"
                  required
                  className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SupplierSelector({
  value,
  onChange,
  onCreateSupplier,
  placeholder = 'Select supplier',
  className = '',
}: SupplierSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const optionsRef = useRef<(HTMLDivElement | null)[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: suppliersData, isLoading } = useActiveSuppliers()
  const createMutation = useCreateSupplier()

  const suppliers = suppliersData?.data || []
  const selectedSupplier = suppliers.find((s: Supplier) => s.id === value)

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter((supplier: Supplier) =>
    supplier.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle outside clicks
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
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
            prev < filteredSuppliers.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && highlightedIndex < filteredSuppliers.length) {
            handleSelect(filteredSuppliers[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSearchQuery('')
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, highlightedIndex, filteredSuppliers])

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [highlightedIndex])

  const handleSelect = (supplier: Supplier) => {
    onChange(supplier.id)
    setIsOpen(false)
    setSearchQuery('')
    setHighlightedIndex(-1)
  }

  const handleCreateNew = () => {
    setShowCreateModal(true)
    setIsOpen(false)
  }

  const handleCreateSupplier = (data: CreateSupplierDto) => {
    createMutation.mutate(data, {
      onSuccess: (newSupplier) => {
        setShowCreateModal(false)
        onChange(newSupplier.id)
        onCreateSupplier?.(newSupplier)
      },
    })
  }

  return (
    <>
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
            value={isOpen ? searchQuery : selectedSupplier?.company || ''}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
              setHighlightedIndex(-1)
            }}
            onClick={(e) => {
              e.stopPropagation()
              if (!isOpen) {
                setIsOpen(true)
                if (!searchQuery && selectedSupplier) {
                  setSearchQuery('')
                }
              }
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
            {/* Search Input */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setHighlightedIndex(-1)
                  }}
                  placeholder="Search suppliers..."
                  className="w-full pl-8 pr-2.5 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="p-4 text-center">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400 mx-auto" />
              </div>
            )}

            {/* Options List */}
            {!isLoading && (
              <>
                {filteredSuppliers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No suppliers found
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredSuppliers.map((supplier: Supplier, index: number) => (
                      <div
                        key={supplier.id}
                        ref={(el) => {
                          optionsRef.current[index] = el
                        }}
                        onClick={() => handleSelect(supplier)}
                        className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                          index === highlightedIndex ? 'bg-gray-50' : ''
                        } ${value === supplier.id ? 'bg-orange-50' : ''}`}
                      >
                        <div className="font-medium text-gray-900">{supplier.company}</div>
                        {supplier.email && (
                          <div className="text-xs text-gray-500">{supplier.email}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Create New Supplier Button */}
                <div className="border-t p-2">
                  <button
                    onClick={handleCreateNew}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded font-medium"
                  >
                    Create new supplier
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Supplier Modal */}
      {showCreateModal && (
        <SupplierModal
          supplier={null}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateSupplier}
          isSaving={createMutation.isPending}
        />
      )}
    </>
  )
}
