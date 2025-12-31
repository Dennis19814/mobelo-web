'use client';

import { useState, useEffect } from 'react';
import { Save, RotateCcw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  badge?: string;
  limitedTime: boolean;
  backgroundColor: string;
  textColor: string;
}

interface BannerJsonEditorProps {
  appId: number;
  initialValue?: BannerItem[];
  onSave?: (banners: BannerItem[]) => Promise<void>;
}

const DEFAULT_BANNERS: BannerItem[] = [
  {
    id: '1',
    title: 'SUMMER SALE',
    subtitle: 'Up to 70% off on selected items',
    buttonText: 'SHOP NOW',
    badge: 'HOT DEAL',
    limitedTime: true,
    backgroundColor: '#FF6B6B',
    textColor: '#FFFFFF',
  },
  {
    id: '2',
    title: 'NEW COLLECTION',
    subtitle: 'Discover the latest trends',
    buttonText: 'EXPLORE',
    badge: 'LIMITED EDITION',
    limitedTime: false,
    backgroundColor: '#E8F4F8',
    textColor: '#1A202C',
  },
  {
    id: '3',
    title: 'FREE SHIPPING',
    subtitle: 'On orders over $50',
    buttonText: 'LEARN MORE',
    limitedTime: false,
    backgroundColor: '#4ECDC4',
    textColor: '#FFFFFF',
  },
  {
    id: '4',
    title: 'MEMBER REWARDS',
    subtitle: 'Earn points on every purchase',
    buttonText: 'JOIN NOW',
    badge: 'NEW',
    limitedTime: false,
    backgroundColor: '#2D3748',
    textColor: '#F7FAFC',
  },
];

export function BannerJsonEditor({ appId, initialValue, onSave }: BannerJsonEditorProps) {
  const [jsonText, setJsonText] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const initial = initialValue || DEFAULT_BANNERS;
    setJsonText(JSON.stringify(initial, null, 2));
  }, [initialValue]);

  const validateJson = (text: string): { valid: boolean; error?: string; data?: BannerItem[] } => {
    try {
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        return { valid: false, error: 'JSON must be an array of banner objects' };
      }

      if (parsed.length > 10) {
        return { valid: false, error: 'Maximum 10 banners allowed' };
      }

      for (let i = 0; i < parsed.length; i++) {
        const banner = parsed[i];
        if (!banner.id || typeof banner.id !== 'string') {
          return { valid: false, error: `Banner ${i + 1}: 'id' is required and must be a string` };
        }
        if (!banner.title || typeof banner.title !== 'string') {
          return { valid: false, error: `Banner ${i + 1}: 'title' is required and must be a string` };
        }
        if (!banner.subtitle || typeof banner.subtitle !== 'string') {
          return { valid: false, error: `Banner ${i + 1}: 'subtitle' is required and must be a string` };
        }
        if (!banner.buttonText || typeof banner.buttonText !== 'string') {
          return { valid: false, error: `Banner ${i + 1}: 'buttonText' is required and must be a string` };
        }
        if (typeof banner.limitedTime !== 'boolean') {
          return { valid: false, error: `Banner ${i + 1}: 'limitedTime' is required and must be a boolean` };
        }
        if (!banner.backgroundColor || !/^#[0-9A-Fa-f]{6}$/.test(banner.backgroundColor)) {
          return { valid: false, error: `Banner ${i + 1}: 'backgroundColor' must be a valid hex color (e.g., #FF6B6B)` };
        }
        if (!banner.textColor || !/^#[0-9A-Fa-f]{6}$/.test(banner.textColor)) {
          return { valid: false, error: `Banner ${i + 1}: 'textColor' must be a valid hex color (e.g., #FFFFFF)` };
        }
      }

      return { valid: true, data: parsed };
    } catch (e) {
      return { valid: false, error: e instanceof Error ? e.message : 'Invalid JSON syntax' };
    }
  };

  const handleChange = (value: string) => {
    setJsonText(value);
    const result = validateJson(value);
    setIsValid(result.valid);
    setError(result.error || null);
    setSuccessMessage(null);
  };

  const handleSave = async () => {
    const result = validateJson(jsonText);
    if (!result.valid || !result.data) {
      setError(result.error || 'Invalid JSON');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (onSave) {
        await onSave(result.data);
      }
      setSuccessMessage('Banner configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save banner configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setJsonText(JSON.stringify(DEFAULT_BANNERS, null, 2));
    setIsValid(true);
    setError(null);
    setSuccessMessage(null);
  };

  const parsedData = isValid ? validateJson(jsonText).data : null;

  return (
    <div className="space-y-4 min-w-0 overflow-hidden">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 min-w-0">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 text-sm break-words">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 min-w-0">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm break-words">{error}</p>
          </div>
        </div>
      )}

      {/* JSON Editor */}
      <div className="min-w-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">Banner JSON Configuration</label>
        <textarea
          value={jsonText}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full h-64 md:h-96 px-4 py-3 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 overflow-x-auto min-w-0 ${
            isValid ? 'border-gray-300 bg-gray-50' : 'border-red-300 bg-red-50'
          }`}
          style={{ fontFamily: 'monospace' }}
          spellCheck={false}
        />
        <p className="text-xs text-gray-500 mt-2">{jsonText.length} characters</p>
      </div>

      {/* Color Preview */}
      {parsedData && parsedData.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-w-0 overflow-hidden">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Preview ({parsedData.length} banner{parsedData.length !== 1 ? 's' : ''})</h4>
          <div className="space-y-3">
            {parsedData.map((banner, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white rounded border border-gray-200 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">{banner.title}</p>
                  <p className="text-xs text-gray-600 break-words">{banner.subtitle}</p>
                  {banner.badge && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded break-words">
                      {banner.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      className="w-12 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: banner.backgroundColor }}
                    />
                    <span className="text-xs text-gray-500 font-mono break-all">{banner.backgroundColor}</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      className="w-12 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: banner.textColor }}
                    />
                    <span className="text-xs text-gray-500 font-mono break-all">{banner.textColor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={handleReset}
          disabled={saving}
          className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-0 overflow-hidden">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 min-w-0">
            <p className="font-medium mb-1">Banner JSON Requirements:</p>
            <ul className="list-disc list-inside space-y-1 text-xs break-words">
              <li>Maximum 10 banners</li>
              <li className="break-words">Required fields: id, title, subtitle, buttonText, limitedTime, backgroundColor, textColor</li>
              <li>Colors must be in hex format (e.g., #FF6B6B)</li>
              <li>Optional fields: badge</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
