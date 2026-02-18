'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { Users, Search, Plus, Loader2, Edit2, XCircle, CheckCircle, BarChart3, Mail, Phone, MapPin, X } from 'lucide-react'
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeactivateSupplier,
  useActivateSupplier,
  useSupplierStats,
} from '@/hooks/useSuppliers'
import type { Supplier, CreateSupplierDto, UpdateSupplierDto } from '@/types/purchase-order.types'
import toast from 'react-hot-toast'
import { COUNTRIES } from '@/constants/countries'

// Lazy load modals for better performance
const DeleteConfirmationModal = lazy(() => import('@/components/modals/DeleteConfirmationModal'))

export default function SuppliersSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [statsSupplier, setStatsSupplier] = useState<Supplier | null>(null)
  const [supplierToDeactivate, setSupplierToDeactivate] = useState<Supplier | null>(null)

  // Fetch suppliers
  const { data: suppliersData, isLoading, error } = useSuppliers({
    search: searchQuery || undefined,
    status: showInactive ? undefined : 'active',
    limit: 100,
  })

  const suppliers = suppliersData?.data || []
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const deactivateMutation = useDeactivateSupplier()
  const activateMutation = useActivateSupplier()

  const handleCreate = useCallback(() => {
    setEditingSupplier(null)
    setIsModalOpen(true)
  }, [])

  const handleEdit = useCallback((supplier: Supplier) => {
    setEditingSupplier(supplier)
    setIsModalOpen(true)
  }, [])

  const handleDeactivate = useCallback((supplier: Supplier) => {
    setSupplierToDeactivate(supplier)
  }, [])

  const handleConfirmDeactivate = useCallback(async () => {
    if (!supplierToDeactivate) return
    deactivateMutation.mutate(supplierToDeactivate.id)
    setSupplierToDeactivate(null)
  }, [supplierToDeactivate, deactivateMutation])

  const handleActivate = useCallback((supplier: Supplier) => {
    activateMutation.mutate(supplier.id)
  }, [activateMutation])

  const handleViewStats = useCallback((supplier: Supplier) => {
    setStatsSupplier(supplier)
  }, [])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl  font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Suppliers
            </h1>
            <p className="text-gray-600 mt-1">Manage supplier contacts and information</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
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
          Failed to load suppliers. Please try again.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && suppliers.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No suppliers found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first supplier'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          )}
        </div>
      )}

      {/* Suppliers Grid */}
      {!isLoading && !error && suppliers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier: Supplier) => (
            <div
              key={supplier.id}
              className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                supplier.status === 'inactive' ? 'opacity-60' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{supplier.company}</h3>
                  <span className={`text-xs ${
                    supplier.status === 'active' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {supplier.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleViewStats(supplier)}
                    className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="View statistics"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(supplier)}
                    className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded"
                    title="Edit supplier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {supplier.status === 'active' ? (
                    <button
                      onClick={() => handleDeactivate(supplier)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Deactivate supplier"
                      disabled={deactivateMutation.isPending}
                    >
                      {deactivateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(supplier)}
                      className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                      title="Activate supplier"
                      disabled={activateMutation.isPending}
                    >
                      {activateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{supplier.contactName}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="truncate">{supplier.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{supplier.phoneCountryCode} {supplier.phoneNumber}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">
                    {supplier.city}, {supplier.country}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <SupplierModal
          supplier={editingSupplier}
          onClose={() => {
            setIsModalOpen(false)
            setEditingSupplier(null)
          }}
          onSave={(data) => {
            if (editingSupplier) {
              updateMutation.mutate(
                { id: editingSupplier.id, data: data as UpdateSupplierDto },
                {
                  onSuccess: () => {
                    setIsModalOpen(false)
                    setEditingSupplier(null)
                  },
                }
              )
            } else {
              createMutation.mutate(data as CreateSupplierDto, {
                onSuccess: () => {
                  setIsModalOpen(false)
                },
              })
            }
          }}
          isSaving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Stats Modal */}
      {statsSupplier && (
        <SupplierStatsModal
          supplier={statsSupplier}
          onClose={() => setStatsSupplier(null)}
        />
      )}

      {/* Delete/Deactivate Confirmation Modal */}
      {supplierToDeactivate && (
        <Suspense fallback={null}>
          <DeleteConfirmationModal
            isOpen={!!supplierToDeactivate}
            onClose={() => setSupplierToDeactivate(null)}
            onConfirm={handleConfirmDeactivate}
            title="Deactivate Supplier"
            message={`This will mark the supplier "${supplierToDeactivate.company}" as inactive. You can reactivate them later.`}
            itemName={supplierToDeactivate.company}
            itemType="supplier"
            confirmButtonText="Deactivate"
            cancelButtonText="Cancel"
          />
        </Suspense>
      )}
    </div>
  )
}

// Supplier Modal Component
interface SupplierModalProps {
  supplier: Supplier | null
  onClose: () => void
  onSave: (data: CreateSupplierDto | UpdateSupplierDto) => void
  isSaving: boolean
}

function SupplierModal({ supplier, onClose, onSave, isSaving }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    company: supplier?.company || '',
    contactName: supplier?.contactName || '',
    email: supplier?.email || '',
    phoneCountryCode: supplier?.phoneCountryCode || '+1',
    phoneNumber: supplier?.phoneNumber || '',
    address: supplier?.address || '',
    apartment: supplier?.apartment || '',
    city: supplier?.city || '',
    country: supplier?.country || '',
    postalCode: supplier?.postalCode || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {supplier ? 'Edit Supplier' : 'Add Supplier'}
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
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Company Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="ABC Supplies Inc."
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Contact Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="John Doe"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@supplier.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code *
                </label>
                <select
                  value={formData.phoneCountryCode}
                  onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                >
                  <option value="+1">🇺🇸 +1 (US/CA)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+61">🇦🇺 +61 (AU)</option>
                  <option value="+64">🇳🇿 +64 (NZ)</option>
                  <option value="+91">🇮🇳 +91 (IN)</option>
                  <option value="+86">🇨🇳 +86 (CN)</option>
                  <option value="+81">🇯🇵 +81 (JP)</option>
                  <option value="+82">🇰🇷 +82 (KR)</option>
                  <option value="+65">🇸🇬 +65 (SG)</option>
                  <option value="+852">🇭🇰 +852 (HK)</option>
                  <option value="+971">🇦🇪 +971 (AE)</option>
                  <option value="+966">🇸🇦 +966 (SA)</option>
                  <option value="+33">🇫🇷 +33 (FR)</option>
                  <option value="+49">🇩🇪 +49 (DE)</option>
                  <option value="+39">🇮🇹 +39 (IT)</option>
                  <option value="+34">🇪🇸 +34 (ES)</option>
                  <option value="+31">🇳🇱 +31 (NL)</option>
                  <option value="+32">🇧🇪 +32 (BE)</option>
                  <option value="+41">🇨🇭 +41 (CH)</option>
                  <option value="+43">🇦🇹 +43 (AT)</option>
                  <option value="+46">🇸🇪 +46 (SE)</option>
                  <option value="+47">🇳🇴 +47 (NO)</option>
                  <option value="+45">🇩🇰 +45 (DK)</option>
                  <option value="+358">🇫🇮 +358 (FI)</option>
                  <option value="+353">🇮🇪 +353 (IE)</option>
                  <option value="+351">🇵🇹 +351 (PT)</option>
                  <option value="+30">🇬🇷 +30 (GR)</option>
                  <option value="+48">🇵🇱 +48 (PL)</option>
                  <option value="+420">🇨🇿 +420 (CZ)</option>
                  <option value="+36">🇭🇺 +36 (HU)</option>
                  <option value="+40">🇷🇴 +40 (RO)</option>
                  <option value="+7">🇷🇺 +7 (RU/KZ)</option>
                  <option value="+90">🇹🇷 +90 (TR)</option>
                  <option value="+972">🇮🇱 +972 (IL)</option>
                  <option value="+20">🇪🇬 +20 (EG)</option>
                  <option value="+27">🇿🇦 +27 (ZA)</option>
                  <option value="+234">🇳🇬 +234 (NG)</option>
                  <option value="+254">🇰🇪 +254 (KE)</option>
                  <option value="+55">🇧🇷 +55 (BR)</option>
                  <option value="+52">🇲🇽 +52 (MX)</option>
                  <option value="+54">🇦🇷 +54 (AR)</option>
                  <option value="+56">🇨🇱 +56 (CL)</option>
                  <option value="+57">🇨🇴 +57 (CO)</option>
                  <option value="+51">🇵🇪 +51 (PE)</option>
                  <option value="+62">🇮🇩 +62 (ID)</option>
                  <option value="+60">🇲🇾 +60 (MY)</option>
                  <option value="+66">🇹🇭 +66 (TH)</option>
                  <option value="+63">🇵🇭 +63 (PH)</option>
                  <option value="+84">🇻🇳 +84 (VN)</option>
                  <option value="+880">🇧🇩 +880 (BD)</option>
                  <option value="+94">🇱🇰 +94 (LK)</option>
                  <option value="+92">🇵🇰 +92 (PK)</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="555-1234"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Address</h3>

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="">Select a country...</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {supplier ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Supplier Stats Modal
interface SupplierStatsModalProps {
  supplier: Supplier
  onClose: () => void
}

function SupplierStatsModal({ supplier, onClose }: SupplierStatsModalProps) {
  const { data: stats, isLoading } = useSupplierStats(supplier.id)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Supplier Statistics</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900">{supplier.company}</h3>
            <p className="text-sm text-gray-600">{supplier.email}</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-orange-600 animate-spin" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalPOs ?? 0}</div>
                <div className="text-xs text-blue-700 mt-1">Total POs</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.activePOs ?? 0}</div>
                <div className="text-xs text-orange-700 mt-1">Active POs</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">${(stats.totalSpent ?? 0).toLocaleString()}</div>
                <div className="text-xs text-green-700 mt-1">Total Spent</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-600">No statistics available</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
