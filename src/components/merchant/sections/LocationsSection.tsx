'use client'

import { useState, useCallback } from 'react'
import { MapPin, Search, Plus, Loader2, Check, X, Edit2, Trash2 } from 'lucide-react'
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation, useActivateLocation } from '@/hooks/useLocations'
import type { Location, CreateLocationDto, UpdateLocationDto } from '@/types/purchase-order.types'
import toast from 'react-hot-toast'
import { COUNTRIES, getCountryName } from '@/constants/countries'
import { getStatesForCountry, hasStates, getStateName } from '@/constants/states'

export default function LocationsSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)

  // Fetch locations
  const { data: locationsData, isLoading, error } = useLocations({
    search: searchQuery || undefined,
    status: showInactive ? undefined : 'active',
    limit: 100,
  })

  const locations = locationsData?.data || []
  const createMutation = useCreateLocation()
  const updateMutation = useUpdateLocation()
  const deleteMutation = useDeleteLocation()
  const activateMutation = useActivateLocation()

  const handleCreate = useCallback(() => {
    setEditingLocation(null)
    setIsModalOpen(true)
  }, [])

  const handleEdit = useCallback((location: Location) => {
    setEditingLocation(location)
    setIsModalOpen(true)
  }, [])

  const handleDelete = useCallback(async (location: Location) => {
    if (locations.filter((l: Location) => l.status === 'active').length <= 1) {
      toast.error('Cannot delete the last active location')
      return
    }

    const confirmed = window.confirm(
      `Delete location "${location.name}"?\n\nThis will mark it as inactive. You can reactivate it later.`
    )
    if (!confirmed) return

    deleteMutation.mutate(location.id)
  }, [locations, deleteMutation])

  const handleActivate = useCallback((location: Location) => {
    activateMutation.mutate(location.id)
  }, [activateMutation])

  const handleSetDefault = useCallback((location: Location) => {
    if (location.isDefault) return
    updateMutation.mutate({
      id: location.id,
      data: { isDefault: true },
    })
  }, [updateMutation])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl  font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              Locations
            </h1>
            <p className="text-gray-600 mt-1">Manage warehouse and store locations</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Show inactive</span>
          </label>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load locations. Please try again.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && locations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No locations found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first location'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </button>
          )}
        </div>
      )}

      {/* Locations Grid */}
      {!isLoading && !error && locations.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location: Location) => (
            <div
              key={location.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                location.status === 'inactive' ? 'opacity-60' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{location.name}</h3>
                    {location.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        <Check className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>
                  <span className={`text-xs ${
                    location.status === 'active' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {location.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(location)}
                    className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded"
                    title="Edit location"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {location.status === 'active' ? (
                    <button
                      onClick={() => handleDelete(location)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete location"
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(location)}
                      className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Activate location"
                      disabled={activateMutation.isPending}
                    >
                      {activateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>{location.address}</p>
                {location.apartment && <p>{location.apartment}</p>}
                <p>
                  {location.city}
                  {location.state && `, ${location.state}`}
                  {' '}{location.postalCode}
                </p>
                <p>{getCountryName(location.country)}</p>
              </div>

              {/* Set as Default Button */}
              {location.status === 'active' && !location.isDefault && (
                <button
                  onClick={() => handleSetDefault(location)}
                  disabled={updateMutation.isPending}
                  className="mt-3 w-full text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <LocationModal
          location={editingLocation}
          onClose={() => {
            setIsModalOpen(false)
            setEditingLocation(null)
          }}
          onSave={(data) => {
            if (editingLocation) {
              updateMutation.mutate(
                { id: editingLocation.id, data: data as UpdateLocationDto },
                {
                  onSuccess: () => {
                    setIsModalOpen(false)
                    setEditingLocation(null)
                  },
                }
              )
            } else {
              createMutation.mutate(data as CreateLocationDto, {
                onSuccess: () => {
                  setIsModalOpen(false)
                },
              })
            }
          }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

// Location Modal Component
interface LocationModalProps {
  location: Location | null
  onClose: () => void
  onSave: (data: CreateLocationDto | UpdateLocationDto) => void
  isSaving: boolean
}

function LocationModal({ location, onClose, onSave, isSaving }: LocationModalProps) {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || '',
    apartment: location?.apartment || '',
    city: location?.city || '',
    state: location?.state || '',
    country: location?.country || 'US', // Default to US
    postalCode: location?.postalCode || '',
    isDefault: location?.isDefault || false,
  })

  // Get states for selected country
  const states = formData.country ? getStatesForCountry(formData.country) : null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // If country doesn't have states, remove state field
    const dataToSave = { ...formData }
    if (!states) {
      dataToSave.state = ''
    }

    onSave(dataToSave)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {location ? 'Edit Location' : 'Add Location'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Main Warehouse"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apartment/Suite
            </label>
            <input
              type="text"
              value={formData.apartment}
              onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
              placeholder="Suite 100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country *
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '' })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            >
              <option value="">Select a country...</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="New York"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                placeholder="10001"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* State/Province field - only show for countries with states */}
          {states && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State/Province *
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="">Select a state/province...</option>
                {states.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name} ({state.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">Set as default location</span>
          </label>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {location ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
