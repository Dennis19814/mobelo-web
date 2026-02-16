'use client';

import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { apiService } from '@/lib/api-service';
import {
  Truck,
  Plus,
  Search,
  Loader2,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  Weight,
  Percent,
  Calendar
} from 'lucide-react';

// Lazy load modals
const ShippingRateModal = lazy(() => import('../modals/ShippingRateModal'));
const DeleteConfirmationModal = lazy(() => import('@/components/modals/DeleteConfirmationModal'));

interface ShippingRatesSectionProps {
  appId: number;
  apiKey: string;
  appSecretKey: string;
}

interface ShippingZone {
  id: number;
  name: string;
  description?: string;
  countries?: string[];
  states?: string[];
  isActive: boolean;
}

interface ShippingRate {
  id: number;
  appId: number;
  zoneId: number;
  name: string;
  description?: string;
  method: 'flat_rate' | 'weight_based' | 'price_based' | 'free' | 'pickup';
  baseRate?: number;
  pricePerKg?: number;
  percentageOfTotal?: number;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  freeShippingThreshold?: number;
  minWeight?: number;
  maxWeight?: number;
  deliveryMinDays?: number;
  deliveryMaxDays?: number;
  isActive: boolean;
  isTaxable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const ShippingRatesSection = ({ appId, apiKey, appSecretKey }: ShippingRatesSectionProps) => {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rateToDelete, setRateToDelete] = useState<ShippingRate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const MIN_LOADING_MS = 400;

  const fetchZones = useCallback(async () => {
    const startedAt = Date.now();
    try {
      setZonesLoading(true);
      const response = await apiService.getShippingZones();

      // Skip error handling for cancelled requests (React Strict Mode)
      if ((response as any).cancelled) {
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch shipping zones');
      }

      const zonesData = response.data || [];
      setZones(zonesData);

      // Select first zone by default; if no zones, no rates to load
      if (zonesData.length > 0 && !selectedZoneId) {
        setSelectedZoneId(zonesData[0].id);
      } else if (zonesData.length === 0) {
        setLoading(false);
      }
    } catch (err) {
      // Ignore AbortErrors from React Strict Mode
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching zones:', err);
      setError(err instanceof Error ? err.message : 'Failed to load zones');
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
      setZonesLoading(false);
    }
  }, [selectedZoneId]);

  const fetchRates = useCallback(async (zoneId: number) => {
    const startedAt = Date.now();
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getShippingRatesByZone(zoneId);

      // Skip error handling for cancelled requests (React Strict Mode)
      if ((response as any).cancelled) {
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch shipping rates');
      }

      setRates(response.data || []);
    } catch (err) {
      // Ignore AbortErrors from React Strict Mode
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching shipping rates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rates');
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  useEffect(() => {
    if (selectedZoneId) {
      fetchRates(selectedZoneId);
    }
  }, [selectedZoneId, fetchRates]);

  const handleDelete = async () => {
    if (!rateToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await apiService.deleteShippingRate(rateToDelete.id);

      if (!response.ok) {
        throw new Error(response.data?.message || 'Failed to delete rate');
      }

      setSuccessMessage('Shipping rate deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      setIsDeleteModalOpen(false);
      setRateToDelete(null);
      if (selectedZoneId) {
        await fetchRates(selectedZoneId);
      }
    } catch (err) {
      console.error('Error deleting rate:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete rate');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDuplicate = async (rate: ShippingRate) => {
    try {
      const response = await apiService.duplicateShippingRate(rate.id);

      if (!response.ok) {
        throw new Error('Failed to duplicate rate');
      }

      setSuccessMessage('Shipping rate duplicated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);

      if (selectedZoneId) {
        await fetchRates(selectedZoneId);
      }
    } catch (err) {
      console.error('Error duplicating rate:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate rate');
    }
  };

  const handleToggleActive = async (rate: ShippingRate) => {
    try {
      const response = await apiService.updateShippingRate(rate.id, {
        isActive: !rate.isActive
      });

      if (!response.ok) {
        throw new Error('Failed to update rate');
      }

      if (selectedZoneId) {
        await fetchRates(selectedZoneId);
      }
    } catch (err) {
      console.error('Error toggling rate status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update rate');
    }
  };

  const getMethodBadge = (method: string) => {
    const badges = {
      flat_rate: { label: 'Flat Rate', icon: DollarSign, color: 'bg-blue-100 text-blue-800' },
      weight_based: { label: 'Weight Based', icon: Weight, color: 'bg-purple-100 text-purple-800' },
      price_based: { label: 'Price Based', icon: Percent, color: 'bg-green-100 text-green-800' },
      free: { label: 'Free', icon: Package, color: 'bg-teal-100 text-teal-800' },
      pickup: { label: 'Pickup', icon: Truck, color: 'bg-orange-100 text-orange-800' },
    };

    const badge = badges[method as keyof typeof badges] || badges.flat_rate;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '-';
    const numPrice = typeof price === 'number' ? price : parseFloat(String(price));
    if (isNaN(numPrice)) return '-';
    return `$${numPrice.toFixed(2)}`;
  };

  const filteredRates = rates.filter(rate =>
    rate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rate.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-orange-600" />
            Shipping Rates
          </h1>
          <p className="text-gray-600 mt-1">
            Manage shipping rates for each zone
          </p>
        </div>
        <button
          onClick={() => {
            if (!selectedZoneId) {
              setError('Please select a zone first');
              return;
            }
            setSelectedRate(null);
            setIsModalOpen(true);
          }}
          disabled={!selectedZoneId}
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Rate
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message - only when not loading */}
      {!zonesLoading && !loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* When loading: show only spinner (same as Shipping Zones) */}
      {zonesLoading || (zones.length > 0 && loading) ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : zones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Truck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No shipping zones found
          </h3>
          <p className="text-gray-600 mb-4">
            Please create shipping zones first before adding rates
          </p>
        </div>
      ) : (
        <>
          {/* Zone Selector */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Zone
            </label>
            <select
              value={selectedZoneId || ''}
              onChange={(e) => setSelectedZoneId(Number(e.target.value))}
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} {zone.countries && zone.countries.length > 0 && `(${zone.countries.join(', ')})`}
                </option>
              ))}
            </select>
            {selectedZone && selectedZone.description && (
              <p className="text-sm text-gray-500 mt-2">{selectedZone.description}</p>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search rates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Rates List */}
          {filteredRates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <Truck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No rates found' : 'No shipping rates yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : `Create shipping rates for ${selectedZone?.name}`}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    setSelectedRate(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Rate
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
                        Rate Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Base Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Delivery Time
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
                    {filteredRates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{rate.name}</div>
                            {rate.description && (
                              <div className="text-sm text-gray-500">{rate.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getMethodBadge(rate.method)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {rate.method === 'free' || rate.method === 'pickup'
                              ? 'Free'
                              : formatPrice(rate.baseRate)}
                          </div>
                          {rate.freeShippingThreshold && (
                            <div className="text-xs text-green-600">
                              Free over {formatPrice(rate.freeShippingThreshold)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {rate.deliveryMinDays !== undefined && rate.deliveryMaxDays !== undefined ? (
                            <div className="text-sm text-gray-900 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {rate.deliveryMinDays === rate.deliveryMaxDays
                                ? `${rate.deliveryMinDays} days`
                                : `${rate.deliveryMinDays}-${rate.deliveryMaxDays} days`}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(rate)}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              rate.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {rate.isActive ? (
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
                                setSelectedRate(rate);
                                setIsModalOpen(true);
                              }}
                              className="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded transition-colors"
                              title="Edit rate"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(rate)}
                              className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                              title="Duplicate rate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setRateToDelete(rate);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                              title="Delete rate"
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
          <ShippingRateModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedRate(null);
            }}
            onSuccess={() => {
              setIsModalOpen(false);
              setSelectedRate(null);
              if (selectedZoneId) {
                fetchRates(selectedZoneId);
              }
            }}
            rate={selectedRate}
            zoneId={selectedZoneId!}
          />
        )}

        {isDeleteModalOpen && rateToDelete && (
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setRateToDelete(null);
            }}
            onConfirm={handleDelete}
            title="Delete Shipping Rate"
            message={`Are you sure you want to delete "${rateToDelete.name}"? This action cannot be undone.`}
          />
        )}
      </Suspense>
    </div>
  );
};

export default ShippingRatesSection;
