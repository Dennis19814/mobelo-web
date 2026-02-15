'use client';
import { useState, useEffect } from 'react';
import { MapPin, Save, Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { apiService } from '@/lib/api-service';

interface SettingsStoreOriginSectionProps {
  appId: number;
}

export default function SettingsStoreOriginSection({ appId }: SettingsStoreOriginSectionProps) {
  const [formData, setFormData] = useState({
    originCountry: '',
    originState: '',
    originCity: '',
    originPostalCode: '',
    originAddress: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch existing origin data
  useEffect(() => {
    const fetchOrigin = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getAppOrigin(appId);

        if (response.ok && response.data) {
          setFormData({
            originCountry: response.data.originCountry || '',
            originState: response.data.originState || '',
            originCity: response.data.originCity || '',
            originPostalCode: response.data.originPostalCode || '',
            originAddress: response.data.originAddress || '',
          });
        }
      } catch (err) {
        console.error('Error fetching origin:', err);
        setError(err instanceof Error ? err.message : 'Failed to load origin');
      } finally {
        setLoading(false);
      }
    };

    fetchOrigin();
  }, [appId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (formData.originCountry && formData.originCountry.length !== 2) {
      setError('Country code must be exactly 2 letters (ISO 3166-1 alpha-2)');
      return;
    }

    if (formData.originCountry && !/^[A-Z]{2}$/.test(formData.originCountry)) {
      setError('Country code must be 2 uppercase letters (e.g., US, CA, GB)');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await apiService.updateAppOrigin(appId, formData);

      if (response.ok) {
        setSuccessMessage('Store origin updated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.data?.message || 'Failed to update origin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update origin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <MapPin className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Store Origin</h2>
            <p className="text-sm text-gray-500 mt-1">
              Set your store's shipping origin for domestic/international classification
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mx-6 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium">Why set your store origin?</p>
          <p className="mt-1">
            Your store's origin location is used to automatically classify shipping zones as:
          </p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li><strong>Domestic:</strong> Same country as your store</li>
            <li><strong>Regional:</strong> Nearby countries</li>
            <li><strong>International:</strong> Rest of world</li>
          </ul>
          <p className="mt-2">
            This helps you set appropriate shipping rates and understand your shipping costs better.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.originCountry}
            onChange={(e) => setFormData({ ...formData, originCountry: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="e.g., US, CA, GB, DE"
            maxLength={2}
          />
          <p className="text-xs text-gray-500 mt-1">
            ISO 3166-1 alpha-2 country code (2 letters, e.g., US for United States, CA for Canada)
          </p>
        </div>

        {/* State/Province */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State/Province
          </label>
          <input
            type="text"
            value={formData.originState}
            onChange={(e) => setFormData({ ...formData, originState: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="e.g., CA, NY, ON"
            maxLength={10}
          />
          <p className="text-xs text-gray-500 mt-1">
            State or province code (e.g., CA for California, NY for New York, ON for Ontario)
          </p>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City
          </label>
          <input
            type="text"
            value={formData.originCity}
            onChange={(e) => setFormData({ ...formData, originCity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="e.g., Los Angeles, New York, Toronto"
            maxLength={100}
          />
        </div>

        {/* Postal Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Postal/ZIP Code
          </label>
          <input
            type="text"
            value={formData.originPostalCode}
            onChange={(e) => setFormData({ ...formData, originPostalCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="e.g., 90001, 10001, M5V 3A8"
            maxLength={20}
          />
        </div>

        {/* Full Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Address (Optional)
          </label>
          <textarea
            value={formData.originAddress}
            onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows={3}
            placeholder="e.g., 123 Main St, Los Angeles, CA 90001, USA"
          />
          <p className="text-xs text-gray-500 mt-1">
            Complete address for display purposes (not used for calculations)
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Origin
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
