'use client';

import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { apiService } from '@/lib/api-service';
import {
  MapPin,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  AlertCircle,
  CheckCircle,
  Truck
} from 'lucide-react';

// Lazy load modals
const ShippingZoneModal = lazy(() => import('../modals/ShippingZoneModal'));
const DeleteConfirmationModal = lazy(() => import('@/components/modals/DeleteConfirmationModal'));

interface ShippingZonesSectionProps {
  appId: number;
  apiKey: string;
  appSecretKey: string;
}

interface ShippingZone {
  id: number;
  appId: number;
  name: string;
  description?: string;
  countries?: string[];
  states?: string[];
  type?: 'domestic' | 'regional' | 'international' | 'custom';
  isActive: boolean;
  displayOrder: number;
  rateCount?: number;
  createdAt: string;
  updatedAt: string;
}

const ShippingZonesSection = ({ appId, apiKey, appSecretKey }: ShippingZonesSectionProps) => {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<ShippingZone | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createDefaultLoading, setCreateDefaultLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const hasLoadedSuccessfullyRef = useRef(false);
  const fetchIdRef = useRef(0);

  const fetchZones = useCallback(async () => {
    const thisId = ++fetchIdRef.current;
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getShippingZones();

      if (thisId !== fetchIdRef.current) return;

      // Skip error handling for cancelled requests (React Strict Mode)
      if ((response as any).cancelled) {
        if (thisId === fetchIdRef.current) setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch shipping zones');
      }

      hasLoadedSuccessfullyRef.current = true;
      setZones(response.data || []);
      setError(null);
    } catch (err) {
      if (thisId !== fetchIdRef.current) return;
      // Ignore AbortErrors from React Strict Mode
      if (err instanceof Error && err.name === 'AbortError') {
        if (thisId === fetchIdRef.current) setLoading(false);
        return;
      }
      console.error('Error fetching shipping zones:', err);
      if (!hasLoadedSuccessfullyRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load zones');
      }
    } finally {
      if (thisId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleCreateDefault = async () => {
    try {
      setCreateDefaultLoading(true);
      setError(null);

      const response = await apiService.createDefaultShippingZones('US');

      if (!response.ok) {
        throw new Error('Failed to create default zones');
      }

      setSuccessMessage('Default shipping zones and rates created successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);

      await fetchZones();
    } catch (err) {
      console.error('Error creating default zones:', err);
      setError(err instanceof Error ? err.message : 'Failed to create default zones');
    } finally {
      setCreateDefaultLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!zoneToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await apiService.deleteShippingZone(zoneToDelete.id);

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to delete zone');
      }

      setSuccessMessage('Shipping zone deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      setIsDeleteModalOpen(false);
      setZoneToDelete(null);
      await fetchZones();
    } catch (err) {
      console.error('Error deleting zone:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete zone');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleActive = async (zone: ShippingZone) => {
    try {
      const response = await apiService.updateShippingZone(zone.id, {
        isActive: !zone.isActive
      });

      if (!response.ok) {
        throw new Error('Failed to update zone');
      }

      await fetchZones();
    } catch (err) {
      console.error('Error toggling zone status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update zone');
    }
  };

  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    zone.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-orange-600" />
            Shipping Zones
          </h1>
          <p className="text-gray-600 mt-1">
            Manage geographic regions for shipping rates
          </p>
        </div>
        <div className="flex gap-2">
          {zones.length === 0 && !loading && (
            <button
              onClick={handleCreateDefault}
              disabled={createDefaultLoading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {createDefaultLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Create Default Zones
                </>
              )}
            </button>
          )}
          <button
            onClick={() => {
              setSelectedZone(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Zone
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* When loading: show prominent loader only (no search, no content, no error) */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : null}

      {/* Content - only show when not loading */}
      {!loading && (
        <>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search zones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoComplete="off"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Zones List */}
      {filteredZones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No zones found' : 'No shipping zones yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first shipping zone to define where you ship'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleCreateDefault}
              disabled={createDefaultLoading}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {createDefaultLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Create Default Zones
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Zone Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Coverage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredZones.map((zone) => (
                  <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{zone.name}</div>
                        {zone.description && (
                          <div className="text-sm text-gray-500">{zone.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {zone.countries && zone.countries.length > 0 ? (
                          <div>
                            <span className="font-medium">Countries:</span> {zone.countries.join(', ')}
                          </div>
                        ) : (
                          <span className="text-gray-500">Rest of world</span>
                        )}
                        {zone.states && zone.states.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            States: {zone.states.join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Truck className="w-3 h-3 mr-1" />
                        {zone.rateCount || 0} rates
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(zone)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          zone.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {zone.isActive ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedZone(zone);
                            setIsModalOpen(true);
                          }}
                          className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded transition-colors"
                          title="Edit zone"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setZoneToDelete(zone);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                          title="Delete zone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        {isModalOpen && (
          <ShippingZoneModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedZone(null);
            }}
            onSuccess={() => {
              setIsModalOpen(false);
              setSelectedZone(null);
              setSearchQuery(''); // Clear search so new/updated zone is visible in the list
              fetchZones();
            }}
            zone={selectedZone}
          />
        )}

        {isDeleteModalOpen && zoneToDelete && (
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setZoneToDelete(null);
            }}
            onConfirm={handleDelete}
            title="Delete Shipping Zone"
            message={`Are you sure you want to delete "${zoneToDelete.name}"? This will also delete all shipping rates associated with this zone.`}
          />
        )}
      </Suspense>
    </div>
  );
};

export default ShippingZonesSection;
