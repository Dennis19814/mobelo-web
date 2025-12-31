'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Code,
  Eye
} from 'lucide-react';

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

interface BannerVisualEditorProps {
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

export function BannerVisualEditor({ appId, initialValue, onSave }: BannerVisualEditorProps) {
  const [banners, setBanners] = useState<BannerItem[]>(initialValue || DEFAULT_BANNERS);
  const [expandedBanners, setExpandedBanners] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    const initial = initialValue || DEFAULT_BANNERS;
    setBanners(initial);
    setJsonText(JSON.stringify(initial, null, 2));
  }, [initialValue]);

  const toggleBanner = (id: string) => {
    setExpandedBanners(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const validateBanner = (banner: BannerItem, index: number): string | null => {
    if (!banner.title || banner.title.trim().length === 0) {
      return `Banner ${index + 1}: Title is required`;
    }
    if (banner.title.length > 100) {
      return `Banner ${index + 1}: Title must be 100 characters or less`;
    }
    if (!banner.subtitle || banner.subtitle.trim().length === 0) {
      return `Banner ${index + 1}: Subtitle is required`;
    }
    if (banner.subtitle.length > 200) {
      return `Banner ${index + 1}: Subtitle must be 200 characters or less`;
    }
    if (!banner.buttonText || banner.buttonText.trim().length === 0) {
      return `Banner ${index + 1}: Button text is required`;
    }
    if (banner.buttonText.length > 50) {
      return `Banner ${index + 1}: Button text must be 50 characters or less`;
    }
    if (banner.badge && banner.badge.length > 50) {
      return `Banner ${index + 1}: Badge must be 50 characters or less`;
    }
    if (!banner.backgroundColor || !/^#[0-9A-Fa-f]{6}$/.test(banner.backgroundColor)) {
      return `Banner ${index + 1}: Invalid background color (use hex format like #FF6B6B)`;
    }
    if (!banner.textColor || !/^#[0-9A-Fa-f]{6}$/.test(banner.textColor)) {
      return `Banner ${index + 1}: Invalid text color (use hex format like #FFFFFF)`;
    }
    return null;
  };

  const validateAllBanners = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (banners.length === 0) {
      setGlobalError('At least one banner is required');
      return false;
    }

    if (banners.length > 10) {
      setGlobalError('Maximum 10 banners allowed');
      return false;
    }

    banners.forEach((banner, index) => {
      const error = validateBanner(banner, index);
      if (error) {
        newErrors[banner.id] = error;
      }
    });

    setErrors(newErrors);
    setGlobalError(Object.keys(newErrors).length > 0 ? 'Please fix validation errors before saving' : null);
    return Object.keys(newErrors).length === 0;
  };

  const handleBannerChange = (id: string, field: keyof BannerItem, value: any) => {
    setBanners(prev => prev.map(b =>
      b.id === id ? { ...b, [field]: value } : b
    ));
    setSuccessMessage(null);
    setGlobalError(null);
    // Clear specific error for this banner
    setErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const addBanner = () => {
    if (banners.length >= 10) {
      setGlobalError('Maximum 10 banners allowed');
      return;
    }

    const newBanner: BannerItem = {
      id: Date.now().toString(),
      title: 'NEW BANNER',
      subtitle: 'Enter banner description',
      buttonText: 'CLICK HERE',
      badge: '',
      limitedTime: false,
      backgroundColor: '#4ECDC4',
      textColor: '#FFFFFF',
    };

    setBanners(prev => [...prev, newBanner]);
    setExpandedBanners(prev => {
      const next = new Set(prev);
      next.add(newBanner.id);
      return next;
    });
    setSuccessMessage(null);
    setGlobalError(null);
  };

  const deleteBanner = (id: string) => {
    if (banners.length === 1) {
      setGlobalError('At least one banner is required');
      return;
    }

    setBanners(prev => prev.filter(b => b.id !== id));
    setExpandedBanners(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setErrors(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSuccessMessage(null);
    setGlobalError(null);
  };

  const moveBanner = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === banners.length - 1)
    ) {
      return;
    }

    const newBanners = [...banners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];
    setBanners(newBanners);
  };

  const handleSave = async () => {
    if (!validateAllBanners()) {
      return;
    }

    setSaving(true);
    setGlobalError(null);
    setSuccessMessage(null);

    try {
      if (onSave) {
        await onSave(banners);
      }
      setSuccessMessage('Banner configuration saved successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Failed to save banner configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setBanners(DEFAULT_BANNERS);
    setExpandedBanners(new Set());
    setErrors({});
    setGlobalError(null);
    setSuccessMessage(null);
    setJsonText(JSON.stringify(DEFAULT_BANNERS, null, 2));
  };

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setBanners(parsed);
        setErrors({});
        setGlobalError(null);
      } else {
        setGlobalError('JSON must be an array of banner objects');
      }
    } catch (e) {
      setGlobalError('Invalid JSON syntax');
    }
  };

  const toggleMode = () => {
    if (!advancedMode) {
      // Switching to JSON mode
      setJsonText(JSON.stringify(banners, null, 2));
    } else {
      // Switching to visual mode
      try {
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed)) {
          setBanners(parsed);
          setGlobalError(null);
        }
      } catch (e) {
        setGlobalError('Cannot switch to visual mode: Invalid JSON');
        return;
      }
    }
    setAdvancedMode(!advancedMode);
  };

  if (advancedMode) {
    // JSON Editor Mode
    return (
      <div className="space-y-3 min-w-0 overflow-hidden">
        {/* Mode Toggle */}
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-gray-900">Banner Configuration</h3>
          <button
            onClick={toggleMode}
            className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Visual Editor
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 min-w-0">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-green-800 text-sm break-words">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {globalError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 min-w-0">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 text-sm break-words">{globalError}</p>
            </div>
          </div>
        )}

        {/* JSON Editor */}
        <div className="min-w-0">
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="w-full h-64 md:h-96 px-3 py-2 font-mono text-sm border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 overflow-x-auto min-w-0 border-gray-300 bg-gray-50"
            style={{ fontFamily: 'monospace' }}
            spellCheck={false}
          />
          <p className="text-xs text-gray-500 mt-1">{jsonText.length} characters</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center px-3 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center justify-center px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>
      </div>
    );
  }

  // Visual Editor Mode
  return (
    <div className="space-y-3 min-w-0 overflow-hidden">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Banner Configuration</h3>
          <p className="text-xs text-gray-600">{banners.length} banner{banners.length !== 1 ? 's' : ''} configured (max 10)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addBanner}
            disabled={banners.length >= 10}
            className="flex items-center px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Banner
          </button>
          <button
            onClick={toggleMode}
            className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Code className="w-4 h-4 mr-1.5" />
            JSON Mode
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 min-w-0">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 text-sm break-words">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Global Error Message */}
      {globalError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 min-w-0">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm break-words">{globalError}</p>
          </div>
        </div>
      )}

      {/* Banner List */}
      <div className="space-y-2">
        {banners.map((banner, index) => {
          const isExpanded = expandedBanners.has(banner.id);
          const hasError = errors[banner.id];

          return (
            <div
              key={banner.id}
              className={`bg-white border rounded-lg overflow-hidden ${
                hasError ? 'border-red-300' : 'border-gray-200'
              }`}
            >
              {/* Banner Header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleBanner(banner.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div
                    className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: banner.backgroundColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{banner.title}</p>
                    <p className="text-xs text-gray-500 truncate">{banner.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {index > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); moveBanner(index, 'up'); }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  )}
                  {index < banners.length - 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); moveBanner(index, 'down'); }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteBanner(banner.id); }}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Delete banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Banner Form (Expanded) */}
              {isExpanded && (
                <div className="p-3 border-t border-gray-200 bg-gray-50 space-y-3">
                  {hasError && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <p className="text-xs text-red-800">{hasError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Title */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={banner.title}
                        onChange={(e) => handleBannerChange(banner.id, 'title', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        maxLength={100}
                        placeholder="SUMMER SALE"
                      />
                      <p className="text-xs text-gray-500 mt-0.5">{banner.title.length}/100</p>
                    </div>

                    {/* Button Text */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Button Text <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={banner.buttonText}
                        onChange={(e) => handleBannerChange(banner.id, 'buttonText', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        maxLength={50}
                        placeholder="SHOP NOW"
                      />
                      <p className="text-xs text-gray-500 mt-0.5">{banner.buttonText.length}/50</p>
                    </div>
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Subtitle <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={banner.subtitle}
                      onChange={(e) => handleBannerChange(banner.id, 'subtitle', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      maxLength={200}
                      placeholder="Up to 70% off on selected items"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">{banner.subtitle.length}/200</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Badge */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Badge (Optional)
                      </label>
                      <input
                        type="text"
                        value={banner.badge || ''}
                        onChange={(e) => handleBannerChange(banner.id, 'badge', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        maxLength={50}
                        placeholder="HOT DEAL"
                      />
                      <p className="text-xs text-gray-500 mt-0.5">{(banner.badge || '').length}/50</p>
                    </div>

                    {/* Limited Time */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Limited Time Offer
                      </label>
                      <label className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={banner.limitedTime}
                          onChange={(e) => handleBannerChange(banner.id, 'limitedTime', e.target.checked)}
                          className="rounded text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-sm text-gray-700">Show limited time indicator</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Background Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Background Color <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={banner.backgroundColor}
                          onChange={(e) => handleBannerChange(banner.id, 'backgroundColor', e.target.value)}
                          className="w-12 h-9 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={banner.backgroundColor}
                          onChange={(e) => handleBannerChange(banner.id, 'backgroundColor', e.target.value)}
                          className="flex-1 px-2 py-1.5 text-sm font-mono border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="#FF6B6B"
                          pattern="^#[0-9A-Fa-f]{6}$"
                        />
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Text Color <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={banner.textColor}
                          onChange={(e) => handleBannerChange(banner.id, 'textColor', e.target.value)}
                          className="w-12 h-9 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={banner.textColor}
                          onChange={(e) => handleBannerChange(banner.id, 'textColor', e.target.value)}
                          className="flex-1 px-2 py-1.5 text-sm font-mono border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          placeholder="#FFFFFF"
                          pattern="^#[0-9A-Fa-f]{6}$"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Preview</label>
                    <div
                      className="p-3 rounded-lg border border-gray-300"
                      style={{
                        backgroundColor: banner.backgroundColor,
                        color: banner.textColor,
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold">{banner.title}</p>
                          <p className="text-xs opacity-90">{banner.subtitle}</p>
                        </div>
                        {banner.badge && (
                          <span className="px-2 py-0.5 text-xs bg-white/20 rounded">
                            {banner.badge}
                          </span>
                        )}
                      </div>
                      <button
                        className="px-3 py-1 text-xs font-medium rounded"
                        style={{
                          backgroundColor: banner.textColor,
                          color: banner.backgroundColor,
                        }}
                      >
                        {banner.buttonText}
                      </button>
                      {banner.limitedTime && (
                        <p className="text-xs mt-1 opacity-75">⏰ Limited Time</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || Object.keys(errors).length > 0}
          className="flex items-center justify-center px-3 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={handleReset}
          disabled={saving}
          className="flex items-center justify-center px-3 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Default
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 min-w-0 overflow-hidden">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 min-w-0">
            <p className="font-medium mb-1 text-xs">Tips:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs break-words">
              <li>Click banner header to expand/collapse</li>
              <li>Drag banners to reorder (use up/down arrows)</li>
              <li>Use color pickers or enter hex codes manually</li>
              <li>Preview shows how banner appears in mobile app</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
